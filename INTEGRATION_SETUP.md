# 🔧 Freedom Suite Integration Setup Guide

This guide will help you connect all 7 systems with your actual business tools using free/sandbox accounts.

## 📋 Quick Setup Checklist

- [ ] Stripe (Cash Flow Command)
- [ ] HubSpot Free (ConvertFlow) 
- [ ] Mailchimp (ConvertFlow & JourneyBuilder)
- [ ] SendGrid (JourneyBuilder)
- [ ] ClickUp (DeliverEase)
- [ ] Google Drive (DeliverEase)
- [ ] Slack (DeliverEase)
- [ ] Notion (SystemStack)

---

## 💰 System 1: Cash Flow Command (Stripe Integration)

### Get Your Stripe API Keys:
1. Go to https://dashboard.stripe.com/test/apikeys
2. Click "Create secret key" 
3. Copy both keys:
   - Secret key: `sk_test_...`
   - Publishable key: `pk_test_...`

### Add to Environment:
```env
STRIPE_SECRET_KEY="sk_test_your_secret_key_here"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_publishable_key_here"
```

---

## 📈 System 2: ProfitPulse (Stripe + Calculations)
Uses same Stripe integration as Cash Flow Command - no additional setup needed!

---

## 🔄 System 3: ConvertFlow (HubSpot + Mailchimp)

### HubSpot Free Setup:
1. Sign up at https://www.hubspot.com/products/get-started
2. Choose "CRM Suite" → "Free"
3. Go to Settings → Integrations → API Key
4. Generate your API key

```env
HUBSPOT_API_KEY="your_hubspot_api_key_here"
```

### Mailchimp Setup:
1. Go to https://mailchimp.com/developer/marketing/api/
2. Generate API key in your account settings
3. Note your server prefix (us1, us2, etc.)

```env
MAILCHIMP_API_KEY="your_mailchimp_api_key"
MAILCHIMP_SERVER_PREFIX="us1"
```

---

## 🎯 System 4: JourneyBuilder (Mailchimp + SendGrid)

### SendGrid Free Setup:
1. Sign up at https://sendgrid.com (free 100 emails/day)
2. Go to Settings → API Keys
3. Create API key with "Full Access"
4. Verify a sender email

```env
SENDGRID_API_KEY="SG.your_sendgrid_api_key"
SENDGRID_FROM_EMAIL="your_verified_email@domain.com"
```

---

## 🚀 System 5: DeliverEase (ClickUp + Google + Slack)

### ClickUp Free Setup:
1. Sign up at https://clickup.com (free plan)
2. Go to Settings → Apps → API
3. Generate API token

```env
CLICKUP_API_TOKEN="pk_your_clickup_token"
CLICKUP_TEAM_ID="your_team_id"
```

### Google Drive Setup:
1. Go to https://console.cloud.google.com
2. Create new project → Enable Drive API
3. Create OAuth credentials
4. Generate refresh token (we'll help with this)

```env
GOOGLE_CLIENT_ID="your_oauth_client_id"
GOOGLE_CLIENT_SECRET="your_oauth_client_secret" 
GOOGLE_REFRESH_TOKEN="your_refresh_token"
```

### Slack Free Setup:
1. Go to https://api.slack.com/apps
2. Create new app for your workspace
3. Add Bot Token Scopes: `chat:write`, `files:write`
4. Install to workspace

```env
SLACK_BOT_TOKEN="xoxb-your-bot-token"
```

---

## 📚 System 6: SystemStack (Notion)

### Notion Free Setup:
1. Go to https://www.notion.so/my-integrations
2. Create new integration
3. Copy internal integration token
4. Share a database with your integration

```env
NOTION_API_KEY="secret_your_notion_token"
NOTION_DATABASE_ID="your_database_id"
```

---

## 🔬 System 7: LaunchLoop (Analytics)

### OpenAI Setup (Optional):
For AI-powered optimization recommendations:

```env
OPENAI_API_KEY="sk-your_openai_api_key"
```

---

## 🎯 Final Environment File

Copy this to your `.env.local`:

```env
# Database (your existing)
DATABASE_URL="your_supabase_url"
NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_key"

# Cash Flow Command + ProfitPulse
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# ConvertFlow  
HUBSPOT_API_KEY="your_hubspot_key"
MAILCHIMP_API_KEY="your_mailchimp_key"
MAILCHIMP_SERVER_PREFIX="us1"

# JourneyBuilder
SENDGRID_API_KEY="SG.your_sendgrid_key"
SENDGRID_FROM_EMAIL="your_email@domain.com"

# DeliverEase
CLICKUP_API_TOKEN="pk_your_clickup_token"
CLICKUP_TEAM_ID="your_team_id"
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_secret"
GOOGLE_REFRESH_TOKEN="your_google_refresh_token"
SLACK_BOT_TOKEN="xoxb-your-slack-token"

# SystemStack
NOTION_API_KEY="secret_your_notion_token"
NOTION_DATABASE_ID="your_database_id"

# Optional
OPENAI_API_KEY="sk_your_openai_key"
NODE_ENV="development"
```

---

## 🚀 Getting Started

1. **Start with Stripe** (Cash Flow Command) - easiest to set up
2. **Add HubSpot Free** (ConvertFlow) - second easiest  
3. **Add remaining integrations** as needed
4. **Test each system** as you configure it

## 💡 Pro Tips

- **Use test/sandbox modes** for everything during development
- **Start with 2-3 integrations** and add more later
- **Each integration adds real business value** - not just demos
- **Free plans provide full API access** for most services

## 🆘 Need Help?

Each system will show connection status and help you troubleshoot API issues. The integrations are designed to work even if some APIs are not configured.