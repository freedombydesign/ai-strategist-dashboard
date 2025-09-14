# Business Systemizer - Vercel Deployment Guide

## 🚀 **Quick Deploy to Vercel**

### **1. Prerequisites**
- [Vercel Account](https://vercel.com)
- [GitHub Repository](https://github.com) (push your code there first)
- Supabase project set up
- Platform OAuth credentials (optional, for export features)

### **2. Deploy to Vercel**

#### **Option A: GitHub Integration (Recommended)**
1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will auto-detect Next.js and deploy

#### **Option B: Vercel CLI**
```bash
npm install -g vercel
cd business-systemizer
vercel --prod
```

### **3. Environment Variables Setup**

In your Vercel project dashboard, go to **Settings > Environment Variables** and add:

#### **Required Variables:**
```
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-secret-key-generate-new-one
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
OPENAI_API_KEY=your-openai-api-key
```

#### **OAuth Variables (Optional):**
```
TRELLO_API_KEY=your-trello-api-key
TRELLO_API_SECRET=your-trello-api-secret
ASANA_CLIENT_ID=your-asana-client-id
ASANA_CLIENT_SECRET=your-asana-client-secret
CLICKUP_CLIENT_ID=your-clickup-client-id
CLICKUP_CLIENT_SECRET=your-clickup-client-secret
MONDAY_CLIENT_ID=your-monday-client-id
MONDAY_CLIENT_SECRET=your-monday-client-secret
NOTION_CLIENT_ID=your-notion-client-id
NOTION_CLIENT_SECRET=your-notion_client_secret
```

### **4. Update OAuth Redirect URLs**

For each platform you want to use, update the redirect URLs in their developer consoles:

```
https://your-app.vercel.app/api/auth/callback/trello
https://your-app.vercel.app/api/auth/callback/asana
https://your-app.vercel.app/api/auth/callback/clickup
https://your-app.vercel.app/api/auth/callback/monday
https://your-app.vercel.app/api/auth/callback/notion
```

### **5. Database Setup**

Run the database migrations in your Supabase SQL editor:
```sql
-- Execute in order:
\i database/001_initial_schema.sql
\i database/002_enhanced_schema.sql
\i database/003_business_context.sql
\i database/004_service_delivery.sql
\i database/005_platform_connections.sql
```

### **6. Post-Deployment Testing**

Test these URLs after deployment:
- `https://your-app.vercel.app/` - Main dashboard
- `https://your-app.vercel.app/template-manager` - Template system
- `https://your-app.vercel.app/export-manager` - Export system
- `https://your-app.vercel.app/api/systemizer/workflows` - API test

## 🛠️ **Custom Domain (Optional)**

1. In Vercel Dashboard: **Settings > Domains**
2. Add your custom domain
3. Update `NEXTAUTH_URL` environment variable to your custom domain
4. Update OAuth redirect URLs to use your custom domain

## 🔧 **Build Configuration**

The project includes:
- `vercel.json` - Vercel configuration
- `next.config.ts` - Next.js configuration
- `package.json` - Build scripts and dependencies

## 📊 **Performance Optimization**

Vercel automatically provides:
- ✅ Edge caching
- ✅ Serverless functions
- ✅ Global CDN
- ✅ Automatic HTTPS
- ✅ Branch previews

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **Build Fails:**
   ```bash
   # Check build locally first
   npm run build
   ```

2. **Environment Variables Missing:**
   - Verify all required env vars are set in Vercel dashboard
   - Check for typos in variable names

3. **OAuth Not Working:**
   - Verify redirect URLs match exactly (including https://)
   - Ensure OAuth credentials are correct
   - Check Vercel function logs

4. **Database Connection Issues:**
   - Verify Supabase URL and keys
   - Ensure RLS policies allow access
   - Check Supabase connection pooler settings

### **Vercel Function Logs:**
```bash
vercel logs https://your-app.vercel.app
```

## 🔄 **CI/CD Setup**

Vercel automatically deploys on:
- **Production:** Push to `main` branch
- **Preview:** Push to any other branch
- **Pull Requests:** Automatic preview deployments

## 📱 **Features Available After Deployment**

### **Core Features:**
- ✅ AI-powered workflow analysis
- ✅ Service delivery systemization
- ✅ Template generation with personalization
- ✅ Advanced customization options

### **Export Features (with OAuth setup):**
- ✅ Export to Trello
- ✅ Export to Asana
- ✅ Export to ClickUp
- ✅ Export to Monday.com
- ✅ Export to Notion

### **Analytics (Coming Soon):**
- 🔄 Usage analytics dashboard
- 🔄 Export tracking
- 🔄 Template performance metrics

## 📞 **Support**

- **Vercel Issues:** Check [Vercel Documentation](https://vercel.com/docs)
- **App Issues:** Review server logs in Vercel dashboard
- **OAuth Setup:** Follow `OAUTH_SETUP.md`

## 🎯 **Production Checklist**

- [ ] All environment variables configured
- [ ] Database migrations executed
- [ ] OAuth redirect URLs updated
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active (automatic with Vercel)
- [ ] Basic functionality tested
- [ ] OAuth flows tested (if configured)
- [ ] Error monitoring set up (optional)

Your Business Systemizer is now ready for production! 🎉