# How to Get FREE API Keys for LLM Providers

This document explains how to get free API keys for Groq and Gemini - both completely FREE to use!

---

## 🚀 Option 1: Groq (RECOMMENDED - Fastest & Free!)

**Why Groq?**
- ✅ **Completely FREE**
- ✅ **Super fast** (fastest inference in the market)
- ✅ **Llama 3.1 70B model** (very capable)
- ✅ **High rate limits** (30 requests/minute on free tier)
- ✅ **No credit card required**

### Steps to Get Groq API Key:

1. **Visit Groq Console**
   - Go to: https://console.groq.com/

2. **Sign Up/Login**
   - Click "Sign Up" or "Log In"
   - Can use Google, GitHub, or email

3. **Create API Key**
   - Once logged in, go to: https://console.groq.com/keys
   - Click "Create API Key"
   - Give it a name (e.g., "Document Processing Agent")
   - Click "Submit"

4. **Copy Your API Key**
   - Copy the API key (starts with `gsk_...`)
   - **Important:** Save it somewhere safe, you won't see it again!

5. **Add to Your Project**
   ```bash
   # Edit your .env file
   LLM_PROVIDER=groq
   GROQ_API_KEY=gsk_your_actual_key_here
   ```

### Groq Free Tier Limits:
- **Rate Limit:** 30 requests/minute, 14,400 requests/day
- **Context:** 32,768 tokens (very large!)
- **Models:** Llama 3.1 70B, Mixtral 8x7B, and more
- **Cost:** $0 (completely free!)

---

## 🌟 Option 2: Google Gemini (Also FREE!)

**Why Gemini?**
- ✅ **Completely FREE**
- ✅ **Google's latest AI**
- ✅ **Gemini 1.5 Flash** (very fast & capable)
- ✅ **Large context window** (1 million tokens!)
- ✅ **No credit card required**

### Steps to Get Gemini API Key:

1. **Visit Google AI Studio**
   - Go to: https://makersuite.google.com/app/apikey
   - Or: https://aistudio.google.com/app/apikey

2. **Sign In with Google**
   - Use your Google account
   - Accept terms of service

3. **Create API Key**
   - Click "Create API Key"
   - Select "Create API key in new project" (or use existing project)
   - Click "Create API key"

4. **Copy Your API Key**
   - Copy the API key (starts with `AIza...`)
   - Save it securely

5. **Add to Your Project**
   ```bash
   # Edit your .env file
   LLM_PROVIDER=gemini
   GEMINI_API_KEY=AIza_your_actual_key_here
   ```

### Gemini Free Tier Limits:
- **Rate Limit:** 15 requests/minute, 1,500 requests/day
- **Context:** 1,000,000 tokens (massive!)
- **Models:** Gemini 1.5 Flash, Gemini 1.5 Pro
- **Cost:** $0 (completely free!)

---

## 📊 Comparison: Groq vs Gemini

| Feature | Groq (Llama 3.1) | Gemini 1.5 Flash |
|---------|------------------|------------------|
| **Cost** | FREE | FREE |
| **Speed** | ⚡ Ultra Fast | ⚡ Very Fast |
| **Quality** | Excellent | Excellent |
| **Rate Limit** | 30/min | 15/min |
| **Daily Limit** | 14,400 | 1,500 |
| **Context** | 32K tokens | 1M tokens |
| **Best For** | Speed, High volume | Large documents |
| **Setup Time** | 2 minutes | 2 minutes |

**Our Recommendation:** Start with **Groq** - it's faster and has higher rate limits!

---

## ⚙️ Configuration

### In Your .env File

```env
# Choose your provider (groq, gemini, or anthropic)
LLM_PROVIDER=groq

# Add your API key
GROQ_API_KEY=gsk_your_key_here
# OR
GEMINI_API_KEY=AIza_your_key_here
# OR
ANTHROPIC_API_KEY=sk-ant_your_key_here
```

### Switching Providers

To switch between providers, just change `LLM_PROVIDER`:

```bash
# Use Groq (fastest, free)
LLM_PROVIDER=groq

# Use Gemini (large context, free)
LLM_PROVIDER=gemini

# Use Claude (paid, most capable)
LLM_PROVIDER=anthropic
```

---

## 🧪 Test Your API Key

After adding your API key, test it:

```bash
# Start the server
npm run dev

# The server will tell you which LLM provider is active:
# "Initialized Groq client" or "Initialized Google Gemini client"
```

---

## 🎯 Quick Setup Commands

### Using Groq (Recommended):

```bash
# 1. Get your Groq API key from: https://console.groq.com/keys

# 2. Update .env file
echo "LLM_PROVIDER=groq" >> .env
echo "GROQ_API_KEY=gsk_your_key_here" >> .env

# 3. Start the server
npm run dev
```

### Using Gemini:

```bash
# 1. Get your Gemini API key from: https://makersuite.google.com/app/apikey

# 2. Update .env file
echo "LLM_PROVIDER=gemini" >> .env
echo "GEMINI_API_KEY=AIza_your_key_here" >> .env

# 3. Start the server
npm run dev
```

---

## 🔐 Security Tips

1. **Never commit API keys to Git**
   - `.env` is already in `.gitignore`
   - Always use `.env.example` for templates

2. **Keep keys secure**
   - Don't share your API keys
   - Don't paste them in public forums
   - Rotate keys if exposed

3. **Use environment variables**
   - Never hardcode keys in source code
   - Always use `process.env.YOUR_KEY`

---

## ❓ Troubleshooting

### "Groq client not initialized"
- Make sure `GROQ_API_KEY` is set in `.env`
- Check that `LLM_PROVIDER=groq`
- Restart the server after changing `.env`

### "Gemini client not initialized"
- Make sure `GEMINI_API_KEY` is set in `.env`
- Check that `LLM_PROVIDER=gemini`
- Restart the server after changing `.env`

### Rate limit errors
- **Groq:** Wait a minute, or reduce request frequency
- **Gemini:** Wait a minute, or switch to Groq for higher limits

### "Invalid API key"
- Double-check you copied the entire key
- Make sure there are no spaces before/after the key
- Generate a new key if needed

---

## 💡 Pro Tips

1. **Start with Groq** for development (faster, higher limits)
2. **Use Gemini** if you need to process very large documents (1M tokens!)
3. **Monitor your usage** in the respective dashboards:
   - Groq: https://console.groq.com/usage
   - Gemini: https://aistudio.google.com/

4. **Implement retry logic** for rate limit errors (already built-in!)

---

## 🎉 You're Ready!

Once you have your API key:
1. Add it to `.env`
2. Set `LLM_PROVIDER` appropriately
3. Run `npm run dev`
4. Start building amazing educational content!

Both Groq and Gemini are production-ready and completely free. Perfect for hackathons, MVPs, and even production apps!

---

**Need Help?**
- Groq Docs: https://console.groq.com/docs
- Gemini Docs: https://ai.google.dev/docs
- Our Docs: Check `GETTING_STARTED.md`
