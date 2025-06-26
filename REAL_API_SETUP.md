# Real AI API Setup Guide

This guide will help you configure your AI Agent Suite to use real APIs instead of mock data.

## 🔑 Required API Keys

### 1. OpenAI API Key (Required)
- **Purpose**: Powers all AI agent intelligence and natural language processing
- **Get it from**: https://platform.openai.com/api-keys
- **Steps**:
  1. Sign up for OpenAI account
  2. Navigate to API Keys section  
  3. Create a new secret key
  4. Copy the key (starts with `sk-`)
  5. Add to `.env`: `VITE_OPENAI_API_KEY=sk-your-key-here`

### 2. Composio API Key (Required)
- **Purpose**: Enables tool integrations (Gmail, Calendar, Slack, etc.)
- **Get it from**: https://app.composio.dev/
- **Steps**:
  1. Sign up for Composio account
  2. Navigate to API Keys section
  3. Generate a new API key
  4. Add to `.env`: `VITE_COMPOSIO_API_KEY=your-composio-key`

### 3. ElevenLabs API Key (Optional)
- **Purpose**: AI voice generation and text-to-speech
- **Get it from**: https://elevenlabs.io/
- **Steps**:
  1. Create ElevenLabs account
  2. Go to API section in dashboard
  3. Copy your API key
  4. Add to `.env`: `VITE_ELEVENLABS_API_KEY=your-elevenlabs-key`

### 4. Supabase Configuration (Required for CRM)
- **Purpose**: Database for CRM data and user management
- **Get it from**: https://supabase.com/
- **Steps**:
  1. Create new Supabase project
  2. Copy Project URL and anon key from settings
  3. Add to `.env`:
     ```
     VITE_SUPABASE_URL=https://your-project.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key
     ```

## 📝 Environment Setup

1. **Create `.env` file** in your project root:
   ```bash
   cp .env.example .env
   ```

2. **Fill in your API keys**:
   ```env
   # OpenAI - Required for AI agents
   VITE_OPENAI_API_KEY=sk-your-openai-key

   # Composio - Required for tool integrations  
   VITE_COMPOSIO_API_KEY=your-composio-key

   # ElevenLabs - Optional for voice features
   VITE_ELEVENLABS_API_KEY=your-elevenlabs-key

   # Supabase - Required for CRM data
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

   # Production mode
   VITE_DEVELOPMENT_MODE=false
   ```

3. **Restart your development server**:
   ```bash
   npm run dev
   ```

## 🔧 Tool Integrations via Composio

Once you have Composio configured, you can connect these tools:

### Core Integrations
- **Gmail**: Email sending/receiving
- **Google Calendar**: Meeting scheduling  
- **Slack**: Team communication
- **Zoom**: Video meetings
- **Google Sheets**: Data management

### Business Tools
- **HubSpot/Salesforce**: CRM integration
- **Stripe**: Payment processing
- **Shopify**: E-commerce
- **Trello**: Project management
- **Typeform**: Form management

### Setup Process
1. Go to Composio dashboard
2. Navigate to "Integrations" 
3. Connect each tool you want to use
4. Grant necessary permissions
5. Tools will appear in your agent execution options

## 🚀 Switching to Live Mode

Once your APIs are configured:

1. **Open the app** - you'll see a mode indicator in top-right
2. **Click "Settings"** to open API configuration panel
3. **Test your connections** using the "Test All Connections" button
4. **Switch to Live Mode** - toggle will turn red when active
5. **Execute goals** - AI agents will now use real APIs!

## ⚠️ Important Notes

### Security
- API keys are stored locally in your browser
- Never commit `.env` files to version control
- Use environment variables in production
- Regularly rotate your API keys

### Rate Limits
- OpenAI: Depends on your plan (usually 3-60 RPM)
- Composio: Check your plan limits
- ElevenLabs: Free tier has monthly character limits

### Costs
- **OpenAI**: ~$0.002 per agent execution
- **Composio**: Free tier includes 1000 actions/month
- **ElevenLabs**: Free tier includes 10,000 characters/month
- **Supabase**: Free tier includes 500MB database

## 🔍 Troubleshooting

### "API key not configured" errors
- Check your `.env` file exists and has correct keys
- Restart your development server after adding keys
- Verify keys don't have extra spaces or quotes

### "Rate limit exceeded" errors  
- You're hitting API limits - wait or upgrade your plan
- OpenAI rate limits reset every minute
- Consider adding delays between rapid executions

### Tool connection failures
- Verify Composio account has connected integrations
- Check tool permissions are granted properly
- Some tools require OAuth setup in Composio dashboard

### Connection test failures
- Check internet connection
- Verify API keys are valid and active
- Some APIs may be temporarily unavailable

## 📊 Monitoring Usage

### OpenAI Usage
- Monitor at: https://platform.openai.com/usage
- Track costs and requests per model
- Set usage limits to avoid surprises

### Composio Usage  
- Check dashboard for action counts
- Monitor connected tool usage
- Upgrade plan as needed

## 🎯 Best Practices

1. **Start Small**: Test with simple goals first
2. **Monitor Costs**: Keep an eye on API usage
3. **Use Demo Mode**: For testing and demonstrations  
4. **Batch Operations**: Group related tasks to minimize API calls
5. **Error Handling**: Always have fallbacks for API failures

## 🆘 Support

If you encounter issues:

1. **Check the browser console** for detailed error messages
2. **Use the API test feature** to verify connections
3. **Review API provider documentation** for specific errors
4. **Check rate limits** if you're getting 429 errors

The app will gracefully fall back to demo mode if real APIs fail, so you can always continue using the interface while troubleshooting.