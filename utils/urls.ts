export const AUTH_URLS = {
  SEND_OTP: "/auth/send-otp",
  VERIFY_OTP: "/auth/verify-otp",
  REGISTER: "/users/me",
  GOOGLE_SIGNIN: "/auth/google/signin",
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
  BECOME_PROVIDER: "/providers/become-provider",
  MY_STATUS: "/providers/my-status",
  SEND_OTP: "/providers/send-otp",
  VERIFY_OTP: "/providers/verify-otp",
};
