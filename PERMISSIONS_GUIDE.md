# Permission Handling Guide

This app uses 2 key permissions as requested:

## 1. Geolocation Permission

### Where it's used:

- `/app/add-location/page.tsx` - Location picker
- `/app/components/home/greeting-card.tsx` - User location for nearby services
- `/hooks/useGeocode.ts` - Geocoding services
- Service provider discovery based on user location

### How it works:

```typescript
// Permission is requested when user taps "Enable Location"
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      // Use coordinates
    },
    (error) => console.error("Geolocation denied"),
  );
}
```

### Browser Prompt:

- iOS: "Allow 'Tijarah' to access your location?"
- Android: "Allow Tijarah to access your location?"

**First permission request**: When user tries to access location-based features
**Persistent**: Permission persists until user revokes it in settings

---

## 2. File Upload Permission

### Where it's used:

- Profile picture uploads
- Document uploads for provider verification
- Photo gallery uploads

### How it works:

```typescript
// File input automatically handles file selection
<input
  type="file"
  accept="image/*"
  onChange={(e) => uploadFile(e.target.files[0])}
/>
```

### Browser Prompt:

- iOS: Shows native file picker (Photos, Files, Camera)
- Android: Shows file chooser or camera app

**First permission request**: When user taps "Choose File" button
**No persistent permission needed**: Browser handles file access through file picker

---

## Mobile Platform Differences

### iOS (14.6+)

- **Geolocation**: User grants/denies in app-specific settings
- **File Access**: Through Files app or camera
- **Status**: Check Settings → Privacy → Location Services

### Android

- **Geolocation**: User grants/denies with system popup
- **File Access**: Native file picker or Storage permission
- **Status**: Check Settings → Apps → Tijarah → Permissions

---

## User-Facing Permission Flow

### Geolocation

1. User opens app
2. User navigates to "Add Location" or "Nearby Services"
3. User taps "Enable Location" button
4. Browser shows native permission dialog
5. User grants/denies permission
6. App uses location if granted

### File Upload

1. User taps "Upload Photo" button
2. Browser shows file picker
3. User selects photo from gallery or takes new one
4. Browser uploads file to server
5. No app permission needed (handled by OS file system)

---

## Permission Revocation

### iOS

Settings → Privacy → Location Services → Tijarah → [Allow/Don't Allow]

### Android

Settings → Apps → Tijarah → Permissions → Location → [Allow/Don't Allow]

---

## Best Practices Implemented

✅ **User Control**: Only request permissions when needed (lazy)
✅ **Transparency**: Clear UI explaining why we need permissions
✅ **Minimal Scope**: Only request 2 essential permissions
✅ **Graceful Fallback**: App works without some features if permissions denied
✅ **PWA Manifest**: Declared permissions in manifest.json
✅ **Error Handling**: Proper error handling if permissions denied
