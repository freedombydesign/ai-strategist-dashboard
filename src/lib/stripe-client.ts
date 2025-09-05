import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  typescript: true,
})

export const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

// Stripe API helpers for Cash Flow Command
export const stripeHelpers = {
  // Get payment intents (revenue data)
  async getPaymentIntents(options: {
    limit?: number
    created?: {
      gte?: number
      lte?: number
    }
    status?: string
  } = {}) {
    try {
      const paymentIntents = await stripe.paymentIntents.list({
        limit: options.limit || 100,
        created: options.created,
        status: options.status as any,
      })
      return paymentIntents
    } catch (error) {
      console.error('Error fetching payment intents:', error)
      throw error
    }
  },

  // Get charges (completed payments)
  async getCharges(options: {
    limit?: number
    created?: {
      gte?: number
      lte?: number
    }
  } = {}) {
    try {
      const charges = await stripe.charges.list({
        limit: options.limit || 100,
        created: options.created,
      })
      return charges
    } catch (error) {
      console.error('Error fetching charges:', error)
      throw error
    }
  },

  // Get invoices
  async getInvoices(options: {
    limit?: number
    status?: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void'
    created?: {
      gte?: number
      lte?: number
    }
  } = {}) {
    try {
      const invoices = await stripe.invoices.list({
        limit: options.limit || 100,
        status: options.status,
        created: options.created,
      })
      return invoices
    } catch (error) {
      console.error('Error fetching invoices:', error)
      throw error
    }
  },

  // Get customers
  async getCustomers(options: {
    limit?: number
    email?: string
  } = {}) {
    try {
      const customers = await stripe.customers.list({
        limit: options.limit || 100,
        email: options.email,
      })
      return customers
    } catch (error) {
      console.error('Error fetching customers:', error)
      throw error
    }
  },

  // Get balance (current account balance)
  async getBalance() {
    try {
      const balance = await stripe.balance.retrieve()
      return balance
    } catch (error) {
      console.error('Error fetching balance:', error)
      throw error
    }
  },

  // Get payout schedule and history
  async getPayouts(options: {
    limit?: number
    status?: 'paid' | 'pending' | 'in_transit' | 'canceled' | 'failed'
  } = {}) {
    try {
      const payouts = await stripe.payouts.list({
        limit: options.limit || 100,
        status: options.status,
      })
      return payouts
    } catch (error) {
      console.error('Error fetching payouts:', error)
      throw error
    }
  },

  // Get subscription data (recurring revenue)
  async getSubscriptions(options: {
    limit?: number
    status?: 'all' | 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid'
  } = {}) {
    try {
      const subscriptions = await stripe.subscriptions.list({
        limit: options.limit || 100,
        status: options.status || 'active',
      })
      return subscriptions
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
      throw error
    }
  }
}