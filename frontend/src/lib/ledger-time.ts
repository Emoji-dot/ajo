// Ledger-time reference for deadline displays (#352).
//
// Deadlines come from on-chain ledger seconds, so comparing them with the
// browser's wall clock can be a few minutes off. Use the latest closed ledger's
// close time instead, advanced by the local elapsed time while it is cached.
import { server } from "./contract";
import { cacheScope } from "./network-config";
import { rpcCache } from "./rpc-cache";

interface CachedLedgerTime {
  closeTimeSecs: number;
  fetchedAtMs: number;
}

/** Cache the ledger reference for the same 30s window as other RPC reads. */
export async function getLedgerNowSecs(): Promise<number> {
  const key = `ledger-time:${cacheScope()}`;
  const cached = rpcCache.get<CachedLedgerTime>(key);
  const nowMs = Date.now();

  if (cached) {
    return cached.closeTimeSecs + (nowMs - cached.fetchedAtMs) / 1000;
  }

  try {
    const latest = await server.getLatestLedger();
    const closeTimeSecs = Number(latest.closeTime);
    if (!Number.isFinite(closeTimeSecs)) {
      return nowMs / 1000;
    }
    rpcCache.set<CachedLedgerTime>(key, {
      closeTimeSecs,
      fetchedAtMs: nowMs,
    });
    return closeTimeSecs;
  } catch {
    // Preserve the previous behavior when RPC is unavailable.
    return nowMs / 1000;
  }
}
