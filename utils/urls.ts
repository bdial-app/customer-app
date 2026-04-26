export const AUTH_URLS = {
  SEND_OTP: "/auth/send-otp",
  VERIFY_OTP: "/auth/verify-otp",
  REGISTER: "/users/me",
  GOOGLE_SIGNIN: "/auth/google/signin",
  REGISTER_SEND_OTP: "/auth/register/send-otp",
};

export const USER_URLS = {
  ME: "/users/me",
  DELETE_ME: "/users/me",
  PAUSE_ME: "/users/me/pause",
  RESUME_ME: "/users/me/resume",
  DATA_EXPORT: "/users/me/data-export",
};

export const CATEGORY_URLS = {
  LIST: "/categories",
  TOP_LEVEL: "/categories/top-level",
  BY_ID: (id: string) => `/categories/${id}`,
  SUB_CATEGORIES: (id: string) => `/categories/${id}/sub-categories`,
};

export const GEOCODE_URLS = {
  REVERSE: "/geocode/reverse",
  SEARCH: "/geocode/search",
};

export const SAVED_LOCATION_URLS = {
  LIST: "/saved-locations",
  CREATE: "/saved-locations",
};

export const PROVIDER_URLS = {
  NEARBY: "/providers/nearby",
  FEATURED: "/providers/featured",
  BY_ID: (id: string) => `/providers/${id}`,
  DETAILS: (id: string) => `/providers/${id}/details`,
  UPDATE: (id: string) => `/providers/${id}`,
  BECOME_PROVIDER: "/providers/become-provider",
  MY_STATUS: "/providers/my-status",
  SEND_OTP: "/providers/send-otp",
  VERIFY_OTP: "/providers/verify-otp",
  SUBMIT_VERIFICATION: "/providers/submit-verification",
  MY_ANALYTICS: "/providers/my-analytics",
  MY_OFFERS: "/providers/my-offers",
  OFFER_LIMITS: "/providers/my-offers/limits",
  UPDATE_OFFER: (offerId: string) => `/providers/my-offers/${offerId}`,
  DELETE_OFFER: (offerId: string) => `/providers/my-offers/${offerId}`,
  SPONSORSHIP_PLANS: "/providers/sponsorship-plans",
  MY_SPONSORSHIPS: "/providers/my-sponsorships",
  UPDATE_SPONSORSHIP: (id: string) => `/providers/my-sponsorships/${id}`,
  DISABLE_PROVIDER: "/providers/my-provider/disable",
  ENABLE_PROVIDER: "/providers/my-provider/enable",
  DELETE_PROVIDER: "/providers/my-provider",
};

export const PHOTO_URLS = {
  UPLOAD_PROVIDER: (providerId: string) => `/photos/provider/${providerId}`,
  DELETE_PROVIDER: (photoId: string) => `/photos/provider/${photoId}`,
  REORDER_PROVIDER: (providerId: string) => `/photos/provider/${providerId}/reorder`,
};

export const REVIEW_URLS = {
  BY_PROVIDER: (providerId: string) => `/reviews/provider/${providerId}`,
  REPLY: (reviewId: string) => `/reviews/${reviewId}/reply`,
  CREATE: "/reviews",
  REPORT: (reviewId: string) => `/reviews/${reviewId}/report`,
};

export const PRODUCT_URLS = {
  BY_ID: (id: string) => `/products/${id}`,
  CREATE: "/products",
  UPDATE: (id: string) => `/products/${id}`,
  DELETE: (id: string) => `/products/${id}`,
  UPLOAD_IMAGE: "/products/upload-image",
};

export const HOME_URLS = {
  FEED: '/home/feed',
  BANNERS: '/home/banners',
  TRENDING: '/home/trending',
  REVIEWS: '/home/reviews',
  STATS: '/home/stats',
  LIVE_ACTIVITY: '/home/live-activity',
  CATEGORY_PROVIDERS: '/home/category-providers',
};

export const EXPLORE_URLS = {
  FEED: '/explore/feed',
  TRACK: '/explore/track',
};

export const INVITE_URLS = {
  TRACK: '/invite/track',
  COUNT: '/invite/count',
};

export const SAVED_ITEM_URLS = {
  TOGGLE: '/saved-items/toggle',
  LIST: '/saved-items',
  IDS: '/saved-items/ids',
  CHECK: (itemId: string, itemType: string) => `/saved-items/check/${itemId}/${itemType}`,
};

export const CHAT_URLS = {
  CONVERSATIONS: '/chat/conversations',
  CONVERSATION: (id: string) => `/chat/conversations/${id}`,
  MESSAGES: (id: string) => `/chat/conversations/${id}/messages`,
  MARK_READ: (id: string) => `/chat/conversations/${id}/read`,
  ARCHIVE: (id: string) => `/chat/conversations/${id}/archive`,
  UPLOAD_MEDIA: (id: string) => `/chat/conversations/${id}/media`,
  TYPING: (id: string) => `/chat/conversations/${id}/typing`,
  UNREAD_COUNT: '/chat/unread-count',
  HEARTBEAT: '/chat/heartbeat',
  PRESENCE: (userId: string) => `/chat/presence/${userId}`,
};

export const ANALYTICS_URLS = {
  EVENTS: '/analytics/events',
  SUMMARY: '/analytics/summary',
  LEADS: '/analytics/leads',
  LEAD_DETAIL: (id: string) => `/analytics/leads/${id}`,
  UNLOCK_LEAD: (id: string) => `/analytics/leads/${id}/unlock`,
  TOP_PRODUCTS: '/analytics/top-products',
  PEAK_HOURS: '/analytics/peak-hours',
};

export const NOTIFICATION_URLS = {
  LIST: '/notifications',
  UNREAD_COUNT: '/notifications/unread-count',
  MARK_READ: (id: string) => `/notifications/${id}/read`,
  MARK_ALL_READ: '/notifications/read-all',
  DELETE: (id: string) => `/notifications/${id}`,
  PREFERENCES: '/notifications/preferences',
  REGISTER_DEVICE: '/notifications/devices',
  UNREGISTER_DEVICE: '/notifications/devices',
};

export const BUG_REPORT_URLS = {
  CREATE: '/bug-reports',
};
