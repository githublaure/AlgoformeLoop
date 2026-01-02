process.env.NODE_ENV = 'test'
import express from 'express'
import { registerRoutes } from '../routes'
import jwt from 'jsonwebtoken'

describe('GET /api/stats', () => {
  let server: any

  beforeAll(async () => {
    const app = express()
    app.use(express.json())
    server = await registerRoutes(app)
  })

  afterAll(async () => {
    if (server && server.close) server.close()
  })

  test('does not count very_used subscriptions as suspects', async () => {
    const token = jwt.sign({ id: 1, email: 'test@example.com' }, process.env.JWT_SECRET || 'your-secret-key-change-this')

    // Start server on ephemeral port
    const srv = server.listen(0)
    const addr: any = srv.address()
    const port = addr.port

    const res = await fetch(`http://127.0.0.1:${port}/api/stats`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    expect(res.status).toBe(200)
    const body = await res.json()

    // From sample data, only Dropbox Plus is suspect (rarely_used) -> count 1
    expect(body.suspectCount).toBe(1)
    expect(body.suspectMonthly).toBe('9.99')

    srv.close()
  })

  test('includes archived subscriptions in stats when requested', async () => {
    const token = jwt.sign({ id: 1, email: 'test@example.com' }, process.env.JWT_SECRET || 'your-secret-key-change-this')

    // Start server on ephemeral port
    const srv = server.listen(0)
    const addr: any = srv.address()
    const port = addr.port

    // Create an archived suspect subscription
    const createRes = await fetch(`http://127.0.0.1:${port}/api/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Archived Suspect',
        price: 20,
        frequency: 'monthly',
        category: 'misc',
        usageFrequency: 'rarely_used',
        nextRenewal: new Date().toISOString(),
        isSuspect: true,
        isActive: false
      })
    })

    expect(createRes.status).toBe(201)

    const res = await fetch(`http://127.0.0.1:${port}/api/stats?includeArchived=true`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    expect(res.status).toBe(200)
    const body = await res.json()

    // Now suspect count should be 2 and suspectMonthly should reflect added 20€
    expect(body.suspectCount).toBe(2)
    expect(body.suspectMonthly).toBe('29.99')

    srv.close()
  })
})