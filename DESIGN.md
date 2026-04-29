# Tijarah Frontend - Design & Architecture Document

## Overview

**Tijarah** is a community-driven mobile-first marketplace connecting customers with trusted local service providers. The application supports dual user modes (customer and provider), real-time messaging, provider analytics, and multilingual support across 10 languages.

**App Icon:**
![Tijarah Logo](./public/icons/16.png)

- **Name:** Tijarah
- **Type:** Progressive Web App (PWA) + Responsive Web
- **Framework:** Next.js 16.2.2 with React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **State Management:** Redux Toolkit
- **UI Components:** Konsta (iOS/Android-like components)

---

## Architecture Overview

### Technology Stack

| Layer                    | Technology                               |
| ------------------------ | ---------------------------------------- |
| **Framework**            | Next.js 16.2.2 (App Router)              |
| **UI Library**           | React 19.2.4                             |
| **Styling**              | Tailwind CSS 4.2.2                       |
| **Component Library**    | Konsta 5.0.8 (iOS/Android-style UI)      |
| **State Management**     | Redux Toolkit 2.11.2 + React Redux 9.2.0 |
| **Data Fetching**        | TanStack React Query 5.99.1              |
| **HTTP Client**          | Axios 1.15.0                             |
| **Database/Auth**        | Supabase 2.104.0                         |
| **Authentication**       | Google OAuth (@react-oauth/google)       |
| **Maps**                 | Google Maps API (@react-google-maps/api) |
| **Animations**           | Framer Motion 12.38.0                    |
| **Forms**                | Formik 2.4.9 + Yup 1.7.1                 |
| **Internationalization** | next-intl 4.9.1                          |
| **Push Notifications**   | Firebase 12.12.1                         |
| **Analytics**            | PostHog 1.372.1                          |
| **Icons**                | Ionic Icons + Framework7 Icons           |
| **Charts**               | Recharts 3.8.1                           |
| **Content Moderation**   | leo-profanity 1.9.0                      |

---

## Project Structure

```
frontend-test/
├── app/                              # Next.js App Router pages
│   ├── page.tsx                      # Main dashboard (home, explore, saved, etc.)
│   ├── layout.tsx                    # Root layout with providers
│   ├── layoutWrapper.tsx             # Client-side provider wrapper
│   ├── globals.css                   # Global styles
│   ├── loading.tsx                   # Loading skeleton
│   ├── auth/                         # Authentication flows
│   │   ├── login/
│   │   └── create-account/
│   ├── all-services/                 # Browse all services
│   ├── add-location/                 # Add business location
│   ├── gallery/                      # Photo gallery view
│   ├── invite/                       # Referral/invite system
│   ├── product-details/              # Product/service detail page
│   ├── provider-details/             # Provider/business detail page
│   ├── provider-onboarding/          # Provider signup flow
│   ├── providers/                    # Provider directory listing
│   ├── search/                       # Search results
│   ├── service-providers/            # Service provider filters
│   └── components/                   # Reusable components
│       ├── all-services-content.tsx
│       ├── analytics-content.tsx
│       ├── bottom-bar.tsx            # Main navigation
│       ├── explore-content.tsx
│       ├── profile-content.tsx
│       ├── messages-content.tsx
│       ├── saved-content.tsx
│       ├── user-home.tsx
│       ├── provider/
│       │   ├── provider-dashboard.tsx
│       │   ├── provider-listings-manager.tsx
│       │   ├── provider-messages-content.tsx
│       │   └── provider-suspended-overlay.tsx
│       ├── explore/                  # Explore feature components
│       ├── home/                     # Home feed components
│       ├── geo-location/             # Location-based components
│       ├── notification-center/      # Notification UI
│       ├── search/                   # Search UI components
│       └── [other-components]
├── hooks/                            # Custom React hooks (25+ hooks)
│   ├── useAppStore.ts               # Redux store access
│   ├── useAuth.ts                   # Authentication logic
│   ├── useChat.ts                   # Real-time chat
│   ├── useChatSubscription.ts       # Chat subscriptions
│   ├── useUser.ts                   # User data
│   ├── useProvider.ts               # Provider data
│   ├── useProduct.ts                # Product data
│   ├── useSearch.ts                 # Search functionality
│   ├── useExplore.ts                # Explore feed
│   ├── useHomeFeed.ts               # Home feed
│   ├── useSavedItems.ts             # Saved favorites
│   ├── useNotifications.ts          # Push notifications
│   ├── usePushNotifications.ts      # Firebase push setup
│   ├── useAnalyticsTrack.ts         # Event tracking
│   ├── usePostHogIdentify.ts        # Analytics identification
│   ├── useCreateAccount.ts          # Account creation flow
│   ├── useDeviceDetection.ts        # Device type detection
│   ├── useAreaSearch.ts             # Geographic search
│   ├── useDebounce.ts               # Debounce utility
│   ├── usePhotos.ts                 # Photo management
│   ├── useGeocode.ts                # Geocoding
│   ├── useCategories.ts             # Service categories
│   ├── useMyProvider.ts             # Provider dashboard
│   ├── useProviderAnalytics.ts      # Provider analytics
│   ├── useSavedLocation.ts          # Saved locations
│   └── useServiceWorker.ts          # PWA service worker
├── services/                         # API service layer (18 services)
│   ├── axios.ts                     # Axios instance with interceptors
│   ├── auth.service.ts              # Authentication API
│   ├── user.service.ts              # User management
│   ├── provider.service.ts          # Provider management
│   ├── product.service.ts           # Product/service listings
│   ├── chat.service.ts              # Real-time messaging
│   ├── search.service.ts            # Search API
│   ├── explore.service.ts           # Explore feed API
│   ├── home.service.ts              # Home feed API
│   ├── saved-item.service.ts        # Saved items
│   ├── saved-location.service.ts    # Saved locations
│   ├── category.service.ts          # Service categories
│   ├── photo.service.ts             # Photo uploads (Supabase)
│   ├── notification.service.ts      # Push notification API
│   ├── analytics.service.ts         # Analytics events
│   ├── invite.service.ts            # Referral system
│   ├── geocode.service.ts           # Address geocoding
│   ├── bug-report.service.ts        # Bug reporting
│   └── report.service.ts            # Issue reporting
├── store/                            # Redux state management
│   ├── index.ts                     # Store configuration
│   └── slices/
│       ├── authSlice.ts             # Auth state
│       ├── locationSlice.ts         # Location state
│       ├── chatSlice.ts             # Chat state
│       ├── searchSlice.ts           # Search state
│       └── notificationSlice.ts     # Notification state
├── context/                          # React Context API
│   ├── AppContext.tsx               # Global app state
│   ├── LanguageContext.tsx          # i18n state
│   ├── NotificationContext.tsx      # Toast/notification UI
│   ├── ThemeContext.tsx             # Dark/light mode
│   └── [other-contexts]
├── utils/                            # Utility functions
│   ├── axios.ts                     # Axios configuration & interceptors
│   ├── urls.ts                      # API endpoints
│   ├── contants.ts                  # App constants
│   ├── deviceDetection.ts           # Platform detection
│   ├── firebase.ts                  # Firebase config
│   ├── firebase-messaging.ts        # Push notification setup
│   ├── supabase.ts                  # Supabase client
│   ├── analytics-collector.ts       # Analytics utilities
│   ├── content-sanitizer.ts         # Content moderation
│   ├── deep-link.ts                 # Deep linking
│   ├── sharing.ts                   # Share functionality
│   └── [other-utilities]
├── i18n/                             # Internationalization
│   ├── config.ts                    # Locale configuration (10 languages)
│   ├── request.ts                   # i18n middleware
│   └── messages/                    # Translation files
│       ├── en.json
│       ├── hi.json
│       ├── ar.json
│       ├── fr.json
│       ├── ur.json
│       ├── mr.json
│       ├── bn.json
│       ├── ta.json
│       ├── te.json
│       └── gu.json
├── public/                           # Static assets
│   ├── icons/                       # App icons (multiple sizes)
│   ├── manifest.json                # PWA manifest
│   └── sw.js                        # Service worker
├── .github/
│   └── workflows/
│       └── deploy.yml               # CI/CD deployment config
├── tsconfig.json                    # TypeScript config
├── next.config.ts                   # Next.js config
├── tailwind.config.js               # Tailwind CSS config
├── postcss.config.mjs               # PostCSS config
├── eslint.config.mjs                # ESLint config
├── package.json                     # Dependencies
├── README.md                        # Quick start guide
├── DESIGN.md                        # This file
├── MOBILE_INSTALLATION_GUIDE.md     # Mobile setup
├── PWA_SETUP.md                     # PWA configuration
├── PWA_TROUBLESHOOTING.md           # PWA debugging
├── PERMISSIONS_GUIDE.md             # Permission docs
├── AGENTS.md                        # Agent customization
└── CLAUDE.md                        # AI assistant notes
```

---

## Core Features

### 1. Dual User Mode System

- **Customer Mode:** Browse services, search providers, place orders, messaging, save favorites
- **Provider Mode:** Create/manage business listings, view analytics, customer messaging, reviews

### 2. Authentication & Authorization

- Google OAuth integration
- Email/password signup
- Session persistence with Supabase
- OAuth provider management
- Account pause/resume functionality

### 3. Real-Time Messaging

- One-to-one chat between customers and providers
- Real-time message subscriptions (Supabase Real-time)
- Unread message counter
- Message persistence
- Profanity filtering (leo-profanity)

### 4. Service Discovery

- **Browse Services:** View all available services with filters
- **Search:** Full-text search with location-based filtering
- **Explore Feed:** AI-curated discovery feed
- **Provider Directory:** Browse providers by category/location
- **Saved Favorites:** Bookmark providers and products

### 5. Provider Dashboard

- **Business Management:**
  - Create/edit/manage service listings
  - Multi-location support
  - Photo galleries
  - Service pricing and availability
- **Analytics Dashboard:**
  - View impressions, clicks, conversions
  - Sales metrics (Recharts visualizations)
  - Customer engagement tracking
  - Performance insights

- **Message Center:**
  - Manage conversations with customers
  - Message search and filtering
  - Notification badges

### 6. Geolocation & Mapping

- Google Maps integration
- Location-based search radius
- Store locator
- Address geocoding
- GPS-based provider discovery

### 7. Content Management

- Photo uploads to Supabase Storage
- Product image galleries
- Multi-image support for listings
- Image optimization

### 8. Notifications

- **Push Notifications:** Firebase Cloud Messaging
- **Web Notifications:** Browser push support
- **In-App Toasts:** Custom notification UI
- **Notification Center:** Centralized notification history
- Badge counters for unread items

### 9. Internationalization (i18n)

- **Supported Languages:** English, Hindi, Marathi, Gujarati, Bengali, Tamil, Telugu, Urdu, Arabic, French
- **RTL Support:** Automatic right-to-left layout for Arabic and Urdu
- **Language Switching:** In-app language selector
- **Content Localization:** All text strings translated

### 10. Progressive Web App (PWA)

- Service Worker for offline support
- App-like experience on mobile
- Installable as home screen app
- Background sync
- Push notifications
- Splash screens for iOS

### 11. Analytics & Tracking

- PostHog integration for event tracking
- Custom event collection
- User identification and segmentation
- Conversion funnel tracking
- Session tracking

### 12. Content Moderation

- Profanity detection and filtering
- User report system
- Bug reporting feature
- Content sanitization utilities

---

## Component Architecture

### Component Hierarchy

```
App (page.tsx)
├── LayoutWrapper
│   ├── QueryClientProvider
│   ├── ReduxProvider
│   ├── AppProvider
│   ├── LanguageProvider
│   ├── ThemeProvider
│   ├── NotificationProvider
│   └── MainLayout
│       ├── Navigation (BottomBar)
│       └── Page Content (Dynamic)
│           ├── UserHome (Customer Feed)
│           ├── ProviderDashboard (Provider Mode)
│           ├── ExploreContent
│           ├── SearchResults
│           ├── MessagesContent (Chat UI)
│           ├── SavedContent
│           ├── ProfileContent
│           └── AnalyticsContent
```

### Component Categories

#### Layout Components

- **BottomBar:** Main navigation with tab switching
- **Layout:** Root wrapper with header, footer
- **Page:** Konsta page wrapper for mobile-like styling

#### Page Components

- **UserHome:** Customer home feed with services/providers
- **ProviderDashboard:** Provider analytics and overview
- **ProviderListingsManager:** Manage service listings
- **ExploreContent:** Discovery/recommendation feed
- **MessagesContent:** Chat/message interface
- **ProfileContent:** User profile and settings
- **SavedContent:** Bookmarked items
- **AnalyticsContent:** Provider dashboard analytics

#### Business Feature Components

- **ProviderListItem:** Provider card with reviews/ratings
- **ServiceList:** Service listing in grid/list
- **ChatBubbleList:** Message conversation UI
- **PhotoGallery:** Image gallery viewer
- **FilterChips:** Filter/tag selection UI
- **FilterSheet:** Advanced filters modal
- **TimePickerComponent:** Availability scheduling

#### Dynamic/Feature Modules

- **GeoLocation:** Map and location picker
- **NotificationCenter:** Notification history
- **ProviderMessagesContent:** Provider chat interface
- **ProviderSuspendedOverlay:** Account suspension UI

#### UI Primitives & Utilities

- **AppNotification:** System notification display
- **AppDialog:** Modal dialog wrapper
- **AppToast:** Toast notification UI
- **EmptyState:** No data state display
- **InfiniteScroll:** Pagination component
- **FormikInput:** Custom form input with Formik
- **SectionHeader:** Section title component
- **LanguageSelector:** i18n language switcher

---

## State Management

### Redux Store Structure

```typescript
store {
  auth: {
    user: User | null
    profile: UserProfile | null
    hasSkippedAuth: boolean
    isProviderMode: boolean
    providerStatus: 'active'|'paused'|'suspended'
    isLoading: boolean
  },
  location: {
    currentLocation: { lat: number, lng: number } | null
    searchRadius: number
    selectedRegion: Region | null
  },
  chat: {
    conversations: Conversation[]
    activeChat: ChatMessage[]
    unreadCount: number
    providerUnreadCount: number
    pendingChatOpen: string | null
  },
  search: {
    query: string
    filters: SearchFilters
    results: Provider[]
    isSearching: boolean
  },
  notification: {
    unreadCount: number
    notifications: Notification[]
    hasPermission: boolean
  }
}
```

### Context API Usage

| Context                 | Purpose                                                         |
| ----------------------- | --------------------------------------------------------------- |
| **AppContext**          | Global user mode (customer/provider), provider status, location |
| **LanguageContext**     | Current language locale, RTL mode, language switching           |
| **NotificationContext** | Toast/notification queue, show/hide notifications               |
| **ThemeContext**        | Dark/light mode theme state                                     |
| **AuthContext**         | Authentication state and methods                                |

---

## Data Flow Architecture

### Authentication Flow

```
Login Page → Google OAuth / Email-Password
    ↓
auth.service.login()
    ↓
Store JWT in authSlice
    ↓
Redirect to Dashboard (page.tsx)
    ↓
useAuth() fetches profile
    ↓
App Context updated with user mode
```

### Message Flow (Real-Time)

```
User sends message
    ↓
chat.service.sendMessage()
    ↓
- Store in chatSlice locally
- Show optimistic UI
    ↓
Supabase Real-time subscription receives confirmation
    ↓
chatSlice syncs final state
    ↓
UI updates
```

### Data Fetching Pattern

```
Component Mount
    ↓
useCustomHook() (useChatSubscription, useExplore, etc.)
    ↓
Calls useQuery() from React Query
    ↓
- Background sync
- Caching
- Deduplication
    ↓
Data returned to component
```

---

## Service Layer

### API Integration Pattern

All services use a centralized Axios instance with interceptors:

```typescript
// services/axios.ts
- JWT token injection
- Error handling & auth refresh
- Account pause detection
- Content moderation
- Response transformation
```

### Service Categories

#### Authentication

- `auth.service.ts` - Login, signup, logout, OAuth

#### User Management

- `user.service.ts` - Profile, preferences, account settings
- `provider.service.ts` - Provider profile, verification, status
- `category.service.ts` - Service categories and tags

#### Content Management

- `product.service.ts` - Service/product listings
- `photo.service.ts` - Image uploads to Supabase Storage
- `saved-item.service.ts` - Bookmarked services
- `saved-location.service.ts` - Saved locations

#### Discovery & Search

- `search.service.ts` - Full-text search
- `explore.service.ts` - Discovery feed
- `home.service.ts` - Home feed (mix of categories, saved, featured)
- `geocode.service.ts` - Address geocoding

#### Communication

- `chat.service.ts` - Messaging API
- `notification.service.ts` - Push notification registration
- `invite.service.ts` - Referral and invite system

#### Analytics & Insights

- `analytics.service.ts` - Event tracking to PostHog
- `report.service.ts` - Issue/content reporting
- `bug-report.service.ts` - Bug report submission

---

## Custom Hooks Library

### Authentication & User Hooks

| Hook                 | Purpose                                              |
| -------------------- | ---------------------------------------------------- |
| `useAuth()`          | Access current auth state, login/logout              |
| `useUser()`          | Fetch and sync current user profile                  |
| `useCreateAccount()` | Account creation flow with validation                |
| `useAppStore()`      | Access Redux store (useSelector/useDispatch wrapper) |

### Feature Hooks

| Hook                    | Purpose                                  |
| ----------------------- | ---------------------------------------- |
| `useChat()`             | Send messages, manage conversations      |
| `useChatSubscription()` | Real-time chat subscriptions/heartbeat   |
| `useProvider()`         | Fetch provider details and listings      |
| `useProduct()`          | Fetch individual product/service details |
| `useMyProvider()`       | Provider's own dashboard data            |
| `useSearch()`           | Execute search with filters              |
| `useExplore()`          | Load discovery feed                      |
| `useHomeFeed()`         | Load personalized home feed              |

### Discovery & Saved Hooks

| Hook                 | Purpose                              |
| -------------------- | ------------------------------------ |
| `useSavedItems()`    | Manage bookmarked providers/products |
| `useSavedLocation()` | Manage saved search locations        |
| `useAreaSearch()`    | Search by geographic area            |
| `useCategories()`    | Load service categories              |
| `useGeocode()`       | Convert addresses to lat/lng         |

### Utility Hooks

| Hook                     | Purpose                                  |
| ------------------------ | ---------------------------------------- |
| `useNotifications()`     | Polling for notification updates         |
| `usePushNotifications()` | Firebase push setup and listener         |
| `useAnalyticsTrack()`    | Track events to PostHog                  |
| `usePostHogIdentify()`   | Identify user in analytics               |
| `useDeviceDetection()`   | Detect device type (mobile, tablet, web) |
| `useDebounce()`          | Debounce hook for search inputs          |
| `usePhotos()`            | Photo upload and management              |
| `useServiceWorker()`     | PWA service worker setup                 |
| `useProviderAnalytics()` | Provider dashboard analytics data        |

---

## UI/UX Design System

### Component Library: Konsta

Konsta provides iOS and Android-native looking components:

- Page, Navbar, Toolbar (bottom navigation)
- Cards, Lists, Grid layouts
- Buttons, Inputs, Selects
- Modals, Popups, Sheets
- Segmented controls
- Tabs and Tab swipe navigation

### Spacing & Typography

- **Base Font:** Open Sans (300, 400, 500, 600, 700, 800 weights)
- **Font Sizes:** Responsive (Tailwind scale)
- **Spacing:** Tailwind grid system

### Color System

- **Primary Brand:** Amber (#F59E0B) - Meta Tag Color
- **Accent Colors:** Tailwind default palette
- **Dark Mode:** Theme context support

### Layout Breakpoints

- Mobile: < 640px (primary target)
- Tablet: 640px - 1024px
- Desktop: > 1024px (responsive fallback)

### Animations

- **Framer Motion:** Used for:
  - Page transitions
  - Modal animations
  - Loading states
  - Tab switching animations

### Responsive Design

- Mobile-first approach
- Bottom navigation for easy thumb reach
- Full-screen modals on mobile
- Sheet-based filters and actions

---

## Key User Flows

### Customer Discovery Flow

```
User Opens App (Home Tab)
    ↓
Load Home Feed (useHomeFeed)
    ├─ Featured Categories
    ├─ Saved Providers
    └─ Search Recommendations
    ↓
User Browses (All Services Tab)
    ↓
Apply Filters (location, category, price, rating)
    ↓
View Provider Details
    ↓
Contact Provider (Chat)
    ↓
Save Provider (Saved Tab)
```

### Provider Onboarding Flow

```
Sign Up
    ↓
Enter Business Info
    ↓
Add Business Addresses/Locations
    ↓
Create Service Listings
    ↓
Add Photos/Gallery
    ↓
Set Pricing & Availability
    ↓
Complete Verification
    ↓
Go Live
    ↓
Access Provider Dashboard
```

### Messaging Flow

```
User 1 Opens Chat
    ↓
Select Conversation / Start New
    ↓
User 2 Receives Unread Badge
    ↓
Both connect via Real-time Subscription
    ↓
Messages synced in real-time
    ↓
Notifications for unread messages
    ↓
Archive/Delete for cleanup
```

### Provider Analytics Flow

```
Provider Opens Dashboard (My Business Tab)
    ↓
View Key Metrics:
    ├─ Impressions
    ├─ Clicks/CTR
    ├─ Conversions
    ├─ Revenue
    └─ Customer Reviews
    ↓
View Charts (Recharts visualizations)
    ↓
Drill into Listings Section
    ↓
Edit Listings or View Performance
```

---

## Performance & Optimization

### Data Fetching Strategy

- **React Query Caching:** Automatic deduplication, background sync
- **Lazy Loading:** Code splitting via Next.js dynamic imports
- **Image Optimization:** Next.js Image component with Supabase CDN
- **Infinite Scrolling:** Pagination for feeds (useCursorPagination)

### Bundle Optimization

- TypeScript strict mode enabled
- Dynamic imports for routes
- Tree shaking with ESLint

### Runtime Performance

- Redux for predictable state updates
- Context API for context-specific state
- Memoization for expensive computations
- Debouncing on search inputs

### Mobile Performance

- Offline support via Service Worker
- App-like UX with bottom navigation
- Minimal re-renders with React hooks
- Optimistic UI updates

---

## Internationalization (i18n)

### Supported Languages

| Code | Language | Native   | RTL |
| ---- | -------- | -------- | --- |
| en   | English  | English  | No  |
| hi   | Hindi    | हिन्दी   | No  |
| mr   | Marathi  | मराठी    | No  |
| gu   | Gujarati | ગુજરાતી  | No  |
| bn   | Bengali  | বাংলা    | No  |
| ta   | Tamil    | தமிழ்    | No  |
| te   | Telugu   | తెలుగు   | No  |
| ur   | Urdu     | اردو     | Yes |
| ar   | Arabic   | العربية  | Yes |
| fr   | French   | Français | No  |

### RTL Implementation

- Automatic layout flip for Arabic/Urdu
- RTL-aware components from Konsta
- Tailwind RTL utilities via `dir` attribute
- Language selector toggles locale

### Translation Files

- Located in `i18n/messages/`
- JSON format with nested keys
- Loaded dynamically via `next-intl`
- Server-side middleware in `i18n/request.ts`

---

## Progressive Web App (PWA)

### Configuration

- **Manifest:** `public/manifest.json`
  - App name, icons, theme colors
  - Display mode: standalone
  - Start URL and orientation

- **Service Worker:** `public/sw.js`
  - Cache strategies for static assets
  - Background sync
  - Push notification handling
  - Offline fallback

### installation & Features

- Add to Home Screen (iOS & Android)
- App splash screens
- Navigation shortcuts
- Share target API (share to app)
- Web app icon in browser

---

## Development Workflow

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
# Runs on http://localhost:3000
```

### Build & Deploy

```bash
npm run build
npm run start
```

### Linting

```bash
npm run lint
```

### Technologies

- **Package Manager:** npm
- **Build Tool:** Next.js with Vite (for frontend components)
- **Type Checking:** TypeScript strict mode
- **Code Quality:** ESLint

---

## File Structure Conventions

### Naming Conventions

- **Components:** PascalCase (`MyComponent.tsx`)
- **Hooks:** camelCase with `use` prefix (`useMyHook.ts`)
- **Services:** camelCase with `.service.ts` suffix
- **Utils:** camelCase with `.ts` extension
- **Contexts:** PascalCase ending with `Context` (`MyContext.tsx`)

### Import Aliases

- `@` → Project root (configured in tsconfig)
- `@/hooks` → Custom hooks
- `@/services` → API services
- `@/store` → Redux state
- `@/utils` → Utility functions

---

## Security Considerations

### Authentication

- JWT tokens stored securely
- Google OAuth for third-party auth
- Session validation on app load
- Token refresh via interceptors

### Data Protection

- Supabase RBAC for database access
- Secure image storage with Supabase Storage
- HTTPS enforced for all API calls
- Content sanitization for user inputs

### User Privacy

- GDPR-compliant data handling
- User consent for notifications/location
- Privacy policy linked in settings
- Option to delete account

---

## Deployment & CI/CD

### Deployment

- **Platform:** Vercel (Next.js native)
- **Database:** Supabase (PostgreSQL on Vercel)
- **Storage:** Supabase Storage (Cloud CDN)
- **Analytics:** PostHog (self-hosted or cloud)

### CI/CD Pipeline (`.github/workflows/deploy.yml`)

- Automated deployment on push to main
- Build and test stages
- Environment-specific deployments (staging, production)

### Environment Variables

- `.env` - Local secrets
- `.env.example` - Template for required vars
- Vercel environment settings for production

---

## Documentation Files Reference

- **README.md** - Quick start and basic setup
- **MOBILE_INSTALLATION_GUIDE.md** - Mobile app installation
- **PWA_SETUP.md** - Progressive Web App configuration
- **PWA_TROUBLESHOOTING.md** - PWA debugging guide
- **PERMISSIONS_GUIDE.md** - App permissions and browser requirements
- **AGENTS.md** - Agent customization (AI instructions)
- **CLAUDE.md** - AI assistant context notes

---

## Future Enhancements

### Planned Features

- Video chat integration
- Payment processing (Stripe/PayPal)
- Advanced analytics dashboards
- AI-powered recommendations
- Service provider verification badge system
- Subscription plans

### Performance Roadmap

- Service Worker offline mode enhancement
- GraphQL API integration
- WebSocket for real-time updates
- CDN edge caching

### Internationalization

- Additional language support
- Regional currency formatting
- Timezone awareness
- Local payment methods

---

## Contributing Guidelines

### Code Style

- Follow ESLint configuration
- Use TypeScript types (no `any`)
- Write meaningful component names
- Comment complex logic

### Testing

- Unit tests for services
- Component tests for UI components
- E2E tests for critical flows
- Test coverage > 80%

### Git Workflow

- Feature branches from `main`
- Pull requests with descriptions
- Code review before merge
- Semantic commit messages

---

## Troubleshooting

### Common Issues

**App not loading:**

- Check network connectivity
- Verify API endpoints in `.env`
- Clear browser cache and service worker

**Push notifications not working:**

- Verify Firebase credentials
- Check notification permissions
- Review `PWA_TROUBLESHOOTING.md`

**Translation not updating:**

- Clear i18n cache
- Rebuild with `npm run build`
- Check `i18n/messages/` files

**Redux state not syncing:**

- Check Redux DevTools for actions
- Enable ReduxLogger middleware
- Verify action dispatches

---

## Contact & Support

For issues or questions about this design:

- Check AGENTS.md for AI assistant context
- Review pull request history for decisions
- Consult CLAUDE.md for detailed notes

---

**Last Updated:** April 26, 2026
**Version:** 1.0
**Maintained By:** Development Team
