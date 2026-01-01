import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AddSubscriptionModal } from '../add-subscription-modal'

const createWrapper = () => {
  const client = new QueryClient()
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

describe('AddSubscriptionModal', () => {
  test('ne rend pas de SelectItem avec une valeur vide quand la subscription a une catégorie vide', async () => {
    const subscription = {
      id: 1,
      userId: 1,
      name: 'Test',
      price: '9.99',
      frequency: 'monthly',
      category: '',
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

    render(<AddSubscriptionModal isOpen={true} onClose={() => {}} subscription={subscription} />, {
      wrapper: createWrapper(),
    })

    // Ouvrir le sélecteur de catégorie (deuxième combobox dans le formulaire)
    const comboboxes = screen.getAllByRole('combobox')
    expect(comboboxes.length).toBeGreaterThanOrEqual(2)
    const categoryTrigger = comboboxes[1]
    await userEvent.click(categoryTrigger)

    // Vérifier qu'il n'y a aucun élément avec data-value=""
    const emptyItems = document.querySelectorAll('[data-value=""]')
    expect(emptyItems.length).toBe(0)
  })
})
