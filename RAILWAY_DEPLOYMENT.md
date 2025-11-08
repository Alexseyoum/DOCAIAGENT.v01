# Railway Deployment Guide - Document Processing Agent

This guide will walk you through deploying the Document Processing Agent to Railway's free tier.

## Prerequisites

- GitHub account (you already have the repo at https://github.com/Alexseyoum/DOCAIAGENT.v01.git)
- Railway account (free, no credit card required initially)

## Step-by-Step Deployment

### 1. Create Railway Account

1. Visit https://railway.app
2. Click "Login" or "Start a New Project"
3. Sign up with your GitHub account (recommended for easy integration)

### 2. Create New Project

1. Once logged in, click "New Project"
2. Select "Deploy from GitHub repo"
3. Authorize Railway to access your GitHub account
4. Select the repository: `Alexseyoum/DOCAIAGENT.v01`
5. Select branch: `master`

### 3. Configure Environment Variables

After selecting your repo, Railway will prompt you to configure variables. Add these:

**Required Variables:**
```
NODE_ENV=production
PORT=3000
LLM_PROVIDER=groq
LOG_LEVEL=info
```

**Optional Variables (can be added later):**
```
MAX_FILE_SIZE_MB=50
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
UPLOAD_RATE_LIMIT_MAX=10
DOCUMENT_RETENTION_DAYS=30
```

**API Keys (IMPORTANT - Add after deployment):**
You'll need to add at least one LLM API key:
```
GROQ_API_KEY=your-groq-api-key-here
```
Or:
```
GEMINI_API_KEY=your-gemini-api-key-here
```

**JWT Secret (IMPORTANT - Generate a secure key):**
```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 4. Deploy

1. Railway will automatically detect the `railway.json` and `nixpacks.toml` configuration
2. Click "Deploy"
3. Railway will:
   - Install Node.js 20
   - Install dependencies (`npm ci`)
   - Build the TypeScript code (`npm run build`)
   - Start the server (`npm start`)

### 5. Monitor Deployment

1. Watch the build logs in Railway's dashboard
2. Deployment typically takes 2-3 minutes
3. Once complete, Railway will provide you with a public URL

### 6. Get Your API URL

1. In the Railway dashboard, go to your service
2. Click on "Settings" → "Domains"
3. Railway automatically generates a domain like: `your-app.railway.app`
4. Copy this URL - this is your API endpoint

### 7. Test Your Deployment

Once deployed, test the health endpoint:

```bash
curl https://your-app.railway.app/health
```

You should see:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-08T...",
  "services": {...}
}
```

### 8. Add API Keys (Post-Deployment)

**IMPORTANT:** The app won't fully function until you add LLM API keys.

#### Get Free API Keys:

**Option 1: Groq (Recommended - Free & Fast)**
1. Visit https://console.groq.com/keys
2. Sign up for free account
3. Create an API key
4. In Railway dashboard: Settings → Variables → Add `GROQ_API_KEY`

**Option 2: Google Gemini (Free)**
1. Visit https://makersuite.google.com/app/apikey
2. Sign up for free account
3. Create an API key
4. In Railway dashboard: Settings → Variables → Add `GEMINI_API_KEY`

#### Add JWT Secret:
```bash
# Generate a secure random string (run this locally)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Add the output as `JWT_SECRET` in Railway environment variables.

After adding variables, Railway will automatically redeploy.

## Railway Free Tier Limits

- **$5 free credit per month**
- **500 hours of runtime** (enough for continuous operation)
- **100 GB outbound bandwidth**
- No credit card required initially
- Perfect for development and testing

## Automatic Deployments

Railway is now connected to your GitHub repo. Every time you push to the `master` branch:
1. Railway will automatically detect the changes
2. Rebuild the application
3. Deploy the new version

## Managing Your Service

### View Logs
```
Railway Dashboard → Your Service → Deployments → View Logs
```

### Update Environment Variables
```
Railway Dashboard → Your Service → Settings → Variables
```

### Monitor Usage
```
Railway Dashboard → Your Service → Metrics
```

### Custom Domain (Optional)
```
Railway Dashboard → Your Service → Settings → Domains → Add Custom Domain
```

## Testing the API

Once deployed, test all endpoints:

```bash
# Health check
curl https://your-app.railway.app/health

# Detailed health
curl https://your-app.railway.app/health/detailed

# API documentation
curl https://your-app.railway.app/api/v1/

# Upload a document (requires authentication)
curl -X POST https://your-app.railway.app/api/v1/documents \
  -F "file=@your-document.pdf" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Troubleshooting

### Build Fails
- Check the build logs in Railway dashboard
- Ensure `railway.json` and `nixpacks.toml` are committed
- Verify Node.js version compatibility

### App Crashes on Start
- Check runtime logs
- Verify all required environment variables are set
- Ensure `JWT_SECRET` and at least one LLM API key are configured

### 404 Errors
- Verify the domain is correct
- Check that the service is running (green status in dashboard)
- Review the application logs

### API Errors
- Ensure LLM API keys are valid
- Check that `LLM_PROVIDER` matches your configured API key
- Review application logs for specific error messages

## Next Steps

1. ✅ Deploy to Railway
2. ✅ Add API keys
3. ✅ Test all endpoints
4. Consider adding:
   - Redis for production caching and queuing
   - PostgreSQL for persistent storage
   - Custom domain
   - Monitoring and alerting

## Support

- Railway Documentation: https://docs.railway.app
- Railway Community: https://discord.gg/railway
- Project Issues: https://github.com/Alexseyoum/DOCAIAGENT.v01/issues

---

**Ready to deploy?** Follow the steps above and your Document Processing Agent will be live in minutes! 🚀
