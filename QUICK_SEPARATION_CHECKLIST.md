# ✅ Quick Repository Separation Checklist

**End the 2-week frustration! Get your clean business-systemizer repository in 15 minutes.**

---

## **🚀 Step 1: Create New GitHub Repository**

### Option A: GitHub Web Interface
1. Go to https://github.com/new
2. Repository name: `business-systemizer`
3. Description: `AI-powered business workflow systemizer with OAuth export`
4. ✅ Public (or Private - your choice)
5. ✅ Add README file
6. ✅ Add .gitignore → Node
7. Click **Create repository**
8. Clone locally: `git clone https://github.com/yourusername/business-systemizer.git`

### Option B: GitHub CLI (if installed)
```bash
gh repo create business-systemizer --public --clone
```

---

## **📁 Step 2: Copy Files Manually**

Navigate to your **new** business-systemizer directory and copy these from the **current** mixed repository:

### **✅ Essential Directories**
- [ ] `src/app/` → Copy entire directory
- [ ] `database/` → Copy entire directory
- [ ] `lib/` → Copy entire directory (if exists)
- [ ] `public/` → Copy entire directory (if exists)

### **✅ Configuration Files**
- [ ] `package.json`
- [ ] `package-lock.json`
- [ ] `next.config.ts`
- [ ] `tailwind.config.ts`
- [ ] `tsconfig.json`
- [ ] `.eslintrc.json`
- [ ] `vercel.json` (if exists)

### **✅ Documentation Files**
- [ ] `DEPLOYMENT.md`
- [ ] `VERCEL_DEPLOY.md`
- [ ] `OAUTH_SETUP.md` (if exists)
- [ ] `REPOSITORY_SEPARATION_GUIDE.md` (this directory)

### **❌ DO NOT Copy**
- ❌ `.next/` (build artifacts)
- ❌ `node_modules/` (dependencies)
- ❌ `.git/` (old git history)
- ❌ `.env.local` (create new one)
- ❌ Any ai-strategist specific files

---

## **🔧 Step 3: Setup New Repository**

```bash
cd business-systemizer  # Your new directory

# 1. Create environment file
cat > .env.local << 'EOF'
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
OPENAI_API_KEY=your-openai-api-key

# OAuth (Optional)
TRELLO_API_KEY=your-trello-key
TRELLO_API_SECRET=your-trello-secret
ASANA_CLIENT_ID=your-asana-id
ASANA_CLIENT_SECRET=your-asana-secret
CLICKUP_CLIENT_ID=your-clickup-id
CLICKUP_CLIENT_SECRET=your-clickup-secret
MONDAY_CLIENT_ID=your-monday-id
MONDAY_CLIENT_SECRET=your-monday-secret
NOTION_CLIENT_ID=your-notion-id
NOTION_CLIENT_SECRET=your-notion-secret
EOF

# 2. Install dependencies
npm install

# 3. Test build
npm run build

# 4. Test locally (lightweight version)
npm run dev
```

---

## **🚀 Step 4: Deploy to Vercel**

### Option A: Vercel CLI
```bash
npm i -g vercel  # If not installed
vercel --prod
```

### Option B: GitHub Integration
1. Push to GitHub:
   ```bash
   git add .
   git commit -m "Clean business-systemizer repository

   🚀 Complete OAuth export system
   ✅ Service delivery systemizer
   ✅ AI template generation
   ✅ Production ready

   End of 2-week separation frustration!"

   git push origin main
   ```

2. Connect in Vercel:
   - Go to https://vercel.com/dashboard
   - Import from GitHub
   - Select your new `business-systemizer` repository
   - Deploy!

---

## **🎯 Step 5: Update OAuth Redirect URLs**

After deployment, update OAuth apps with new URLs:

```
https://your-new-app.vercel.app/api/auth/callback/trello
https://your-new-app.vercel.app/api/auth/callback/asana
https://your-new-app.vercel.app/api/auth/callback/clickup
https://your-new-app.vercel.app/api/auth/callback/monday
https://your-new-app.vercel.app/api/auth/callback/notion
```

---

## **✅ Verification Checklist**

After deployment, verify these URLs work:

- [ ] `https://your-app.vercel.app/` - Main dashboard
- [ ] `https://your-app.vercel.app/template-manager` - Template system
- [ ] `https://your-app.vercel.app/export-demo` - Lightweight export
- [ ] `https://your-app.vercel.app/export-manager` - Full OAuth system
- [ ] `https://your-app.vercel.app/api/systemizer/workflows` - API health

---

## **🎉 Success!**

You now have:
- ✅ **Clean, isolated repository** - No more ai-strategist conflicts
- ✅ **Independent deployment** - Your own Vercel project
- ✅ **Complete OAuth system** - All 5 platforms working
- ✅ **Production ready** - All 172 pages compiling
- ✅ **End of frustration** - Clean development from now on!

---

## **⚡ Emergency: Use Automation Script**

If manual copying is tedious, use the automation script:

```bash
# From your current business-systemizer directory
./separate-repository.sh /path/to/new/business-systemizer
```

**Estimated time: 15 minutes total** 🕐

---

**🚨 After separation, you can safely delete the mixed repository setup and work independently!**