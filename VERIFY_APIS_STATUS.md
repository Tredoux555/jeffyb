# Google Maps APIs - Verification Guide

## ✅ Current Status

### Local Configuration
- ✅ **Commerce App (`jeffyb`)**: API key configured in `.env.local`
- ✅ **Delivery App (`jeffy-delivery`)**: API key configured in `.env.local`
- ✅ **API Key**: `AIzaSyAT5FF3xVciBazvfh2CkMVZQQ3986EkyhA`

### APIs That Need to Be Enabled
Based on your code, you need these **4 Google Maps Platform APIs**:

1. **Maps JavaScript API** - ✅ (You confirmed this is enabled)
2. **Places API** - ⚠️ Need to verify
3. **Directions API** - ⚠️ Need to verify
4. **Geocoding API** - ⚠️ Need to verify

---

## 🧪 How to Test if APIs Are Working

### Method 1: Quick Browser Test (Easiest)

1. **Open the test file** I created:
   ```bash
   open /Users/tredouxwillemse/Desktop/jeffyb/test-google-apis.html
   ```
   Or double-click `test-google-apis.html` in Finder

2. **Check the status indicators**:
   - Each API will show: ✅ Working (green) or ❌ Failed (red)
   - If any show ❌, that API is not enabled or has issues

3. **Test each API**:
   - **Maps JavaScript API**: Should show a map of Johannesburg
   - **Places API**: Type an address - should show autocomplete suggestions
   - **Geocoding API**: Click "Test Geocoding" button - should show coordinates
   - **Directions API**: Click "Test Directions" button - should calculate route

### Method 2: Test in Your Actual Apps

**Commerce App - Test Address Autocomplete:**
```bash
cd /Users/tredouxwillemse/Desktop/jeffyb
rm -rf .next
npm run dev
```
Then go to: `http://localhost:3000/checkout`
- Fill in delivery info → Step 2
- Type in the address field
- **Expected**: Should see address suggestions dropdown
- **If not working**: Check browser console (F12) for API errors

**Delivery App - Test Map Display:**
```bash
cd /Users/tredouxwillemse/Desktop/jeffy-delivery
rm -rf .next
npm run dev
```
Then: Login → View a delivery assignment
- **Expected**: Should see embedded map with route
- **If not working**: Check browser console for API errors

### Method 3: Check Google Cloud Console

1. Go to: [APIs & Services Dashboard](https://console.cloud.google.com/apis/dashboard?project=jeffy-maps)
2. Click **"Enabled APIs"** tab
3. You should see all 4 APIs listed:
   - ✅ Maps JavaScript API
   - ✅ Places API
   - ✅ Directions API
   - ✅ Geocoding API

---

## 🔍 Common Error Messages & What They Mean

### "This API project is not authorized to use this API"
**Meaning**: API is not enabled
**Fix**: Enable the API in Google Cloud Console

### "API key not valid"
**Meaning**: API key is incorrect or restricted
**Fix**: Check API key in `.env.local` files

### "RefererNotAllowedMapError"
**Meaning**: API key is restricted and current domain not allowed
**Fix**: Update API key restrictions in Google Cloud Console

### "REQUEST_DENIED"
**Meaning**: API is enabled but billing/quota issue
**Fix**: Check billing account is linked

---

## ✅ What Should Work After APIs Are Enabled

### Commerce App (`jeffyb`)
1. **Checkout Address Input** (`/checkout`):
   - ✅ Type address → See autocomplete suggestions
   - ✅ Select address → Auto-fills city, postal code
   - ✅ Green checkmark appears when validated
   - ✅ Coordinates (lat/lng) captured automatically

### Delivery App (`jeffy-delivery`)
1. **Delivery Map** (delivery assignment page):
   - ✅ Map displays with pickup and delivery markers
   - ✅ Green route line shows calculated path
   - ✅ Navigation link works with coordinates

### Both Apps
1. **Error Handling**:
   - ✅ Graceful fallback if API key missing
   - ✅ Manual address input still works
   - ✅ No crashes if APIs fail

---

## 🚀 Next Steps

1. **Open the test file** to verify all 4 APIs:
   ```bash
   open /Users/tredouxwillemse/Desktop/jeffyb/test-google-apis.html
   ```

2. **If any API fails**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/apis/dashboard?project=jeffy-maps)
   - Enable the missing API
   - Wait 1-2 minutes
   - Test again

3. **If all APIs pass**:
   - ✅ APIs are working!
   - Next: Add API key to Vercel (for production)
   - Test in your actual apps locally

---

## 📊 Expected Test Results

| API | Test Result | What It Means |
|-----|------------|---------------|
| Maps JavaScript API | ✅ Working | Map displays correctly |
| Places API | ✅ Working | Autocomplete shows suggestions |
| Geocoding API | ✅ Working | Can convert address to coordinates |
| Directions API | ✅ Working | Can calculate routes |

**If all show ✅**: Your APIs are activated and working! 🎉

**If any show ❌**: That specific API needs to be enabled in Google Cloud Console.

