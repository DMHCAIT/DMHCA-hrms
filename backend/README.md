# 🔧 HR Software - Backend Integration Server

Node.js Express server for OnlineRealSoft webhook integration.

## 🚀 Development

```bash
npm install
npm start
```

## 🧪 Test Integration

```bash
npm test
```

## 📦 Deploy to Render

1. Push to GitHub
2. Create Web Service on Render
3. Connect GitHub repo
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `NODE_ENV=production`
5. Deploy automatically

## 🔧 Environment Variables

Create `.env` file:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
NODE_ENV=production
PORT=10000
```

## 🌐 Webhook URL

After deployment: `https://your-app.onrender.com/api/attendance/realtime`

Use this URL in OnlineRealSoft Third-Party API configuration.