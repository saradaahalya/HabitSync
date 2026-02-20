# 🔧 Firebase Google Sign-In Troubleshooting

## What You're Seeing

You click "Sign in with Google" and get: **"Login failed. Try again."**

## Debugging Steps

### Step 1: Check Browser Console (F12)
1. Press **F12** to open Developer Tools
2. Go to **Console** tab
3. Try signing in again
4. Look for error messages in console

### Step 2: Common Error Codes & Solutions

#### ❌ **auth/popup-blocked**
**Meaning:** Browser blocked the popup
**Solution:**
- Check if popup blocker is enabled
- Try in Incognito/Private mode
- Add your domain to popup whitelist

#### ❌ **auth/popup-closed-by-user**
**Meaning:** User closed the Google popup
**Solution:** Just try again

#### ❌ **auth/unauthorized-domain**
**Meaning:** Your domain is NOT authorized in Firebase console
**Solution:** 
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (habitsync-455d3)
3. Go to **Authentication** → **Settings**
4. Add your domain to "Authorized domains"
   - If local: `localhost`, `127.0.0.1`
   - If deployed: `your-domain.com`

#### ❌ **auth/operation-not-supported-in-this-environment**
**Meaning:** Environment or Firebase config issue
**Solution:**
- Verify all Firebase scripts loaded (check Network tab in F12)
- Check that firebase-compat.js is included
- Refresh page and try again

#### ❌ **auth/invalid-api-key**
**Meaning:** Firebase API Key is invalid
**Solution:**
- Verify API key in auth.js matches Firebase console
- Check key is enabled for Google Sign-In

---

## Firebase Console Setup

### Required Steps to Make Google Sign-In Work

1. **Go to Firebase Console**
   - https://console.firebase.google.com/
   - Select project: `habitsync-455d3`

2. **Enable Google Sign-In**
   - Left sidebar → **Authentication**
   - Click **Get Started**
   - In **Sign-in method** tab
   - Click **Google** 
   - Toggle **Enable** ✓
   - Set Support email
   - Click **Save**

3. **Configure OAuth Consent Screen**
   - In same section, should see link to "Google Cloud Console"
   - Or go to: https://console.cloud.google.com/
   - Search: **OAuth consent screen**
   - Set **User Type:** External
   - Configure:
     - App name: HabitSync
     - User support email: your-email@gmail.com
     - Save & Continue

4. **Create OAuth 2.0 Credential**
   - In Google Cloud Console
   - Go to **Credentials**
   - Click **Create Credentials** → **OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorized JavaScript origins:
     - `http://localhost:3000` (if running locally)
     - `http://127.0.0.1:5500` (if using Live Server)
     - `file://` (NOT recommended but works locally)
   - Click **Create**
   - Copy Client ID

5. **Add Authorized Domains**
   - Back in Firebase Console
   - **Authentication** → **Settings** tab
   - Scroll to **Authorized domains**
   - Add:
     - `localhost`
     - `127.0.0.1`
     - Your deployment domain (if applicable)

6. **Verify API Key**
   - In Firebase console: **Project Settings** (gear icon)
   - Copy API Key
   - Verify it matches in auth.js

---

## Testing Locally

### Option 1: Using Live Server (VS Code)
1. Install "Live Server" extension in VS Code
2. Right-click `index.html` → "Open with Live Server"
3. Should open at `http://127.0.0.1:5500`
4. Add this domain to Firebase Authorized domains
5. Try sign-in

### Option 2: Using Python HTTP Server
```bash
python -m http.server 8000
# Open: http://localhost:8000
```

### Option 3: Using Node.js HTTP Server
```bash
npx http-server
# Open: http://localhost:8080
```

---

## Quick Checklist

- [ ] Firebase scripts load (check Network tab - F12)
- [ ] Google Sign-In enabled in Firebase console
- [ ] OAuth consent screen configured
- [ ] Your domain added to Authorized domains
- [ ] API key is valid
- [ ] Popup not blocked by browser
- [ ] Browser console shows no errors
- [ ] Try in Incognito/Private mode

---

## If Still Not Working

1. **Check console output** (F12 → Console)
   - Note the exact error code
   
2. **Verify Firebase config** in auth.js:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyBVizMs2008bavqmB5cQVeYiGOZFuFewDU",
     authDomain: "habitsync-455d3.firebaseapp.com",
     projectId: "habitsync-455d3",
     storageBucket: "habitsync-455d3.firebasestorage.app",
     messagingSenderId: "861608812567",
     appId: "1:861608812567:web:628f74d182db113b4abc52"
   };
   ```

3. **Re-verify Firebase Console settings**
   - Project name: habitsync-455d3
   - Google Sign-In: Enabled ✓
   - Your domain in Authorized domains

4. **Try in different browser**
   - Chrome, Firefox, Safari
   - Incognito/Private mode

---

## How to Access Firebase Console

**Local Testing:**
- Domain: `localhost` or `127.0.0.1`
- Add to Firebase → Authentication → Settings → Authorized domains

**Production:**
- Domain: `your-domain.com`
- Add to Firebase → Authentication → Settings → Authorized domains

---

## Enhanced Error Messages

I've updated auth.js to show specific error messages:
- "Popup was blocked" → Allow popups
- "Domain not authorized" → Add to Firebase console
- "Invalid API key" → Check Firebase config
- "Not supported in this environment" → Refresh, check scripts load

**Check console (F12) for detailed error codes!**

---

## Next Steps

1. Open browser Developer Tools (F12)
2. Try signing in again
3. Note the exact error code from console
4. Go to Firebase console and verify setup
5. Let me know the error code if still stuck!

**Common fixes:**
- ✅ Domain not authorized → Add to Firebase
- ✅ Google Sign-In disabled → Enable in Firebase
- ✅ OAuth consent screen not set → Configure it
- ✅ Popup blocked → Allow in browser

You've got this! 🚀
