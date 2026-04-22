# PWA Setup Guide

This project is now configured as a Progressive Web App (PWA) with the following permissions:

1. **Geolocation** - For location-based service discovery
2. **File Upload** - For profile pictures and document uploads

## Configuration Files

### 1. **Manifest (`/public/manifest.json`)**

- Defines app metadata, icons, shortcuts, and permissions
- Enables offline support and app installation

### 2. **Service Worker (`/public/sw.js`)**

- Handles offline functionality
- Implements caching strategies:
  - **Network First** for API calls
  - **Cache First** for static assets
- Automatically updates in the background

### 3. **Service Worker Hook (`/hooks/useServiceWorker.ts`)**

- Registers the service worker on app load
- Checks for updates every minute
- Logs registration status

### 4. **Layout Updates**

- Added PWA meta tags for iOS compatibility
- Added manifest link
- Integrated service worker registration

## Required Icons

For the PWA to work properly, add these icons to `/public/`:

```
/public/icon-192x192.png          (192x192 PNG)
/public/icon-512x512.png          (512x512 PNG)
/public/icon-192x192-maskable.png (192x192 PNG - maskable format)
/public/icon-512x512-maskable.png (512x512 PNG - maskable format)
/public/screenshot-1.png          (540x720 PNG - mobile screenshot)
/public/screenshot-2.png          (1280x720 PNG - desktop screenshot)
```

### Icon Requirements:

- Use the app's amber (#F59E0B) and dark colors
- Ensure clean, recognizable design
- Maskable icons should have 40px padding around the core design

## Permissions Handling

### Geolocation

The app already requests geolocation in several places:

- `useGeocode` hook
- `add-location` page
- Provider discovery features

Users will be prompted to grant permission when needed.

### File Upload

Handled through standard HTML file input elements:

- Profile picture uploads
- Document uploads for provider verification

No additional permission configuration needed.

## Testing PWA Functionality

### Desktop (Chrome/Edge):

1. Open DevTools (F12)
2. Go to Application → Manifest
3. Click "Add to shelf" or use the install prompt

### Mobile (Android):

1. Open app in Chrome
2. Tap menu → "Install app" or browser install prompt

### Desktop (Safari/macOS):

1. Tap Share icon
2. Select "Add to Dock"

## Offline Support

The service worker enables:

- **Offline access** to previously loaded pages
- **Cache strategies** that prioritize network when available
- **Automatic updates** without user intervention

## Debugging

Check browser console for service worker logs:

```
✓ Service Worker registered successfully
✗ Service Worker registration failed
Service Worker updated
```

Check DevTools:

- **Application → Service Workers** - Registration status
- **Application → Cache Storage** - Cached files
- **Application → Manifest** - PWA metadata

## Browser Support

Supported on:

- ✅ Chrome/Edge (Android & Desktop)
- ✅ Safari (iOS 14.6+ & macOS)
- ✅ Firefox (Desktop)
- ✅ Samsung Internet (Android)

## Next Steps

1. **Generate Icons**: Create app icons in the required sizes
2. **Add Screenshots**: Add screenshots for app store listing
3. **Test on Devices**: Test installation on iOS and Android
4. **Monitor Analytics**: Track PWA installations and usage
5. **Update Content**: Regularly update content through the app
