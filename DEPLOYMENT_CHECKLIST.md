# Deployment Troubleshooting Checklist

## ✅ Quick Checks

### 1. **Verify Vercel Connection**
- Go to [Vercel Dashboard](https://vercel.com/dashboard)
- Check if your `jeffyb` project is connected to `Tredoux555/jeffyb` GitHub repo
- If not connected: Click "Add New Project" → Import from GitHub → Select `jeffyb`

### 2. **Check Deployment Status**
- In Vercel Dashboard → Your Project → "Deployments" tab
- Look for the latest deployment (should show commit `2acce19`)
- Check status:
  - ✅ **Ready** = Deployed successfully
  - ⏳ **Building** = Still deploying
  - ❌ **Error** = Build failed (check logs)

### 3. **Check Build Logs**
If deployment shows "Error":
- Click on the failed deployment
- Scroll to "Build Logs"
- Look for error messages (common issues below)

### 4. **Verify Environment Variables**
In Vercel Dashboard → Settings → Environment Variables, ensure these are set:

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Optional but Recommended:**
- `NEXT_PUBLIC_SITE_URL` (defaults to `https://jeffy.co.za` if not set)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- Payment keys (Stripe, PayPal) if using

### 5. **Check Auto-Deploy Settings**
- Vercel Dashboard → Settings → Git
- Ensure "Production Branch" is set to `main`
- Ensure "Auto-deploy" is enabled

### 6. **Manual Deployment Trigger**
If auto-deploy isn't working:
- Vercel Dashboard → Deployments → "Redeploy" button
- Or push an empty commit:
  ```bash
  git commit --allow-empty -m "Trigger deployment"
  git push origin main
  ```

## 🔍 Common Issues & Fixes

### Issue: "Build Failed"
**Check:**
- Build logs for TypeScript errors
- Missing dependencies
- Environment variable errors

**Fix:**
- Run `npm run build` locally first
- Fix any errors locally
- Push fixes

### Issue: "Deployment Not Triggered"
**Check:**
- GitHub webhook is connected
- Vercel has repo access

**Fix:**
- Reconnect GitHub integration
- Check GitHub → Settings → Webhooks for Vercel webhook

### Issue: "Environment Variables Missing"
**Fix:**
- Add all required env vars in Vercel Dashboard
- Redeploy after adding

### Issue: "Node Version Mismatch"
**Fix:**
- Add to `package.json`:
  ```json
  "engines": {
    "node": ">=18.0.0"
  }
  ```

## 🚀 Force Deployment

If nothing works, trigger a manual deployment:

```bash
# Option 1: Empty commit
git commit --allow-empty -m "Trigger Vercel deployment"
git push origin main

# Option 2: Make a small change
echo "# Deployment trigger" >> README.md
git add README.md
git commit -m "Trigger deployment"
git push origin main
```

## 📊 Check Deployment Status

Visit your Vercel project URL to see if it's live:
- Production URL: Check Vercel Dashboard → Domains
- Preview URLs: Check in Deployments tab

---

**Still not working?** Check Vercel's status page: https://vercel.com/status

