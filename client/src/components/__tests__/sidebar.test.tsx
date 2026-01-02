import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import VoiceRemindersPage from '@/pages/voice-reminders'
import { Sidebar } from '@/components/sidebar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/components/auth-provider', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    user: { id: 'u1', name: 'Test' },
  }),
}))

const createQueryClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

describe('Sidebar integration', () => {
  test('clicking "Ajouter un abonnement" from voice reminders opens the modal', async () => {
    render(
      <QueryClientProvider client={createQueryClient()}>
        <VoiceRemindersPage />
      </QueryClientProvider>
    )

    const addButton = await screen.findByRole('button', { name: /Ajouter un abonnement/i })
    expect(addButton).toBeInTheDocument()

    fireEvent.click(addButton)

    // Dialog title (use role to avoid duplicate matches)
    const dialogTitle = await screen.findByRole('heading', { name: /Ajouter un abonnement/i })
    expect(dialogTitle).toBeInTheDocument()
  })

  test('clicking "Essais gratuits" navigates to the home trials anchor when off-root', () => {
    // simulate being on a different path
    const originalLocation = window.location
    // @ts-ignore
    delete window.location
    // @ts-ignore
    window.location = { href: 'http://localhost/voice-reminders' }

    const { Router } = require('wouter')

    render(
      <QueryClientProvider client={createQueryClient()}>
        <Router initialUrl="/voice-reminders">
          <Sidebar />
        </Router>
      </QueryClientProvider>
    )

    const trialsButton = screen.getByText(/Essais gratuits/i)
    fireEvent.click(trialsButton)

    // our test replaces window.location with a plain object/string in this env,
    // so assert on the location (either object or string) to be robust
    const locationValue = (window.location as any).href ?? window.location;
    expect(String(locationValue)).toContain('/#essais-gratuits')

    // restore
    // @ts-ignore
    window.location = originalLocation
  })
})
