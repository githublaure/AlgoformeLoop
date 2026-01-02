import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const createWrapper = () => {
  const client = new QueryClient()
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

// Mock react-query useQuery to return controlled data
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<any>('@tanstack/react-query')
  return {
    ...actual,
    useQuery: (opts: any) => {
      const key = Array.isArray(opts.queryKey) ? opts.queryKey[0] : opts.queryKey
      if (key === '/api/subscriptions') {
        const now = new Date()
        const in3 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
        const in40 = new Date(now.getTime() + 40 * 24 * 60 * 60 * 1000)
        const past = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
        return { data: [
          { id: 1, name: 'Pigeon One', price: '5.00', frequency: 'monthly', category: 'other', categoryColor: '#000', usageFrequency: 'rarely_used', nextRenewal: in3.toISOString(), iconClass: 'fas fa-dove', bgColor: '#000', note: '', rating: 1, isSuspect: true, isActive: true, isTrial: false },
          { id: 2, name: 'Good Service', price: '12.00', frequency: 'monthly', category: 'music', categoryColor: '#22c55e', usageFrequency: 'used', nextRenewal: in40.toISOString(), iconClass: 'fas fa-music', bgColor: '#22c55e', note: '', rating: 5, isSuspect: false, isActive: true, isTrial: false },
          { id: 3, name: 'Old Suspect', price: '2.00', frequency: 'monthly', category: 'cloud', categoryColor: '#3b82f6', usageFrequency: 'very_used', nextRenewal: past.toISOString(), iconClass: 'fas fa-cloud', bgColor: '#3b82f6', note: '', rating: 4, isSuspect: true, isActive: true, isTrial: false }
        ], isLoading: false }
      }
      // default for other queries
      return { data: undefined, isLoading: false }
    }
  }
})

// Mock auth provider to make LoginGuard behave as authenticated
vi.mock('../../components/auth-provider', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    forgotPassword: vi.fn(),
    error: null,
  }),
}))


describe('Dashboard filters', () => {
  test('pigeon and upcoming filters work together', async () => {
    const DashboardPage = (await import('../dashboard')).default
    render(<DashboardPage />)

    // Initially all three subscription cards appear
    expect(await screen.findByText('Pigeon One')).toBeInTheDocument()
    expect(screen.getByText('Good Service')).toBeInTheDocument()
    expect(screen.getByText('Old Suspect')).toBeInTheDocument()

    const pigeonSelect = screen.getByLabelText(/Type/i)
    await userEvent.selectOptions(pigeonSelect, 'pigeon')

    // Now only pigeoned subscriptions (2) should appear
    expect(screen.getByText('Pigeon One')).toBeInTheDocument()
    expect(screen.getByText('Old Suspect')).toBeInTheDocument()
    expect(screen.queryByText('Good Service')).not.toBeInTheDocument()

    const upcomingSelect = screen.getByLabelText(/Renouvellement/i)
    await userEvent.selectOptions(upcomingSelect, '7')

    // Only Pigeon One (renewal in 3 days) should be visible
    expect(screen.getByText('Pigeon One')).toBeInTheDocument()
    expect(screen.queryByText('Old Suspect')).not.toBeInTheDocument()
  })
})
