// Integration clients for all business systems
import { Client } from '@hubspot/api-client'
import Mailchimp from 'mailchimp-api-v3'

// HubSpot Client (ConvertFlow)
let hubspotClient: Client | null = null

export function getHubSpotClient(): Client | null {
  if (!process.env.HUBSPOT_API_KEY) {
    console.warn('HUBSPOT_API_KEY not configured')
    return null
  }

  if (!hubspotClient) {
    hubspotClient = new Client({ accessToken: process.env.HUBSPOT_API_KEY })
  }
  
  return hubspotClient
}

// Mailchimp Client (ConvertFlow & JourneyBuilder) 
let mailchimpClient: any = null

export function getMailchimpClient(): any {
  if (!process.env.MAILCHIMP_API_KEY) {
    console.warn('MAILCHIMP_API_KEY not configured')
    return null
  }

  if (!mailchimpClient) {
    mailchimpClient = new Mailchimp(process.env.MAILCHIMP_API_KEY)
  }

  return mailchimpClient
}

// Integration status checker
export async function checkIntegrationStatus() {
  const status = {
    stripe: !!process.env.STRIPE_SECRET_KEY,
    hubspot: !!process.env.HUBSPOT_API_KEY,
    mailchimp: !!process.env.MAILCHIMP_API_KEY,
    sendgrid: !!process.env.SENDGRID_API_KEY,
    clickup: !!process.env.CLICKUP_API_TOKEN,
    slack: !!process.env.SLACK_BOT_TOKEN,
    notion: !!process.env.NOTION_API_KEY,
    google: !!process.env.GOOGLE_CLIENT_ID,
    openai: !!process.env.OPENAI_API_KEY
  }

  // Test actual connectivity
  const connectivity = {
    stripe: status.stripe,
    hubspot: false,
    mailchimp: false,
    sendgrid: status.sendgrid,
    clickup: false,
    slack: false,
    notion: false,
    google: false,
    openai: status.openai
  }

  // Test HubSpot connection
  if (status.hubspot) {
    try {
      const hubspot = getHubSpotClient()
      if (hubspot) {
        await hubspot.crm.contacts.basicApi.getPage(1)
        connectivity.hubspot = true
      }
    } catch (error) {
      console.warn('HubSpot connection test failed:', error)
    }
  }

  // Test Mailchimp connection
  if (status.mailchimp) {
    try {
      const mailchimp = getMailchimpClient()
      if (mailchimp) {
        await mailchimp.get('/ping')
        connectivity.mailchimp = true
      }
    } catch (error) {
      console.warn('Mailchimp connection test failed:', error)
    }
  }

  return {
    configured: status,
    connected: connectivity,
    overall: Object.values(connectivity).filter(Boolean).length
  }
}

// HubSpot API helpers
export const hubspotHelpers = {
  async getContacts(limit = 50) {
    const client = getHubSpotClient()
    if (!client) return []
    
    try {
      const response = await client.crm.contacts.basicApi.getPage(limit)
      return response.results || []
    } catch (error) {
      console.error('Error fetching HubSpot contacts:', error)
      return []
    }
  },

  async getDeals(limit = 50) {
    const client = getHubSpotClient()
    if (!client) return []
    
    try {
      const response = await client.crm.deals.basicApi.getPage(limit)
      return response.results || []
    } catch (error) {
      console.error('Error fetching HubSpot deals:', error)
      return []
    }
  },

  async createContact(contactData: any) {
    const client = getHubSpotClient()
    if (!client) return null
    
    try {
      const response = await client.crm.contacts.basicApi.create({
        properties: contactData
      })
      return response
    } catch (error) {
      console.error('Error creating HubSpot contact:', error)
      return null
    }
  }
}

// Mailchimp API helpers  
export const mailchimpHelpers = {
  async getLists() {
    const client = getMailchimpClient()
    if (!client) return []
    
    try {
      const response = await client.get('/lists')
      return response.lists || []
    } catch (error) {
      console.error('Error fetching Mailchimp lists:', error)
      return []
    }
  },

  async getCampaigns(count = 20) {
    const client = getMailchimpClient()
    if (!client) return []
    
    try {
      const response = await client.get(`/campaigns?count=${count}`)
      return response.campaigns || []
    } catch (error) {
      console.error('Error fetching Mailchimp campaigns:', error)
      return []
    }
  },

  async addSubscriber(listId: string, email: string, firstName?: string, lastName?: string) {
    const client = getMailchimpClient()
    if (!client) return null
    
    try {
      const response = await client.post(`/lists/${listId}/members`, {
        email_address: email,
        status: 'subscribed',
        merge_fields: {
          FNAME: firstName || '',
          LNAME: lastName || ''
        }
      })
      return response
    } catch (error) {
      console.error('Error adding Mailchimp subscriber:', error)
      return null
    }
  }
}