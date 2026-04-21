export const AUTH_URLS = {
  SEND_OTP: "/auth/send-otp",
  VERIFY_OTP: "/auth/verify-otp",
  REGISTER: "/users/me",
  GOOGLE_SIGNIN: "/auth/google/signin",
  REGISTER_SEND_OTP: "/auth/register/send-otp",
};

export const USER_URLS = {
  ME: "/users/me",
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
};

export const LISTING_URLS = {
  LIST: "/listings",
  CREATE: "/listings",
  BY_ID: (id: string) => `/listings/${id}`,
  UPDATE: (id: string) => `/listings/${id}`,
  DELETE: (id: string) => `/listings/${id}`,
  MY_LISTINGS: "/users/me/listings",
};

export const PHOTO_URLS = {
  UPLOAD_LISTING: (listingId: string) => `/photos/listing/${listingId}`,
  DELETE_LISTING: (photoId: string) => `/photos/listing/${photoId}`,
  REORDER_LISTING: (listingId: string) => `/photos/listing/${listingId}/reorder`,
};

export const REVIEW_URLS = {
  BY_LISTING: (listingId: string) => `/listings/${listingId}`,
};

export const PRODUCT_URLS = {
  BY_ID: (id: string) => `/products/${id}`,
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

export const SAVED_ITEM_URLS = {
  TOGGLE: '/saved-items/toggle',
  LIST: '/saved-items',
  IDS: '/saved-items/ids',
  CHECK: (itemId: string, itemType: string) => `/saved-items/check/${itemId}/${itemType}`,
};
