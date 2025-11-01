# Google Maps API Key Setup - Next Steps

## ✅ Status: API Key Added Locally

### Commerce App (jeffyb)
- ✅ API key configured in `.env.local`
- ⚠️ **Action Required**: Add to Vercel for production

### Delivery App (jeffy-delivery)
- ✅ API key configured in `.env.local`
- ⚠️ **Action Required**: Add to Vercel for production

---

## 📝 Next Steps

### Step 1: Add API Key to Vercel (Both Projects)

**Commerce App (`jeffyb`):**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `jeffyb` project
3. Settings → Environment Variables
4. Add or update:
   - **Name**: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - **Value**: `AIzaSyAT5FF3xVciBazvfh2CkMVZQQ3986EkyhA`
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development
5. Click "Save"
6. **Redeploy** the app (or wait for auto-deploy)

**Delivery App (`jeffy-delivery`):**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `jeffy-delivery` project
3. Settings → Environment Variables
4. Add or update:
   - **Name**: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - **Value**: `AIzaSyAT5FF3xVciBazvfh2CkMVZQQ3986EkyhA`
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development
5. Click "Save"
6. **Redeploy** the app (or wait for auto-deploy)

---

### Step 2: Test Locally

**Commerce App:**
```bash
cd /Users/tredouxwillemse/Desktop/jeffyb
rm -rf .next
npm run dev
```
Then test: `http://localhost:3000/checkout` → Step 2
- Should see address autocomplete with suggestions

**Delivery App:**
```bash
cd /Users/tredouxwillemse/Desktop/jeffy-delivery
rm -rf .next
npm run dev
```
Then test: Login → View delivery assignment
- Should see embedded map with route

---

### Step 3: Test on Vercel (After Adding Key)

1. Wait for Vercel deployment to complete (2-3 minutes)
2. Visit your Vercel URLs
3. Test address autocomplete and maps

---

## ✅ What Should Work Now

**Commerce App (Checkout):**
- ✅ Google Places Autocomplete with address suggestions
- ✅ Auto-fills city and postal code
- ✅ Captures coordinates automatically
- ✅ Visual feedback (MapPin icon, checkmark when validated)

**Delivery App:**
- ✅ Embedded Google Maps with route visualization
- ✅ Accurate route calculation using coordinates
- ✅ Navigation link uses coordinates for precision

---

## 🔒 Security Recommendation

**Restrict Your API Key** (if not done already):
1. Go to [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials?project=jeffy-maps)
2. Click on your API key
3. Set restrictions:
   - **Application restrictions**: HTTP referrers
   - **API restrictions**: Only Maps JavaScript API, Places API, Directions API, Geocoding API
4. Save

---

## 📊 Summary

**Local Development**: ✅ Ready
**Vercel Production**: ⚠️ Add API key to both projects
**Testing**: Ready after Vercel setup

**Status**: API key configured locally, ready for Vercel deployment ✅

