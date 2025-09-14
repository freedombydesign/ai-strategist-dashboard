# OAuth Platform Integration Setup Guide

This guide will help you set up OAuth integrations for all supported platforms in the Business Systemizer.

## 📋 **Quick Setup Checklist**

- [ ] Copy `.env.example` to `.env.local`
- [ ] Set up database schema with `005_platform_connections.sql`
- [ ] Configure each platform's OAuth credentials
- [ ] Test connections via `/export-manager`

## 🔧 **Database Setup**

Run the platform connections schema:

```sql
-- Execute this in your Supabase SQL editor or via psql
\i database/005_platform_connections.sql
```

## 🌐 **Platform-Specific Setup**

### 1. **Trello Setup**

1. **Get API Credentials:**
   - Go to: `https://trello.com/app-key`
   - Copy your API Key and Secret

2. **Configure Redirect URLs:**
   ```
   Development: http://localhost:3005/api/auth/callback/trello
   Production: https://yourdomain.com/api/auth/callback/trello
   ```

3. **Environment Variables:**
   ```env
   TRELLO_API_KEY=your_trello_api_key
   TRELLO_API_SECRET=your_trello_api_secret
   ```

### 2. **Asana Setup**

1. **Create OAuth App:**
   - Go to: `https://app.asana.com/0/developer-console`
   - Click "Create New App"
   - Fill in your app details

2. **Configure Redirect URLs:**
   ```
   Development: http://localhost:3005/api/auth/callback/asana
   Production: https://yourdomain.com/api/auth/callback/asana
   ```

3. **Environment Variables:**
   ```env
   ASANA_CLIENT_ID=your_asana_client_id
   ASANA_CLIENT_SECRET=your_asana_client_secret
   ```

### 3. **ClickUp Setup**

1. **Create OAuth App:**
   - Go to: `https://app.clickup.com/settings/apps`
   - Click "Create an App"
   - Fill in your app details

2. **Configure Redirect URLs:**
   ```
   Development: http://localhost:3005/api/auth/callback/clickup
   Production: https://yourdomain.com/api/auth/callback/clickup
   ```

3. **Environment Variables:**
   ```env
   CLICKUP_CLIENT_ID=your_clickup_client_id
   CLICKUP_CLIENT_SECRET=your_clickup_client_secret
   ```

### 4. **Monday.com Setup**

1. **Create OAuth App:**
   - Go to: `https://monday.com/developers/apps`
   - Click "Create App"
   - Fill in your app details

2. **Configure Redirect URLs:**
   ```
   Development: http://localhost:3005/api/auth/callback/monday
   Production: https://yourdomain.com/api/auth/callback/monday
   ```

3. **Required Scopes:**
   ```
   me:read boards:read boards:write
   ```

4. **Environment Variables:**
   ```env
   MONDAY_CLIENT_ID=your_monday_client_id
   MONDAY_CLIENT_SECRET=your_monday_client_secret
   ```

### 5. **Notion Setup**

1. **Create Integration:**
   - Go to: `https://www.notion.so/my-integrations`
   - Click "Create new integration"
   - Fill in your integration details

2. **Configure Redirect URLs:**
   ```
   Development: http://localhost:3005/api/auth/callback/notion
   Production: https://yourdomain.com/api/auth/callback/notion
   ```

3. **Environment Variables:**
   ```env
   NOTION_CLIENT_ID=your_notion_client_id
   NOTION_CLIENT_SECRET=your_notion_client_secret
   ```

## 🔐 **Complete Environment Setup**

Create `.env.local` from `.env.example`:

```env
# Database Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3005
NEXTAUTH_SECRET=your_nextauth_secret_here

# Platform OAuth Credentials
TRELLO_API_KEY=your_trello_api_key
TRELLO_API_SECRET=your_trello_api_secret

ASANA_CLIENT_ID=your_asana_client_id
ASANA_CLIENT_SECRET=your_asana_client_secret

CLICKUP_CLIENT_ID=your_clickup_client_id
CLICKUP_CLIENT_SECRET=your_clickup_client_secret

MONDAY_CLIENT_ID=your_monday_client_id
MONDAY_CLIENT_SECRET=your_monday_client_secret

NOTION_CLIENT_ID=your_notion_client_id
NOTION_CLIENT_SECRET=your_notion_client_secret
```

## 🚀 **Testing the Integration**

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to Export Manager:**
   ```
   http://localhost:3005/export-manager
   ```

3. **Connect to a Platform:**
   - Select a platform (e.g., Trello)
   - Click "Connect" button
   - Complete OAuth flow
   - Verify connection status shows "Connected"

4. **Test Export:**
   - Select a workflow
   - Configure platform settings (boardId, listId, etc.)
   - Click "Export Workflow"
   - Check external platform for created items

## 🔧 **API Endpoints**

### OAuth Endpoints:
- `GET/POST /api/auth/[...nextauth]` - NextAuth OAuth handler
- `GET /api/platform-connections` - List connections
- `DELETE /api/platform-connections?id={id}` - Remove connection
- `PUT /api/platform-connections` - Update connection

### Export Endpoints:
- `POST /api/systemizer/export/trello` - Export to Trello
- `POST /api/systemizer/export/asana` - Export to Asana
- `POST /api/systemizer/export/clickup` - Export to ClickUp
- `POST /api/systemizer/export/monday` - Export to Monday.com
- `POST /api/systemizer/export/notion` - Export to Notion

## 🛠️ **Troubleshooting**

### Common Issues:

1. **"OAuth connection failed"**
   - Verify redirect URLs match exactly
   - Check client ID/secret are correct
   - Ensure platform app is activated

2. **"No active connection found"**
   - Complete OAuth flow first via Connect button
   - Check database for stored connection
   - Verify connection is marked as active

3. **"Export failed - API error"**
   - Check token hasn't expired
   - Verify required platform settings (boardId, etc.)
   - Check platform-specific permissions

4. **Database connection errors**
   - Verify Supabase credentials
   - Ensure database schema is up to date
   - Check RLS policies are configured

### Debug Mode:

Set `NODE_ENV=development` to enable detailed OAuth logging.

## 🔒 **Security Considerations**

- Never commit `.env.local` to version control
- Use different OAuth apps for development/production
- Regularly rotate OAuth secrets
- Monitor token usage and expiration
- Implement proper error handling for expired tokens

## 📚 **Platform Documentation**

- [Trello API Docs](https://developer.atlassian.com/cloud/trello/)
- [Asana API Docs](https://developers.asana.com/docs)
- [ClickUp API Docs](https://clickup.com/api)
- [Monday.com API Docs](https://developer.monday.com/api-reference)
- [Notion API Docs](https://developers.notion.com/)

## 🎯 **Production Deployment**

For production deployment:

1. Update `NEXTAUTH_URL` to your production domain
2. Configure production OAuth redirect URLs
3. Use production-grade secrets and keys
4. Enable proper logging and monitoring
5. Implement token refresh mechanisms
6. Set up error alerting for failed exports

## 📞 **Support**

If you encounter issues:
1. Check the troubleshooting section above
2. Verify your platform OAuth app configuration
3. Check browser developer console for errors
4. Review server logs for detailed error messages