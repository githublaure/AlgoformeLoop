import { getUncachableStripeClient } from '../server/stripeClient';

async function createProducts() {
  try {
    const stripe = await getUncachableStripeClient();

    console.log('Creating Pigeon products in Stripe...');

    // Check if Pro Plan already exists
    const existing = await stripe.products.search({
      query: "name:'Pigeon Pro' AND active:'true'"
    });

    if (existing.data.length > 0) {
      console.log('Pigeon Pro already exists:', existing.data[0].id);
      const prices = await stripe.prices.list({ product: existing.data[0].id, active: true });
      prices.data.forEach(p => console.log(`  Price: ${p.id} - ${p.unit_amount! / 100} ${p.currency}/${(p.recurring?.interval ?? 'once')}`));
      return;
    }

    // Create Pigeon Pro product
    const product = await stripe.products.create({
      name: 'Pigeon Pro',
      description: 'Gérez toutes vos abonnements sans limite. Rappels vocaux IA, statistiques avancées, et plus.',
    });
    console.log('Created product:', product.id);

    const monthly = await stripe.prices.create({
      product: product.id,
      unit_amount: 499,
      currency: 'eur',
      recurring: { interval: 'month' },
    });
    console.log('Monthly price:', monthly.id, '€4.99/mois');

    const yearly = await stripe.prices.create({
      product: product.id,
      unit_amount: 3999,
      currency: 'eur',
      recurring: { interval: 'year' },
    });
    console.log('Yearly price:', yearly.id, '€39.99/an');

    console.log('Done!');
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createProducts();
