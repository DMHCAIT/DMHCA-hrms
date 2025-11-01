# VERCEL ENVIRONMENT VARIABLES SETUP GUIDE
# Add these in Vercel Dashboard → Your Project → Settings → Environment Variables

## 🔧 Required Environment Variables for Vercel:

### Production Variables:
VITE_SUPABASE_URL=https://ocvtacsuwkwzbpwnmlsd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jdnRhY3N1d2t3emJwd25tbHNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMDc3MjYsImV4cCI6MjA3Njg4MzcyNn0.JJTuluIEZfVhFTonnaXCkiuzoD5AHZs0S_MjqdEn1DA
VITE_APP_TITLE=DMHCA HRMS
VITE_APP_VERSION=1.0.0
VITE_API_BASE_URL=https://dmhca-hrms.onrender.com
VITE_APP_URL=https://dmhcahrms.xyz

## 📝 How to Add in Vercel:
1. Go to: https://vercel.com/dashboard
2. Select your project: dmhca-hrms-frontend (or similar)
3. Go to Settings → Environment Variables
4. Add each variable above:
   - Key: VITE_SUPABASE_URL
   - Value: https://ocvtacsuwkwzbpwnmlsd.supabase.co
   - Environment: Production, Preview, Development (check all)

## 🔄 After Adding Variables:
1. Go to Deployments tab
2. Click "Redeploy" on latest deployment
3. Choose "Use existing Build Cache" ❌ (uncheck to force rebuild)

## 🌐 Domains Configuration:
- Primary Domain: dmhcahrms.xyz ✅
- Vercel Domain: yourapp.vercel.app (as backup)

## 🔒 Supabase Configuration:
Add these domains to Supabase:
1. Go to Supabase Dashboard → Settings → API
2. Add to "Site URL": https://dmhcahrms.xyz
3. Add to "Additional Redirect URLs": 
   - https://dmhcahrms.xyz
   - https://dmhcahrms.xyz/auth/callback
   - https://yourapp.vercel.app (backup)

## 🎯 Test URLs:
- Production: https://dmhcahrms.xyz
- API Endpoint: https://dmhca-hrms.onrender.com
- Login Page: https://dmhcahrms.xyz/login