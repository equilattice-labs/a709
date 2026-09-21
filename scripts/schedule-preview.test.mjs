import test from 'node:test';
import assert from 'node:assert/strict';
import { vestedAt, scheduleForPreview } from '../src/composables/scheduleMath.js';

const vesting = { amount: 1000n, cliffAmount: 250n, start: 100, cliff: 140, end: 200, interval: 10, kind: 0 };
test('separate cliff allocation and post-cliff cadence preserve exact boundaries', () => {
  for (const [time, value] of [[99,0n],[139,0n],[140,250n],[149,250n],[150,375n],[199,875n],[200,1000n],[201,1000n]]) assert.equal(vestedAt(vesting, time), value);
});
test('cancellation freezes the vested entitlement for later claims', () => {
  const cancelled = { ...vesting, cancelled: true, vestedAtCancel: 375n };
  assert.equal(vestedAt(cancelled, 200), 375n);
  assert.equal(vestedAt(cancelled, 500), 375n);
});
test('date locks and per-second streams have their own boundary behavior', () => {
  const lock = { ...vesting, kind: 1, start: 200, cliff: 200, interval: 0, cliffAmount: 0n };
  assert.equal(vestedAt(lock, 199), 0n); assert.equal(vestedAt(lock, 200), 1000n);
  const stream = { ...vesting, kind: 2, cliffAmount: 0n, start: 100, cliff: 100, interval: 1 };
  assert.equal(vestedAt(stream, 101), 10n); assert.equal(vestedAt(stream, 150), 500n);
});
test('a cadence longer than duration and final remainder release are represented', () => {
  assert.equal(vestedAt({ ...vesting, interval: 100 }, 199), 250n);
  assert.equal(vestedAt({ ...vesting, interval: 100 }, 200), 1000n);
  assert.equal(vestedAt({ ...vesting, amount: 1001n }, 150), 375n);
  assert.equal(vestedAt({ ...vesting, amount: 1001n }, 200), 1001n);
});
test('batch preview adds exact allocations and resolves now only for the preview', () => {
  const plan = { amounts: [100n, 200n], cliffAmounts: [10n, 20n], start: 0, cliff: 0, end: 400, interval: 60, kind: 3 };
  const preview = scheduleForPreview(plan, 100);
  assert.equal(preview.amount, 300n); assert.equal(preview.cliffAmount, 30n);
  assert.equal(preview.start, 100); assert.equal(preview.cliff, 100);
  assert.equal(plan.start, 0); assert.equal(vestedAt(preview, 100), 30n);
});
