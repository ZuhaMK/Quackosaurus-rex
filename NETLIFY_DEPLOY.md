# Netlify Deployment Guide

This guide will help you deploy the Quackosaurus-rex app to Netlify.

## Prerequisites

1. A Netlify account (sign up at https://netlify.com)
2. Your repository pushed to GitHub/GitLab/Bitbucket
3. Your OpenAI API key

## Deployment Steps

### Option 1: Deploy via Netlify UI (Recommended for first-time)

1. **Connect your repository:**
   - Go to https://app.netlify.com
   - Click "Add new site" → "Import an existing project"
   - Connect to your Git provider (GitHub, GitLab, or Bitbucket)
   - Select your repository

2. **Configure build settings:**
   - **Base directory:** Leave empty (or `/` if required)
   - **Build command:** Leave empty (no build step needed)
   - **Publish directory:** `Web`
   - **Functions directory:** `netlify/functions`

3. **Set environment variables:**
   - Go to Site settings → Environment variables
   - Click "Add variable"
   - Key: `OPENAI_API_KEY`
   - Value: Your OpenAI API key (e.g., `sk-...`)
   - Click "Save"

4. **Deploy:**
   - Click "Deploy site"
   - Wait for deployment to complete

### Option 2: Deploy via Netlify CLI

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify:**
   ```bash
   netlify login
   ```

3. **Initialize your site:**
   ```bash
   netlify init
   ```
   Follow the prompts:
   - Create & configure a new site
   - Select your team
   - Leave build command empty
   - Publish directory: `Web`
   - Functions directory: `netlify/functions`

4. **Set environment variable:**
   ```bash
   netlify env:set OPENAI_API_KEY "sk-your-key-here"
   ```

5. **Deploy:**
   ```bash
   netlify deploy --prod
   ```

## Important Notes

### Python Runtime
- Netlify will automatically detect Python functions in `netlify/functions/`
- The `runtime.txt` file specifies Python 3.11
- Each function should have its own `requirements.txt` (or a shared one in `netlify/functions/`)

### Environment Variables
- Your `OPENAI_API_KEY` must be set in Netlify's environment variables
- This is different from your local `.env` file
- Go to Site settings → Environment variables to manage them

### Function Behavior
- **Important:** Chat history is stored in memory and will reset on each function invocation
- For persistent chat history, you'd need to use a database (e.g., Netlify Functions with an external database)

### Testing Locally
Before deploying, test locally:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Serve site locally
netlify dev
```

This will:
- Serve your static files from `Web/`
- Run your serverless functions locally
- Allow you to test the full app

### Troubleshooting

1. **Functions not working:**
   - Check that `netlify/functions/` directory exists
   - Verify `requirements.txt` is in `netlify/functions/`
   - Check Netlify deployment logs for errors

2. **Environment variables not loading:**
   - Make sure `OPENAI_API_KEY` is set in Netlify dashboard
   - Redeploy after adding environment variables

3. **CORS errors:**
   - The functions already include CORS headers
   - If issues persist, check Netlify function logs

4. **Static files not serving:**
   - Verify `publish = "Web"` in `netlify.toml`
   - Check that your HTML files are in the `Web/` directory

## Post-Deployment

After successful deployment:
1. Visit your site URL (provided by Netlify)
2. Test the chat functionality
3. Check browser console for any errors
4. Monitor Netlify function logs for issues

## Custom Domain (Optional)

1. Go to Site settings → Domain management
2. Add your custom domain
3. Follow DNS configuration instructions

---

**Need help?** Check Netlify's documentation: https://docs.netlify.com/

