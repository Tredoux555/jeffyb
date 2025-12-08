# Setting Environment Variables in Vercel for Production

## Step-by-Step Guide

### 1. Go to Vercel Dashboard
- Visit: https://vercel.com/dashboard
- Sign in to your account

### 2. Select Your Project
- Click on the **"jeffyb"** project (or whatever your project is named)

### 3. Navigate to Environment Variables
- Click on **"Settings"** (in the top navigation)
- Click on **"Environment Variables"** (in the left sidebar)

### 4. Check Existing Variables
- Look for `SUPABASE_SERVICE_ROLE_KEY` in the list
- If it exists, check which environments it's enabled for:
  - ✅ Production
  - ✅ Preview  
  - ✅ Development

### 5. Add or Update the Variable

**If the variable doesn't exist:**
1. Click **"Add New"** button
2. **Key**: `SUPABASE_SERVICE_ROLE_KEY`
3. **Value**: Paste your service role key from Supabase
   - Get it from: Supabase Dashboard → Project Settings → API → `service_role` key
4. **Environments**: Check ALL THREE boxes:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. Click **"Save"**

**If the variable exists but Production is unchecked:**
1. Click on the variable to edit it
2. Make sure **Production** is checked ✅
3. Click **"Save"**

### 6. Redeploy Your Application
**IMPORTANT**: After adding/updating environment variables, you MUST redeploy:

**Option A: Automatic Redeploy (Recommended)**
- Vercel will automatically detect the change
- Go to **"Deployments"** tab
- Wait for the latest deployment to complete (or trigger a new one)

**Option B: Manual Redeploy**
- Go to **"Deployments"** tab
- Click the **"..."** (three dots) on the latest deployment
- Click **"Redeploy"**
- Or push a new commit to trigger a deployment

### 7. Verify It's Working
After redeployment, test the SEO tool:
1. Go to: https://www.jeffy.co.za/admin/seo
2. Click "Generate SEO for X Products"
3. Check the browser console (F12) for any errors
4. Check Vercel logs: Deployments → Latest → Functions → View Logs

---

## Troubleshooting

### If it still doesn't work after redeploy:

1. **Check Vercel Logs**
   - Go to Deployments → Latest deployment → Functions
   - Look for `[Admin Client]` log messages
   - Should see: `SERVICE_ROLE_KEY present: true`

2. **Verify the Key Format**
   - Service role key should start with `eyJ...`
   - Should be very long (200+ characters)
   - Make sure there are no extra spaces when copying

3. **Check Variable Name**
   - Must be exactly: `SUPABASE_SERVICE_ROLE_KEY`
   - Case-sensitive
   - No spaces or special characters

4. **Force a New Deployment**
   - Make a small change to any file (add a comment)
   - Commit and push
   - This forces Vercel to rebuild with fresh environment variables

---

## Quick Test

After setting up, you can test if the environment variable is accessible by checking the Vercel function logs when you use the SEO tool. The logs should show:
```
[Admin Client] Checking environment variables...
[Admin Client] SUPABASE_URL present: true
[Admin Client] SERVICE_ROLE_KEY present: true
[Admin Client] SERVICE_ROLE_KEY length: [should be 200+]
[Admin Client] Client created successfully
```

If you see `SERVICE_ROLE_KEY present: false`, the environment variable is not set correctly.

