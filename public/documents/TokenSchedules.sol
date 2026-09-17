// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

/// @notice Immutable ERC-20 schedules. No administrator, upgrade, fee or escrow withdrawal path.
/// @dev Only fixed-balance ERC-20s are supported. Incoming/outgoing balance deltas are checked;
/// future rebases or token-admin behavior cannot be predicted or prevented by an escrow.
contract TokenSchedules is ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant MAX_BATCH = 100;
    uint256 public nextId = 1;

    struct Schedule {
        address sender;
        address recipient;
        address token;
        uint256 amount;
        uint256 claimed;
        uint64 start;
        uint64 cliff;
        uint64 end;
        uint64 interval;
        uint8 kind;
        bool cancelable;
        bool cancelled;
    }

    mapping(uint256 => Schedule) public schedules;
    mapping(address => uint256[]) private senderIds;
    mapping(address => uint256[]) private recipientIds;
    mapping(uint256 => uint256) private recipientIndex;

    error InvalidSchedule();
    error InvalidRecipient();
    error InvalidBatch();
    error UnknownSchedule();
    error Unauthorized();
    error NothingToClaim();
    error CannotCancel();
    error UnsupportedToken();

    event ScheduleCreated(uint256 indexed id, address indexed sender, address indexed recipient,
        address token, uint256 amount, uint64 start, uint64 cliff, uint64 end,
        uint64 interval, uint8 kind, bool cancelable);
    event Claimed(uint256 indexed id, address indexed recipient, uint256 amount);
    event Cancelled(uint256 indexed id, address indexed sender, uint256 refunded);
    event RecipientTransferred(uint256 indexed id, address indexed oldRecipient, address indexed newRecipient);

    /// @param kind 0: stepped/linear vesting, 1: date lock, 2: per-second stream. Batch uses kind 3.
    function createSchedule(address token, address recipient, uint256 amount,
        uint64 start, uint64 cliff, uint64 end, uint64 interval, uint8 kind, bool cancelable)
        external nonReentrant returns (uint256 id)
    {
        if (kind > 2) revert InvalidSchedule();
        _validate(token, recipient, amount, start, cliff, end, interval, kind);
        _pull(token, amount);
        id = _store(token, recipient, amount, start, cliff, end, interval, kind, cancelable);
    }

    /// @notice All recipients and amounts are funded in one atomic transfer and transaction.
    function createBatch(address token, address[] calldata recipients, uint256[] calldata amounts,
        uint64 start, uint64 cliff, uint64 end, uint64 interval, bool cancelable)
        external nonReentrant returns (uint256[] memory ids)
    {
        uint256 length = recipients.length;
        if (length == 0 || length > MAX_BATCH || length != amounts.length) revert InvalidBatch();
        uint256 total;
        for (uint256 i; i < length; ++i) {
            _validate(token, recipients[i], amounts[i], start, cliff, end, interval, 3);
            total += amounts[i];
        }
        _pull(token, total);
        ids = new uint256[](length);
        for (uint256 i; i < length; ++i) {
            ids[i] = _store(token, recipients[i], amounts[i], start, cliff, end, interval, 3, cancelable);
        }
    }

    function getSenderIds(address account) external view returns (uint256[] memory) { return senderIds[account]; }
    function getRecipientIds(address account) external view returns (uint256[] memory) { return recipientIds[account]; }

    function vestedAmount(uint256 id) public view returns (uint256) {
        Schedule storage s = schedules[id];
        if (s.sender == address(0)) revert UnknownSchedule();
        if (s.cancelled || block.timestamp < s.cliff || block.timestamp < s.start) return 0;
        if (block.timestamp >= s.end) return s.amount;
        // A date lock has start == cliff == end, so it never enters this division.
        uint256 elapsed = ((block.timestamp - s.start) / s.interval) * s.interval;
        return Math.mulDiv(s.amount, elapsed, s.end - s.start);
    }

    function claimable(uint256 id) public view returns (uint256) {
        return vestedAmount(id) - schedules[id].claimed;
    }

    function claim(uint256 id) external nonReentrant returns (uint256 amount) {
        Schedule storage s = schedules[id];
        if (s.sender == address(0)) revert UnknownSchedule();
        if (msg.sender != s.recipient) revert Unauthorized();
        amount = claimable(id);
        if (amount == 0) revert NothingToClaim();
        s.claimed += amount;
        _push(s.token, s.recipient, amount);
        emit Claimed(id, s.recipient, amount);
    }

    /// @notice Cancellation refunds the full deposit and is possible only BEFORE the stored start.
    function cancel(uint256 id) external nonReentrant {
        Schedule storage s = schedules[id];
        if (s.sender == address(0)) revert UnknownSchedule();
        if (msg.sender != s.sender) revert Unauthorized();
        if (!s.cancelable || s.cancelled || block.timestamp >= s.start) revert CannotCancel();
        s.cancelled = true;
        _push(s.token, s.sender, s.amount);
        emit Cancelled(id, s.sender, s.amount);
    }

    /// @notice Move the entire remaining entitlement to a different wallet, preserving its schedule.
    function transferRecipient(uint256 id, address newRecipient) external nonReentrant {
        Schedule storage s = schedules[id];
        if (s.sender == address(0)) revert UnknownSchedule();
        if (msg.sender != s.recipient) revert Unauthorized();
        if (newRecipient == address(0) || newRecipient == address(this) || newRecipient == s.recipient) revert InvalidRecipient();
        if (s.cancelled || s.claimed == s.amount) revert InvalidSchedule();
        address oldRecipient = s.recipient;
        uint256 index = recipientIndex[id];
        uint256 lastId = recipientIds[oldRecipient][recipientIds[oldRecipient].length - 1];
        recipientIds[oldRecipient][index] = lastId;
        recipientIndex[lastId] = index;
        recipientIds[oldRecipient].pop();
        recipientIndex[id] = recipientIds[newRecipient].length;
        recipientIds[newRecipient].push(id);
        s.recipient = newRecipient;
        emit RecipientTransferred(id, oldRecipient, newRecipient);
    }

    function _validate(address token, address recipient, uint256 amount,
        uint64 start, uint64 cliff, uint64 end, uint64 interval, uint8 kind) private view
    {
        if (recipient == address(0) || recipient == address(this)) revert InvalidRecipient();
        if (token.code.length == 0 || amount == 0 || start < block.timestamp) revert InvalidSchedule();
        if (kind == 1) {
            if (start != cliff || start != end || interval != 0) revert InvalidSchedule();
        } else {
            if (end <= start || cliff < start || cliff > end || interval == 0 || interval > end - start) revert InvalidSchedule();
            if (kind == 2 && interval != 1) revert InvalidSchedule();
        }
    }

    function _store(address token, address recipient, uint256 amount,
        uint64 start, uint64 cliff, uint64 end, uint64 interval, uint8 kind, bool cancelable) private returns (uint256 id)
    {
        id = nextId++;
        schedules[id] = Schedule(msg.sender, recipient, token, amount, 0, start, cliff, end, interval, kind, cancelable, false);
        senderIds[msg.sender].push(id);
        recipientIndex[id] = recipientIds[recipient].length;
        recipientIds[recipient].push(id);
        emit ScheduleCreated(id, msg.sender, recipient, token, amount, start, cliff, end, interval, kind, cancelable);
    }

    function _pull(address token, uint256 amount) private {
        IERC20 asset = IERC20(token);
        uint256 beforeBalance = asset.balanceOf(address(this));
        asset.safeTransferFrom(msg.sender, address(this), amount);
        if (asset.balanceOf(address(this)) != beforeBalance + amount) revert UnsupportedToken();
    }

    function _push(address token, address recipient, uint256 amount) private {
        IERC20 asset = IERC20(token);
        uint256 beforeBalance = asset.balanceOf(address(this));
        uint256 beforeRecipientBalance = asset.balanceOf(recipient);
        asset.safeTransfer(recipient, amount);
        if (asset.balanceOf(address(this)) + amount != beforeBalance ||
            asset.balanceOf(recipient) != beforeRecipientBalance + amount) revert UnsupportedToken();
    }
}
