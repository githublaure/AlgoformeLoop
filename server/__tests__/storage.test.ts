import { describe, it, expect } from 'vitest'
import { MemStorage } from '../storage'

describe('MemStorage user isolation', () => {
  it('returns only subscriptions for the requested user and not orphan ones', async () => {
    const storage = new MemStorage()

    // By default initializeSampleData added subs for userId=1
    const user1Subs = await storage.getSubscriptions(1)
    expect(user1Subs.length).toBeGreaterThan(0)

    // Create an orphan subscription (userId null)
    const orphan = await storage.createSubscription({
      userId: null as any,
      name: 'Orphan Test',
      price: '0.00',
      frequency: 'monthly',
      category: 'misc',
      usageFrequency: 'used',
      nextRenewal: new Date(),
    })

    // Create a subscription for user 2
    const user2Sub = await storage.createSubscription({
      userId: 2 as any,
      name: 'User2 Test',
      price: '1.00',
      frequency: 'monthly',
      category: 'misc',
      usageFrequency: 'used',
      nextRenewal: new Date(),
    })

    const user2Subs = await storage.getSubscriptions(2)
    expect(user2Subs.some(s => s.id === user2Sub.id)).toBe(true)
    // Should not return orphan subscriptions for user 2
    expect(user2Subs.some(s => s.id === orphan.id)).toBe(false)

    // User 1 should not see user 2 subscription
    const user1After = await storage.getSubscriptions(1)
    expect(user1After.some(s => s.id === user2Sub.id)).toBe(false)
  })
})
