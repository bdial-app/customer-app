# PWA Installation Debugging Guide

## Common Issues & Solutions

### Issue 1: "Install App" Button Not Appearing on Mobile

#### Google Chrome/Edge (Android)

**Check these in order:**

1. **Open DevTools (F12 on desktop)**

   ```
   - Go to Console tab
   - Look for "✓ Service Worker registered successfully"
   - If you see "✗ Service Worker registration failed", check the error
   ```

2. **Check Manifest**

   ```
   - Application → Manifest
   - Verify all fields are populated
   - Icons should be listed (click to verify they load)
   ```

3. **Check Cache Storage**

   ```
   - Application → Storage → Cache Storage
   - Should see "bohri-connect-v1" and "bohri-runtime-cache-v1"
   - If empty, service worker isn't working
   ```

4. **Test on HTTPS**
   - PWA requires HTTPS in production
   - Local development (localhost) is an exception
   - Deploy to HTTPS server to test on real device

5. **Clear Cache & Reinstall**
   ```
   Chrome: Settings → Apps → Your app → Uninstall
   Then reload the page and try installing again
   ```

#### Safari (iOS 14.6+)

- Tap Share icon (bottom center)
- Swipe down and tap "Add to Home Screen"
- The option should appear if PWA criteria are met

**Note**: iOS doesn't require manifest.json for "Add to Home Screen", but it does need:

- `<meta name="apple-mobile-web-app-capable" content="yes">`
- `<meta name="apple-mobile-web-app-status-bar-style" content="default">`
- `<link rel="apple-touch-icon" href="/icon-192x192.png">`

---

## PWA Installation Checklist

### ✅ Required Configuration

1. **Manifest.json**

   ```
   ✓ "display": "standalone" (not "fullscreen")
   ✓ "start_url": "/" (defined)
   ✓ "theme_color": "#F59E0B" (defined)
   ✓ "background_color": "#ffffff" (defined)
   ✓ "icons" array with at least one 192x192 icon (REQUIRED)
   ✓ "name" or "short_name" defined
   ```

2. **Service Worker**

   ```
   ✓ Registered at /sw.js (check console)
   ✓ Must be on HTTPS (or localhost)
   ✓ Must respond to fetch events
   ✓ Must cache responses
   ```

3. **HTML Head Tags**

   ```html
   ✓ <link rel="manifest" href="/manifest.json" /> ✓
   <meta name="theme-color" content="#F59E0B" /> ✓
   <meta name="viewport" content="..." /> ✓
   <meta name="apple-mobile-web-app-capable" content="yes" /> ✓
   <link rel="apple-touch-icon" href="/icon-192x192.png" />
   ```

4. **Icons**

   ```
   ✓ At least one icon in manifest
   ✓ Icon must be PNG format
   ✓ Icon must be actual file (not broken link)
   ✓ Icon should be at least 192x192
   ✓ For best results: also provide 512x512
   ```

5. **Protocol**
   ```
   ✓ HTTPS required (production)
   ✓ localhost is exception (development)
   ✓ HTTP will NOT work on real devices
   ```

---

## Testing PWA Locally

### Desktop Chrome/Edge

1. Open DevTools (F12)
2. Application tab → Manifest
3. Look for "Install" button or run in DevTools console:
   ```javascript
   // Manually trigger install prompt
   let deferredPrompt;
   window.addEventListener("beforeinstallprompt", (e) => {
     deferredPrompt = e;
   });
   ```

### Android Chrome

1. Visit `chrome://inspect/#devices`
2. Connect Android device via USB
3. Open Chrome on phone
4. Navigate to your app URL
5. You should see install prompt within 30 seconds

### iOS Safari

1. No debugging equivalent
2. Test on real device only
3. Tap Share → Add to Home Screen

---

## Console Error Messages & Solutions

### "Error: 404 (Not Found) for /manifest.json"

**Solution**: Ensure `<link rel="manifest" href="/manifest.json">` is in HTML head

### "Service Worker registration failed"

**Solution**:

- Check browser console for specific error
- Verify `/sw.js` exists and is accessible
- Check for JavaScript errors in service worker file
- Test: Visit `https://yoursite.com/sw.js` in browser (should download file)

### "No 'Access-Control-Allow-Origin' header"

**Solution**:

- Don't cache requests to external domains (already handled in sw.js)
- Check CORS headers from API server

### "Cannot use geolocation API in non-secure context"

**Solution**:

- Use HTTPS (required for geolocation)
- localhost is exception for development

---

## Current Status

Your PWA is configured with:

- ✅ Manifest: `/public/manifest.json`
- ✅ Service Worker: `/public/sw.js`
- ✅ Icons: Using `cloth-icon.png` (available in /public)
- ✅ Geolocation permission declared
- ✅ File upload permission declared

---

## Quick Troubleshooting Steps

### Step 1: Check if Service Worker Registered

```javascript
// Run in mobile browser console:
navigator.serviceWorker.getRegistrations().then((registrations) => {
  console.log("SW Registrations:", registrations);
});
```

### Step 2: Check Manifest Validation

```javascript
// Run in mobile browser console:
fetch("/manifest.json")
  .then((r) => r.json())
  .then((manifest) => {
    console.log("Manifest:", manifest);
    console.log("Has icons?", !!manifest.icons?.length);
    console.log("Display mode:", manifest.display);
  });
```

### Step 3: Verify Icons Load

```javascript
// Run in mobile browser console:
fetch("/cloth-icon.png")
  .then((r) => {
    console.log("Icon status:", r.status, r.statusText);
    return r.blob();
  })
  .then((blob) => console.log("Icon size (bytes):", blob.size));
```

### Step 4: Check Service Worker Activation

```javascript
// Run in mobile browser console:
navigator.serviceWorker.controller
  ? console.log("✓ SW is controlling this page")
  : console.log("✗ SW is NOT controlling this page");
```

---

## Platform-Specific Requirements

### Android (Chrome, Edge, Samsung Internet)

- Manifest with icons (minimum 192x192)
- Service Worker must be registered
- Display mode must be "standalone"
- HTTPS (except localhost)

### iOS (Safari 14.6+)

- Apple meta tags (app-capable, status-bar-style, touch-icon)
- Display name via `<title>` or short_name
- Icons in manifest (optional, but recommended)
- No HTTPS required for "Add to Home Screen"

---

## Next Steps

1. **Create Proper Icons**:
   - Generate 192x192 and 512x512 PNG icons
   - Place in `/public/`
   - Update manifest to reference them

2. **Deploy to HTTPS**:
   - Use Vercel, Netlify, or similar service
   - PWA won't install from HTTP in production

3. **Test Installation**:
   - Try on Android Chrome first (easiest)
   - Then test iOS Safari
   - Verify offline functionality works

4. **Monitor Installation**:
   - Check DevTools for install prompts
   - Use analytics to track app installs
