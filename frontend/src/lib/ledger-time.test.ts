import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "./contract";
import { getLedgerNowSecs } from "./ledger-time";
import { rpcCache } from "./rpc-cache";

describe("getLedgerNowSecs (#352)", () => {
  beforeEach(() => {
    rpcCache.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-21T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("uses the latest ledger close time", async () => {
    const latest = vi
      .spyOn(server, "getLatestLedger")
      .mockResolvedValue({ closeTime: "1000" } as never);

    await expect(getLedgerNowSecs()).resolves.toBe(1000);
    expect(latest).toHaveBeenCalledTimes(1);
  });

  it("advances the cached close time by local elapsed time", async () => {
    const latest = vi
      .spyOn(server, "getLatestLedger")
      .mockResolvedValue({ closeTime: "1000" } as never);

    await getLedgerNowSecs();
    vi.advanceTimersByTime(5_000);

    await expect(getLedgerNowSecs()).resolves.toBe(1005);
    expect(latest).toHaveBeenCalledTimes(1);
  });

  it("refreshes after the cache TTL expires", async () => {
    const latest = vi
      .spyOn(server, "getLatestLedger")
      .mockResolvedValueOnce({ closeTime: "1000" } as never)
      .mockResolvedValueOnce({ closeTime: "2000" } as never);

    await expect(getLedgerNowSecs()).resolves.toBe(1000);
    vi.advanceTimersByTime(31_000);
    await expect(getLedgerNowSecs()).resolves.toBe(2000);
    expect(latest).toHaveBeenCalledTimes(2);
  });

  it("falls back to the browser clock when RPC fails", async () => {
    vi.spyOn(server, "getLatestLedger").mockRejectedValue(new Error("offline"));

    const now = await getLedgerNowSecs();
    expect(now).toBe(Date.now() / 1000);
  });
});
