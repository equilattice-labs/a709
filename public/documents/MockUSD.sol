// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Freely mintable testnet demonstration token, with no peg, backing or monetary value.
contract MockUSD is ERC20 {
    constructor() ERC20("Vestlyr Test USD", "tUSD") {}
    function decimals() public pure override returns (uint8) { return 6; }
    function mint(uint256 amount) external {
        require(amount > 0 && amount <= 10_000 * 10 ** 6, "Mint 0 < amount <= 10000 tUSD");
        _mint(msg.sender, amount);
    }
}
