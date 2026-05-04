# Tijarah Connect — Customer App (`customer-app`)

Next.js customer-facing app with Capacitor for native Android/iOS builds.

## Quick Start

```bash
npm install

# Create .env.local
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EOF

npm run dev    # http://localhost:3000
```

---

## Architecture

```
customer-app/
├── app/                 → Next.js App Router (pages + layouts)
│   ├── page.tsx         → Home page
│   ├── layout.tsx       → Root layout (providers, global styles)
│   ├── auth/            → Login/signup flows
│   ├── provider-details/→ Business detail view
│   ├── search/          → Search results
│   ├── categories/      → Category browsing
│   ├── deals/           → Deals/offers listing
│   ├── provider-onboarding/ → Multi-step provider registration
│   ├── components/      → Shared UI components
│   └── context/         → React contexts
├── services/            → API service layer (20 files)
├── store/               → Redux Toolkit (5 slices)
├── hooks/               → Custom hooks (37 hooks)
├── i18n/                → Internationalization config
├── messages/            → Translation files (10 languages)
├── utils/
│   └── axios.ts         → API client with auth interceptor
├── android/             → Capacitor Android project
├── ios/                 → Capacitor iOS project
└── public/              → Static assets, PWA manifest
```

### App Router Pages

| Route | Purpose |
|-------|---------|
| `/` | Home feed (categories, nearby providers, deals) |
| `/auth` | Login/signup (Google OAuth + phone OTP) |
| `/categories` | Browse by category |
| `/search` | Search providers/products |
| `/provider-details/[id]` | Provider profile, reviews, products |
| `/product-details/[id]` | Product detail view |
| `/deals` | Active deals/offers |
| `/provider-onboarding` | Multi-step provider registration |
| `/provider` | Provider dashboard (for providers managing their listing) |
| `/gallery` | Photo gallery view |
| `/invite` | App invite/referral |
| `/women-led` | Women-led businesses section |

---

## Key Patterns

### Hooks-Driven Architecture

The app uses custom hooks as the primary data layer. Each hook encapsulates API calls + React Query:

```typescript
// hooks/useProvider.ts
export function useProvider(id: string) {
  return useQuery({
    queryKey: ['provider', id],
    queryFn: () => providerService.getById(id),
  });
}
```

**37 hooks** covering: auth, chat, search, geolocation, notifications, analytics, monetization, feature flags, etc.

### Service Layer

Services in `services/` wrap Axios calls. All use the shared client from `utils/axios.ts`:

```typescript
// services/provider.service.ts
import apiClient from '../utils/axios';

export const getProvider = (id) => apiClient.get(`/providers/${id}`);
```

The Axios client handles:
- JWT token attachment from `localStorage`
- Token expiry detection (proactive removal)
- 401 → triggers auth gate (redirect to login)
- 403 with `ACCOUNT_PAUSED` → shows paused modal
- 400 from content sanitizer → inappropriate content toast

### State Management

- **Redux Toolkit** (5 slices): `auth`, `location`, `chat`, `search`, `notification`
- **React Query** for server state (all API data)
- Redux handles client-only state (current location, auth status, unread counts)

### Internationalization (i18n)

- **`next-intl`** library with 10 languages
- Translation files in `messages/` (en, hi, ar, ur, gu, mr, ta, te, bn, fr)
- Config in `i18n/request.ts` + `i18n/config.ts`

```typescript
// Usage in components
import { useTranslations } from 'next-intl';
const t = useTranslations('HomePage');
return <h1>{t('title')}</h1>;
```

### Authentication

- **Supabase Auth** for Google OAuth (client-side)
- **Phone OTP** via MSG91 (backend-mediated)
- Token stored in `localStorage`, managed by `authSlice`
- `useAuthGate` hook protects authenticated routes

---

## Mobile Builds (Capacitor)

The app exports as static HTML (`output: "export"` in next.config.ts) and wraps it in native shells via Capacitor.

### Commands

```bash
npm run cap:build       # Build Next.js + sync to native
npm run cap:open        # Open Android project in Android Studio
npm run cap:open:ios    # Open iOS project in Xcode
npm run cap:run         # Build + run on connected Android device
npm run cap:run:ios     # Build + run on connected iOS device
npm run cap:sync        # Sync web assets to native (without rebuild)
```

### Native Capabilities

- **Push Notifications** — Firebase Cloud Messaging (via `@capacitor/push-notifications`)
- **Geolocation** — Native GPS (via `@capacitor/geolocation`)
- **Deep Links** — `useDeepLinks` hook handles app URL schemes

### Config

- `capacitor.config.ts` — App ID: `com.tijarah.app`, web dir: `out`
- Android project: `android/`
- iOS project: `ios/`

See [MOBILE_INSTALLATION_GUIDE.md](MOBILE_INSTALLATION_GUIDE.md) for detailed native setup.

---

## Adding a New Page

1. Create folder: `app/my-page/page.tsx`
2. Create service (if needed): `services/my-feature.service.ts`
3. Create hook (if needed): `hooks/useMyFeature.ts`
4. Add navigation link in the appropriate component

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Next.js dev server with HMR |
| `npm run build` | Production build (static export) |
| `npm run start` | Serve production build |
| `npm run lint` | Run ESLint |
| `npm run cap:build` | Build + sync to native |
| `npm run cap:open` | Open in Android Studio |
| `npm run cap:run` | Run on connected device |

---

## Useful Links

- [ENV_REFERENCE.md](../ENV_REFERENCE.md) — environment variables
- [MOBILE_INSTALLATION_GUIDE.md](MOBILE_INSTALLATION_GUIDE.md) — Android/iOS setup
- [PERMISSIONS_GUIDE.md](PERMISSIONS_GUIDE.md) — native permission handling
- [PWA_SETUP.md](PWA_SETUP.md) — Progressive Web App configuration
- [documentation/UI_DESIGN_SPEC.md](../documentation/UI_DESIGN_SPEC.md) — design system
