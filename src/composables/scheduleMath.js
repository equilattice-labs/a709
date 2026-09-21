// Mirrors the documented V2 release rule using integer token units.
// This preview never authorizes a claim; the deployed contract is authoritative.
export function vestedAt(
  {
    amount,
    cliffAmount = 0n,
    start,
    cliff,
    end,
    interval,
    kind,
    cancelled,
    vestedAtCancel,
  },
  timestamp,
) {
  if (cancelled) return vestedAtCancel;
  if (timestamp < start || timestamp < cliff) return 0n;
  if (timestamp >= end) return amount;
  if (kind === 1) return 0n;
  const elapsed = Math.floor((timestamp - cliff) / interval) * interval;
  return (
    cliffAmount +
    ((amount - cliffAmount) * BigInt(elapsed)) / BigInt(end - cliff)
  );
}

export function scheduleForPreview(
  plan,
  timestamp = Math.floor(Date.now() / 1000),
) {
  const start = plan.start || timestamp;
  return {
    amount: plan.amounts.reduce((sum, value) => sum + value, 0n),
    cliffAmount: plan.cliffAmounts.reduce((sum, value) => sum + value, 0n),
    start,
    cliff: plan.cliff || start,
    end: plan.end,
    interval: plan.interval,
    kind: plan.kind,
  };
}
