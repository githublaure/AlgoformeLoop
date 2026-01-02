import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SubscriptionCard } from '../subscription-card'

const createWrapper = () => {
  const client = new QueryClient()
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

describe('SubscriptionCard', () => {
  test('affiche les boutons Modifier et Supprimer et appelle onEdit', async () => {
    const subscription = {
      id: 1,
      userId: 1,
      name: 'Test Sub',
      price: '9.99',
      frequency: 'monthly',
      category: 'other',
      categoryColor: '#000000',
      usageFrequency: 'used',
      nextRenewal: new Date().toISOString(),
      iconClass: 'fas fa-dove',
      bgColor: '#000000',
      note: '',
      rating: 0,
      isSuspect: false,
      isActive: true,
      isTrial: false,
      trialEndsAt: null,
      createdAt: new Date().toISOString(),
    } as any

    const onEditMock = vi.fn()

    render(<SubscriptionCard subscription={subscription} onEdit={onEditMock} />, { wrapper: createWrapper() })

    const editButton = screen.getByLabelText(`Modifier ${subscription.name}`)
    const deleteButton = screen.getByLabelText(`Supprimer ${subscription.name}`)

    expect(editButton).toBeInTheDocument()
    expect(deleteButton).toBeInTheDocument()

    await userEvent.click(editButton)
    expect(onEditMock).toHaveBeenCalledWith(subscription)
  })

  test('affiche une icône pigeon quand suspicious', () => {
    const subscription = {
      id: 2,
      userId: 1,
      name: 'Suspect Sub',
      price: '19.99',
      frequency: 'monthly',
      category: 'cloud',
      categoryColor: '#3b82f6',
      usageFrequency: 'rarely_used',
      nextRenewal: new Date().toISOString(),
      iconClass: 'fas fa-dove',
      bgColor: '#3b82f6',
      note: '',
      rating: 2,
      isSuspect: true,
      isActive: true,
      isTrial: false,
      trialEndsAt: null,
      createdAt: new Date().toISOString(),
    } as any

    render(<SubscriptionCard subscription={subscription} onEdit={vi.fn()} />, { wrapper: createWrapper() })
    const pigeon = screen.getByLabelText('pigeon-flag')
    expect(pigeon).toBeInTheDocument()
  })
})
