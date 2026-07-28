import { describe, expect, it } from "vitest";
import { buildDemoSubscriptions, DEMO_ACCOUNT } from "../demo-account";

describe("demo account fixtures", () => {
  it("provides data for every important dashboard state", () => {
    const subscriptions = buildDemoSubscriptions(42);

    expect(DEMO_ACCOUNT.email).toBe("demo@pigeonsub.fr");
    expect(subscriptions).toHaveLength(10);
    expect(subscriptions.every((subscription) => subscription.userId === 42)).toBe(true);
    expect(subscriptions.some((subscription) => subscription.isTrial)).toBe(true);
    expect(subscriptions.some((subscription) => subscription.isSuspect && subscription.isFlagged)).toBe(true);
    expect(subscriptions.some((subscription) => subscription.isActive === false)).toBe(true);
    expect(subscriptions.some((subscription) => subscription.frequency === "lifetime")).toBe(true);
    expect(subscriptions.some((subscription) => subscription.frequency === "weekly")).toBe(true);
    expect(subscriptions.some((subscription) => subscription.useSafetyDate)).toBe(true);
    expect(subscriptions.some((subscription) => subscription.nextRenewal === null)).toBe(true);
  });
});
