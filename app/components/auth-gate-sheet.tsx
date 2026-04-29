"use client";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useField, Formik, Form, useFormikContext } from "formik";
import * as Yup from "yup";
import { useSendOtp, useRegistrationSendOtp, useCreateAccountMutation } from "@/hooks/useAuth";
import { verifyOtp as verifyOtpDirect, googleSignIn as googleSignInDirect } from "@/services/auth.service";
import { useAppDispatch } from "@/hooks/useAppStore";
import { setToken, setProfile } from "@/store/slices/authSlice";
import { useNotification } from "@/app/context/NotificationContext";
import { useAuthGateContext } from "@/app/context/AuthGateContext";
import { useRouter } from "next/navigation";
import { ROUTE_PATH } from "@/utils/contants";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { GoogleMap, MarkerF } from "@react-google-maps/api";
import { useGoogleMapsLoader } from "@/hooks/useGoogleMaps";
import { IonIcon } from "@ionic/react";
import {
  logoApple, closeOutline, phonePortraitOutline, shieldCheckmarkOutline,
  personOutline, checkmarkCircle, locationOutline, navigateOutline,
  alertCircleOutline, businessOutline, mapOutline, chevronDownOutline, arrowBack,
  searchOutline, expandOutline, contractOutline, storefrontOutline, lockClosedOutline,
} from "ionicons/icons";
import { CITY_NAMES } from "@/app/data/locations";
import { reverseGeocode as reverseGeocodeApi, searchGeocode } from "@/services/geocode.service";
import type { SearchGeocodeResult } from "@/services/geocode.service";

// ─── Constants ──────────────────────────────────────────────────
const MINI_MAP_STYLE = { width: "100%", height: "100%" };

// ─── Types ──────────────────────────────────────────────────────
type Step = "mobile" | "otp" | "register-otp" | "details";

// ─── Validation Schemas ─────────────────────────────────────────
const schemas: Record<Step, Yup.ObjectSchema<any>> = {
  mobile: Yup.object({
    mobile: Yup.string().matches(/^\d{10}$/, "Enter valid 10 digit number").required("Required"),
  }),
  otp: Yup.object({
    otp: Yup.string().matches(/^\d{6}$/, "Enter 6 digit OTP").required("Required"),
  }),
  "register-otp": Yup.object({
    otp: Yup.string().matches(/^\d{6}$/, "Enter 6 digit OTP").required("Required"),
  }),
  details: Yup.object({
    name: Yup.string().min(3, "At least 3 characters").max(100, "Under 100 characters").required("Full name is required"),
    gender: Yup.string().oneOf(["male", "female", "other"]).required("Gender is required"),
    city: Yup.string(),
    area: Yup.string(),
    pincode: Yup.string().test("pincode", "Must be 6 digits", (v) => !v || /^\d{6}$/.test(v)),
  }),
};

// ─── Spinner ────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5 text-current" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ─── Inline Input (dark themed) ─────────────────────────────────
function InlineInput({
  name, placeholder, prefix, format, autoFocus, type = "tel", inputMode = "numeric",
}: {
  name: string; placeholder: string; prefix?: string;
  format?: (v: string) => string; autoFocus?: boolean;
  type?: string; inputMode?: "numeric" | "text";
}) {
  const [field, meta, helpers] = useField(name);
  const err = meta.touched && meta.error;
  return (
    <div>
      <div className={`flex items-center h-12 rounded-2xl border transition-colors bg-white/[0.06] ${err ? "border-red-400/50" : "border-white/[0.08] focus-within:border-white/[0.15]"}`}>
        {prefix && <span className="pl-4 text-[15px] font-medium select-none text-slate-500">{prefix}</span>}
        <input
          autoFocus={autoFocus} type={type} inputMode={inputMode}
          placeholder={placeholder} value={field.value} onBlur={field.onBlur} name={field.name}
          onChange={(e) => helpers.setValue(format ? format(e.target.value) : e.target.value)}
          className="flex-1 h-full bg-transparent px-3 text-[16px] outline-none text-white placeholder:text-slate-600"
        />
      </div>
      {err && <p className="text-[11px] text-red-400 mt-1 ml-1">{meta.error}</p>}
    </div>
  );
}

// ─── Dark Gender Selector ───────────────────────────────────────
function GenderSelector() {
  const { values, setFieldValue, touched, errors } = useFormikContext<any>();
  const genders = [
    { value: "male", label: "Male", emoji: "👨" },
    { value: "female", label: "Female", emoji: "👩" },
    { value: "other", label: "Other", emoji: "🧑" },
  ];
  return (
    <div className="mt-3">
      <label className="block text-[11px] font-semibold text-slate-500 mb-2 uppercase tracking-wider">Gender</label>
      <div className="grid grid-cols-3 gap-2">
        {genders.map((g) => {
          const selected = values.gender === g.value;
          return (
            <button key={g.value} type="button" onClick={() => setFieldValue("gender", g.value)}
              className={`relative flex flex-col items-center gap-1 py-3 rounded-2xl border-2 transition-all active:scale-95 ${
                selected
                  ? "border-amber-400/60 bg-amber-500/10"
                  : "border-white/[0.06] bg-white/[0.03] hover:border-white/[0.12]"
              }`}>
              {selected && (
                <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-500 rounded-full grid place-content-center">
                  <IonIcon icon={checkmarkCircle} className="text-white text-[10px]" />
                </div>
              )}
              <span className="text-xl">{g.emoji}</span>
              <span className={`text-[11px] font-bold ${selected ? "text-amber-400" : "text-slate-400"}`}>{g.label}</span>
            </button>
          );
        })}
      </div>
      {touched.gender && errors.gender && <div className="text-[11px] text-red-400 mt-1">{String(errors.gender)}</div>}
    </div>
  );
}

// ─── Dark City Selector ─────────────────────────────────────────
function CitySelector() {
  const { values, setFieldValue, touched, errors, setFieldTouched } = useFormikContext<any>();
  const [cityOpen, setCityOpen] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const filteredCities = CITY_NAMES.filter((c) => c.toLowerCase().includes(citySearch.toLowerCase()));

  return (
    <div className="mt-3 relative z-10">
      <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">City</label>
      <button type="button" onClick={() => setCityOpen(!cityOpen)}
        className={`w-full flex items-center gap-2 px-3.5 py-3 rounded-xl border-2 transition-all text-left ${
          touched.city && errors.city
            ? "border-red-400/50 bg-white/[0.04]"
            : values.city
              ? "border-amber-400/30 bg-amber-500/[0.06]"
              : "border-white/[0.08] bg-white/[0.04]"
        }`}>
        <IonIcon icon={businessOutline} className="text-slate-500 text-sm flex-shrink-0" />
        <span className={`flex-1 text-[13px] ${values.city ? "text-white font-medium" : "text-slate-500"}`}>{values.city || "Select your city"}</span>
        <IonIcon icon={chevronDownOutline} className={`text-slate-500 text-xs transition-transform ${cityOpen ? "rotate-180" : ""}`} />
      </button>
      {cityOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-slate-800 rounded-xl border border-white/[0.08] shadow-xl z-30 max-h-44 overflow-hidden">
          <div className="p-2 border-b border-white/[0.06]">
            <input type="text" value={citySearch} onChange={(e) => setCitySearch(e.target.value)} placeholder="Search city..."
              className="w-full px-3 py-2 text-[13px] bg-white/[0.06] rounded-lg outline-none placeholder:text-slate-500 text-white" autoFocus />
          </div>
          <div className="overflow-y-auto max-h-32">
            {filteredCities.length > 0 ? filteredCities.map((city) => (
              <button key={city} type="button"
                onClick={() => { setFieldValue("city", city); setFieldTouched("city", true, false); setCityOpen(false); setCitySearch(""); }}
                className={`w-full text-left px-3 py-2.5 text-[13px] transition-colors ${values.city === city ? "bg-amber-500/10 text-amber-400 font-semibold" : "text-slate-300 active:bg-white/[0.06]"}`}>
                {city}
              </button>
            )) : (
              <div className="p-3 text-center">
                <p className="text-[12px] text-slate-400">City not available yet</p>
              </div>
            )}
          </div>
        </div>
      )}
      {touched.city && errors.city && <div className="text-[11px] text-red-400 mt-1">{String(errors.city)}</div>}
    </div>
  );
}

// ─── Main Sheet Content ─────────────────────────────────────────
function AuthGateSheetContent() {
  const router = useRouter();
  const { notify } = useNotification();
  const { closeAuthGate } = useAuthGateContext();
  const [step, setStep] = useState<Step>("mobile");
  const [resendCountdown, setResendCountdown] = useState(0);
  const [geoLocation, setGeoLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<SearchGeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  // Ref to access Formik setFieldValue from outside the render prop
  const setFieldValueRef = useRef<((field: string, value: any) => void) | null>(null);

  const dispatch = useAppDispatch();
  const pendingTokenRef = useRef<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const sendOtp = useSendOtp();
  const regSendOtp = useRegistrationSendOtp();
  const createAccountMutation = useCreateAccountMutation();

  const { isLoaded: isMapLoaded } = useGoogleMapsLoader();

  // Clean up pending registration token if sheet unmounts before completion
  useEffect(() => {
    return () => {
      if (pendingTokenRef.current) {
        localStorage.removeItem("token");
        pendingTokenRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const id = setInterval(() => setResendCountdown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearInterval(id);
  }, [resendCountdown]);

  // Auto-request location when entering details step, then reverse geocode to auto-fill
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setGeoLocation(coords);
        setIsLocating(false);
        notify({ title: "Location Pinned", subtitle: "GPS location captured", variant: "success" });

        // Reverse geocode to auto-populate city, area, pincode
        try {
          const geo = await reverseGeocodeApi(coords);
          const sfv = setFieldValueRef.current;
          if (sfv && geo) {
            if (geo.city) sfv("city", geo.city);
            if (geo.area) sfv("area", geo.area);
            if (geo.pincode) sfv("pincode", geo.pincode);
          }
        } catch {
          // Reverse geocode failed silently — user can fill manually
        }
      },
      () => {
        setIsLocating(false);
        notify({ title: "Location Required", subtitle: "Please enable location access", variant: "warning" });
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [notify]);

  const handleLocationSearch = useCallback((query: string) => {
    setLocationSearch(query);
    setLocationSuggestions([]);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!query.trim()) return;
    searchDebounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchGeocode(query);
        setLocationSuggestions(results);
      } catch {
        // silent
      } finally {
        setIsSearching(false);
      }
    }, 350);
  }, []);

  const handleSelectSuggestion = useCallback(async (result: SearchGeocodeResult) => {
    setLocationSearch(result.description || result.mainText);
    setLocationSuggestions([]);
    const coords = { lat: result.lat, lng: result.lng };
    setGeoLocation(coords);
    mapInstanceRef.current?.panTo(coords);
    mapInstanceRef.current?.setZoom(16);

    const sfv = setFieldValueRef.current;
    // Immediately pre-fill from the suggestion's structured text while we wait for reverse geocode
    if (sfv && result.secondaryText) {
      // secondaryText is typically "Area, City, State" — extract city from it
      const parts = result.secondaryText.split(",").map((s: string) => s.trim());
      if (parts[0]) sfv("area", parts[0]);
      if (parts[1]) sfv("city", parts[1]);
    }

    try {
      const geo = await reverseGeocodeApi(coords);
      const sfv2 = setFieldValueRef.current;
      if (sfv2 && geo) {
        // Prefer reverse-geocode result; it's more accurate for exact coordinates
        if (geo.city) sfv2("city", geo.city);
        if (geo.area) sfv2("area", geo.area);
        else if (result.mainText) sfv2("area", result.mainText); // landmark name as area fallback
        if (geo.pincode) sfv2("pincode", geo.pincode);
      }
    } catch {
      // silent — pre-filled values from suggestion text remain
    }
  }, []);

  useEffect(() => {
    if (step === "details" && !geoLocation) requestLocation();
  }, [step, geoLocation, requestLocation]);

  const busy = sendOtp.isPending || regSendOtp.isPending || isVerifying || createAccountMutation.isPending;

  const isApple = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent);
  }, []);

  // ─── Login / Registration Flow ─────────────────────────────────
  const handleAuthSubmit = async (
    validateForm: () => Promise<Record<string, string>>,
    setTouched: (t: Record<string, boolean>) => void,
    values: any,
    setFieldValue: (f: string, v: any) => void,
  ) => {
    const errors = await validateForm();
    if (Object.keys(errors).length) {
      setTouched(Object.fromEntries(Object.keys(errors).map((k) => [k, true])));
      return;
    }
    try {
      if (step === "mobile") {
        // Try login OTP first
        const res = await sendOtp.mutateAsync({ mobileNumber: values.mobile });
        if (res?.userExists === false) {
          // New user → send registration OTP
          const regRes = await regSendOtp.mutateAsync({ mobileNumber: values.mobile });
          const otp: string | undefined = regRes?.data?.otp;
          notify({ title: "OTP Sent", subtitle: otp ? `Your code: ${otp}` : "Check your messages", variant: "success", duration: 10000 });
          setResendCountdown(60);
          setStep("register-otp");
          return;
        }
        // Existing user → login OTP
        const otp: string | undefined = res?.data?.otp;
        notify({ title: "OTP Sent", subtitle: otp ? `Your code: ${otp}` : "Check your messages", variant: "success", duration: 10000 });
        setResendCountdown(60);
        setStep("otp");
      } else if (step === "otp" || step === "register-otp") {
        // Verify OTP via raw API — do NOT dispatch to Redux yet.
        // The account only becomes "active" after name + gender are provided.
        setIsVerifying(true);
        try {
          const res = await verifyOtpDirect({ mobileNumber: values.mobile, otp: values.otp });
          const jwt = (res as any).accessToken ?? (res as any).token;
          if (res.user?.name) {
            // User already has a complete profile → log them in immediately
            if (jwt) {
              localStorage.setItem("token", jwt);
              dispatch(setToken(jwt));
            }
            dispatch(setProfile(res.user));
            notify({ title: step === "otp" ? "Welcome back" : "Welcome", subtitle: res.user.name, variant: "success" });
          } else {
            // User has no name — hold the token but DON'T put user in Redux.
            // This prevents the app from considering them "logged in".
            if (jwt) {
              pendingTokenRef.current = jwt;
              localStorage.setItem("token", jwt); // needed for the PATCH call
            }
            setStep("details");
          }
        } finally {
          setIsVerifying(false);
        }
      } else if (step === "details") {
        const payload: Record<string, any> = {
          name: values.name,
          gender: values.gender,
        };
        // Location fields are optional — include only if provided
        if (values.city) payload.city = values.city;
        if (values.area) payload.area = values.area;
        if (values.pincode) payload.pincode = values.pincode;
        if (geoLocation) {
          payload.latitude = geoLocation.lat;
          payload.longitude = geoLocation.lng;
        }
        // Ensure the pending token is in localStorage for the PATCH call
        if (pendingTokenRef.current) {
          localStorage.setItem("token", pendingTokenRef.current);
        }
        await createAccountMutation.mutateAsync(payload as any);
        // createAccountMutation.onSuccess dispatches setProfile(user) — user now has a name.
        // Now also dispatch the JWT token to Redux so the user is fully authenticated.
        if (pendingTokenRef.current) {
          dispatch(setToken(pendingTokenRef.current));
          pendingTokenRef.current = null;
        }
        notify({ title: "Welcome!", subtitle: `Account created for ${values.name}`, variant: "success" });
        // AuthGateContext auto-closes because user.name is now set
      }
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.error_code === "OTP_RATE_LIMITED" && data?.retryAfterSeconds) {
        setResendCountdown(data.retryAfterSeconds);
        if (step === "mobile") setStep("otp");
        notify({ title: "OTP already sent", subtitle: `You can resend in ${data.retryAfterSeconds}s`, variant: "warning" });
      } else {
        notify({ title: "Error", subtitle: data?.message ?? "Something went wrong", variant: "error" });
      }
    }
  };

  const handleResendOtp = async (mobile: string, setFieldValue: (f: string, v: any) => void) => {
    try {
      const isRegistration = step === "register-otp";
      const mutation = isRegistration ? regSendOtp : sendOtp;
      const res = await mutation.mutateAsync({ mobileNumber: mobile });
      const code: string | undefined = res?.data?.otp;
      setFieldValue("otp", "");
      setResendCountdown(60);
      notify({ title: "OTP Resent", subtitle: code ? `Your new code: ${code}` : "Check your messages", variant: "success", duration: 10000 });
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.error_code === "OTP_RATE_LIMITED" && data?.retryAfterSeconds) {
        setResendCountdown(data.retryAfterSeconds);
        notify({ title: "Please wait", subtitle: `Resend available in ${data.retryAfterSeconds}s`, variant: "warning" });
      } else {
        notify({ title: "Error", subtitle: data?.message ?? "Failed to resend OTP", variant: "error" });
      }
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tok) => {
      try {
        const r = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tok.access_token}` },
        });
        const info = await r.json();
        setIsVerifying(true);
        const res = await googleSignInDirect({ email: info.email, name: info.name, googleId: info.sub });
        const jwt = (res as any).accessToken ?? (res as any).token;
        if (res.user?.name) {
          if (jwt) {
            localStorage.setItem("token", jwt);
            dispatch(setToken(jwt));
          }
          dispatch(setProfile(res.user));
          notify({ title: "Welcome", subtitle: res.user.name, variant: "success" });
        } else {
          // Google SSO user without profile → hold token, show details
          if (jwt) {
            pendingTokenRef.current = jwt;
            localStorage.setItem("token", jwt);
          }
          setStep("details");
        }
      } catch (err: any) {
        notify({ title: "Google Sign-In failed", subtitle: err?.response?.data?.message ?? "Please try again", variant: "error" });
      } finally {
        setIsVerifying(false);
      }
    },
    onError: () => notify({ title: "Cancelled", subtitle: "Google sign-in was cancelled", variant: "warning" }),
  });

  const handleApple = () =>
    notify({ title: "Coming Soon", subtitle: "Apple Sign-In coming shortly", variant: "info" });

  // ─── Step Headings ──────────────────────────────────────────────
  const headings: Record<Step, { icon: string; iconBg: string; iconColor: string; title: string; subtitle: string }> = {
    mobile: {
      icon: phonePortraitOutline, iconBg: "bg-amber-500/10", iconColor: "text-amber-500",
      title: "Sign in or Sign up", subtitle: "Enter your mobile number to get started",
    },
    otp: {
      icon: shieldCheckmarkOutline, iconBg: "bg-emerald-500/10", iconColor: "text-emerald-400",
      title: "Verification code", subtitle: "Enter the 6-digit code we sent you",
    },
    "register-otp": {
      icon: shieldCheckmarkOutline, iconBg: "bg-violet-500/10", iconColor: "text-violet-400",
      title: "Creating your account", subtitle: "Enter the code to verify & sign up",
    },
    details: {
      icon: personOutline, iconBg: "bg-cyan-500/10", iconColor: "text-cyan-400",
      title: "Complete your profile", subtitle: "Just a few details and you\u2019re all set!",
    },
  };

  const h = headings[step];

  return (
    <div className="px-5 pt-1 pb-2 relative z-10">
      {/* Step heading */}
      <AnimatePresence mode="wait">
        <motion.div key={step + "-heading"} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="mb-5 text-center">
          <div className={`mx-auto w-12 h-12 rounded-2xl ${h.iconBg} flex items-center justify-center mb-3`}>
            <IonIcon icon={h.icon} className={`text-[22px] ${h.iconColor}`} />
          </div>
          <h2 className="text-[20px] font-bold text-white leading-tight">{h.title}</h2>
          <p className="text-[13px] text-slate-400 mt-1">{h.subtitle}</p>
        </motion.div>
      </AnimatePresence>

      <Formik
        initialValues={{ mobile: "", otp: "", name: "", gender: "", city: "", area: "", pincode: "" }}
        validationSchema={schemas[step]}
        onSubmit={() => {}}
        enableReinitialize={false}
      >
        {({ isValid, validateForm, setTouched, setFieldValue, setFieldTouched, dirty, values, touched, errors }) => {
          // Keep ref in sync so requestLocation can auto-populate fields
          setFieldValueRef.current = setFieldValue;
          return (
          <Form>
            <AnimatePresence mode="wait">
              {/* ─── Mobile Step ─── */}
              {step === "mobile" && (
                <motion.div key="phone" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.15 }}>
                  <InlineInput name="mobile" placeholder="9876 543 210" prefix="+91" format={(v) => v.replace(/\D/g, "").slice(0, 10)} autoFocus />
                </motion.div>
              )}

              {/* ─── OTP Step (login or register) ─── */}
              {(step === "otp" || step === "register-otp") && (
                <motion.div key="otp-step" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.15 }}>
                  {/* Phone number badge */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.04] rounded-xl border border-white/[0.06] mb-3">
                    <IonIcon icon={phonePortraitOutline} className="text-amber-400 text-sm" />
                    <span className="text-[12px] text-slate-300 font-medium">+91 {values.mobile}</span>
                    {step === "register-otp" && <span className="ml-auto text-[10px] text-violet-400 font-semibold bg-violet-500/10 px-2 py-0.5 rounded-full">New account</span>}
                  </div>
                  <InlineInput name="otp" placeholder="000 000" format={(v) => v.replace(/\D/g, "").slice(0, 6)} autoFocus />
                  <div className="flex items-center justify-between mt-2 ml-1">
                    <button type="button" onClick={() => { setStep("mobile"); setFieldValue("otp", ""); }} className="text-[12px] text-amber-400 font-medium">
                      Change number
                    </button>
                    <button type="button" disabled={resendCountdown > 0 || sendOtp.isPending || regSendOtp.isPending}
                      onClick={() => handleResendOtp(values.mobile, setFieldValue)}
                      className={`text-[12px] font-medium ${resendCountdown > 0 ? "text-slate-600" : "text-amber-400"}`}>
                      {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : "Resend OTP"}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ─── Profile Details Step ─── */}
              {step === "details" && (
                <motion.div key="details" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.15 }}
                  className="space-y-0">

                  {/* Important notice */}
                  <div className="mb-3 flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/[0.08] border border-amber-400/20">
                    <IonIcon icon={alertCircleOutline} className="text-amber-400 text-base shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-300/90 leading-relaxed">
                      Your <span className="font-bold text-amber-400">name</span> and <span className="font-bold text-amber-400">gender</span> are required. Location details are optional but recommended for a better experience.
                    </p>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Full Name</label>
                    <InlineInput name="name" placeholder="e.g. Adeeb Shah" type="text" inputMode="text" autoFocus />
                    <p className="text-[10px] text-slate-600 mt-0.5 ml-1">As it appears on your ID</p>
                  </div>

                  <GenderSelector />

                  {/* City — read-only, auto-filled by map */}
                  <div className="mt-3">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                      City <span className="normal-case font-normal text-slate-600 tracking-normal">— auto-filled by map</span>
                    </label>
                    <div className="flex items-center h-12 rounded-2xl border border-white/[0.08] bg-white/[0.03] opacity-70 cursor-not-allowed">
                      <span className="pl-4"><IonIcon icon={businessOutline} className="text-slate-600 text-sm" /></span>
                      <span className="flex-1 px-3 text-[14px] text-white/60 truncate">{values.city || <span className="text-slate-600">Auto-filled from location</span>}</span>
                      <span className="pr-3"><IonIcon icon={lockClosedOutline} className="text-slate-600 text-xs" /></span>
                    </div>
                  </div>

                  {/* Area — read-only, auto-filled by map */}
                  <div className="mt-3">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                      Area / Locality <span className="normal-case font-normal text-slate-600 tracking-normal">— auto-filled by map</span>
                    </label>
                    <div className="flex items-center h-12 rounded-2xl border border-white/[0.08] bg-white/[0.03] opacity-70 cursor-not-allowed">
                      <span className="pl-4"><IonIcon icon={locationOutline} className="text-slate-600 text-sm" /></span>
                      <span className="flex-1 px-3 text-[14px] text-white/60 truncate">{values.area || <span className="text-slate-600">Auto-filled from location</span>}</span>
                      <span className="pr-3"><IonIcon icon={lockClosedOutline} className="text-slate-600 text-xs" /></span>
                    </div>
                  </div>

                  {/* Pincode — read-only, auto-filled by map */}
                  <div className="mt-3">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                      Pincode <span className="normal-case font-normal text-slate-600 tracking-normal">— auto-filled by map</span>
                    </label>
                    <div className="flex items-center h-12 rounded-2xl border border-white/[0.08] bg-white/[0.03] opacity-70 cursor-not-allowed">
                      <span className="pl-4"><IonIcon icon={mapOutline} className="text-slate-600 text-sm" /></span>
                      <span className="flex-1 px-3 text-[14px] text-white/60 tracking-wide">{values.pincode || <span className="text-slate-600">Auto-filled from location</span>}</span>
                      <span className="pr-3"><IonIcon icon={lockClosedOutline} className="text-slate-600 text-xs" /></span>
                    </div>
                  </div>

                  {/* Location Search + Map */}
                  <div className="mt-3">
                    {/* Search bar — outside map container so dropdown isn’t clipped */}
                    <div className="relative mb-2">
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Search Location</label>
                      <div className={`flex items-center h-10 rounded-xl border transition-colors bg-white/[0.06] ${
                        locationSearch ? "border-amber-400/30" : "border-white/[0.08] focus-within:border-white/[0.15]"
                      }`}>
                        <span className="pl-3 shrink-0">
                          {isSearching
                            ? <Spinner />
                            : <IonIcon icon={searchOutline} className="text-slate-500 text-sm" />}
                        </span>
                        <input
                          type="text"
                          value={locationSearch}
                          onChange={(e) => handleLocationSearch(e.target.value)}
                          placeholder="Search area, landmark, address…"
                          className="flex-1 h-full bg-transparent px-2 text-[13px] outline-none text-white placeholder:text-slate-600"
                        />
                        {locationSearch && (
                          <button type="button" onClick={() => { setLocationSearch(""); setLocationSuggestions([]); }}
                            className="pr-3 text-slate-500 active:text-white text-lg leading-none">
                            &times;
                          </button>
                        )}
                      </div>

                      {/* Suggestions dropdown */}
                      {locationSuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-slate-800 rounded-xl border border-white/[0.08] shadow-2xl z-50 max-h-48 overflow-y-auto">
                          {locationSuggestions.map((r) => {
                            const isLandmark = !!r.mainText && r.description !== r.mainText && !r.description.startsWith(r.mainText + ",");
                            return (
                              <button key={r.placeId} type="button"
                                onClick={() => handleSelectSuggestion(r)}
                                className="w-full text-left px-3 py-2.5 border-b border-white/[0.04] last:border-0 active:bg-white/[0.06] transition-colors">
                                <div className="flex items-start gap-2.5">
                                  <div className={`mt-0.5 shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${isLandmark ? "bg-orange-500/15" : "bg-amber-500/10"}`}>
                                    <IonIcon icon={isLandmark ? storefrontOutline : locationOutline} className={`text-xs ${isLandmark ? "text-orange-400" : "text-amber-400"}`} />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-[13px] text-white font-medium leading-tight truncate">{r.mainText}</div>
                                    <div className="text-[11px] text-slate-500 mt-0.5 leading-tight truncate">{r.secondaryText || r.description}</div>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Interactive Map */}
                    {isMapLoaded ? (
                      <div className="relative rounded-xl overflow-hidden border border-white/[0.08] mb-2" style={{ height: mapExpanded ? 280 : 160 }}>
                        {/* Expand / Collapse */}
                        <button type="button" onClick={() => setMapExpanded((p) => !p)}
                          className="absolute bottom-2 right-2 z-10 w-8 h-8 bg-slate-900/80 backdrop-blur-sm rounded-lg border border-white/[0.1] grid place-content-center active:scale-90 transition-transform">
                          <IonIcon icon={mapExpanded ? contractOutline : expandOutline} className="text-white text-sm" />
                        </button>
                        <GoogleMap
                          center={geoLocation ?? { lat: 20.5937, lng: 78.9629 }}
                          zoom={geoLocation ? 15 : 4}
                          mapContainerStyle={MINI_MAP_STYLE}
                          options={{ disableDefaultUI: true, zoomControl: true, gestureHandling: "greedy", clickableIcons: false }}
                          onLoad={(map) => { mapInstanceRef.current = map; }}
                          onClick={(e) => {
                            if (e.latLng) {
                              const lat = e.latLng.lat();
                              const lng = e.latLng.lng();
                              setGeoLocation({ lat, lng });
                              reverseGeocodeApi({ lat, lng }).then((geo) => {
                                const sfv = setFieldValueRef.current;
                                if (sfv && geo) {
                                  if (geo.city) sfv("city", geo.city);
                                  if (geo.area) sfv("area", geo.area);
                                  if (geo.pincode) sfv("pincode", geo.pincode);
                                }
                              }).catch(() => {});
                            }
                          }}
                        >
                          {geoLocation && <MarkerF position={{ lat: geoLocation.lat, lng: geoLocation.lng }} />}
                        </GoogleMap>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] h-[160px] flex items-center justify-center mb-2">
                        <Spinner />
                      </div>
                    )}

                    {/* Use Current Location Button */}
                    <button type="button" onClick={requestLocation} disabled={isLocating}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all active:scale-[0.98] ${
                        geoLocation ? "bg-emerald-500/[0.06] border-emerald-400/20" : "bg-white/[0.03] border-white/[0.06]"
                      }`}>
                      <div className={`w-8 h-8 rounded-full grid place-content-center shrink-0 ${geoLocation ? "bg-emerald-500/15 text-emerald-400" : isLocating ? "bg-amber-500/15 text-amber-400" : "bg-white/[0.06] text-slate-500"}`}>
                        {isLocating ? <Spinner /> : <IonIcon icon={geoLocation ? navigateOutline : alertCircleOutline} className="text-base" />}
                      </div>
                      <div className="flex-1 text-left">
                        <div className={`text-[11px] font-bold ${geoLocation ? "text-emerald-400" : isLocating ? "text-amber-400" : "text-slate-400"}`}>
                          {geoLocation ? "Location pinned — fields auto-filled" : isLocating ? "Getting your location..." : "Use current location"}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {geoLocation ? `${geoLocation.lat.toFixed(4)}, ${geoLocation.lng.toFixed(4)}` : isLocating ? "Please wait" : "Tap to enable GPS"}
                        </div>
                      </div>
                      {!geoLocation && !isLocating && (
                        <span className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-[10px] font-bold shrink-0">
                          Enable
                        </span>
                      )}
                      {geoLocation && (
                        <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-[10px] font-bold shrink-0">
                          Refresh
                        </span>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ─── Action Buttons ─── */}
            {step === "details" ? (
              <div className="mt-5 flex gap-3">
                <button type="button" onClick={() => setStep("register-otp")}
                  className="flex items-center justify-center gap-1.5 h-[48px] px-4 rounded-2xl border border-white/[0.08] bg-white/[0.05] text-slate-300 text-[14px] font-medium active:scale-[0.98] transition-all">
                  <IonIcon icon={arrowBack} className="text-sm" /> Back
                </button>
                <button type="button"
                  onClick={() => handleAuthSubmit(validateForm, setTouched, values, setFieldValue)}
                  disabled={!isValid || !dirty || busy}
                  className="flex-1 h-[48px] rounded-2xl bg-gradient-to-r from-violet-500 to-violet-600 text-white text-[15px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg shadow-violet-500/20 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 disabled:shadow-none">
                  {busy ? <Spinner /> : <><IonIcon icon={checkmarkCircle} className="text-base" /> Create Account</>}
                </button>
              </div>
            ) : (
              <button type="button"
                onClick={() => handleAuthSubmit(validateForm, setTouched, values, setFieldValue)}
                disabled={!isValid || !dirty || busy}
                className="mt-5 w-full h-[48px] rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[15px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg shadow-amber-500/20 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 disabled:shadow-none">
                {busy ? <Spinner /> : step === "mobile" ? "Continue" : "Verify"}
              </button>
            )}

            {/* ─── Social Login (mobile step only) ─── */}
            {step === "mobile" && (
              <>
                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-white/[0.08]" />
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-widest">or</span>
                  <div className="flex-1 h-px bg-white/[0.08]" />
                </div>
                <div className="space-y-2.5">
                  <button type="button" onClick={() => googleLogin()} disabled={busy}
                    className="w-full h-[48px] rounded-2xl border border-white/[0.08] bg-white/[0.05] flex items-center justify-center gap-3 text-[14px] font-medium text-slate-200 active:scale-[0.98] transition-all disabled:opacity-40 backdrop-blur-sm">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                  </button>
                  {isApple && (
                    <button type="button" onClick={handleApple} disabled={busy}
                      className="w-full h-[48px] rounded-2xl bg-white text-black flex items-center justify-center gap-3 text-[14px] font-medium active:scale-[0.98] transition-all disabled:opacity-40">
                      <IonIcon icon={logoApple} className="text-lg" />
                      Continue with Apple
                    </button>
                  )}
                </div>

                {/* Signup nudge */}
                <p className="text-center mt-4 text-[12px] text-slate-400">
                  Don&apos;t have an account?{" "}
                  <span className="text-amber-400 font-semibold">Just enter your number</span> — we&apos;ll set you up!
                </p>
              </>
            )}

            <p className="text-[10px] text-slate-500 mt-5 text-center leading-relaxed">
              By continuing you agree to our Terms &amp; Privacy Policy
            </p>
          </Form>
        );}}
      </Formik>
    </div>
  );
}

// ─── Sheet Wrapper ──────────────────────────────────────────────
export default function AuthGateSheet() {
  const { isAuthGateOpen, closeAuthGate } = useAuthGateContext();
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  return (
    <AnimatePresence>
      {isAuthGateOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="auth-gate-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-[2px]"
            onClick={closeAuthGate}
          />

          {/* Bottom sheet */}
          <motion.div
            key="auth-gate-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className="fixed bottom-0 inset-x-0 z-[9999] rounded-t-3xl shadow-2xl overflow-hidden"
            style={{
              maxHeight: "92vh",
              paddingBottom: "max(env(safe-area-inset-bottom), 12px)",
              background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 55%, #1e3a5f 100%)",
            }}
          >
            {/* Abstract background decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
              <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-amber-500/[0.06] blur-3xl" />
              <div className="absolute top-1/3 -left-16 w-48 h-48 rounded-full bg-indigo-500/[0.08] blur-2xl" />
              <div className="absolute bottom-10 right-8 w-32 h-32 rounded-full bg-cyan-400/[0.05] blur-2xl" />
              <svg className="absolute top-6 right-12 w-24 h-24 text-white/[0.03]" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="1" fill="none" /></svg>
              <svg className="absolute bottom-20 left-6 w-16 h-16 text-white/[0.04]" viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80" rx="20" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
            </div>

            {/* Handle bar + close */}
            <div className="flex items-center justify-between px-5 pt-3 pb-1 relative z-10">
              <div className="w-8" />
              <div className="w-10 h-1 bg-white/[0.12] rounded-full" />
              <button
                onClick={closeAuthGate}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.08] active:scale-90 transition-transform"
              >
                <IonIcon icon={closeOutline} className="text-lg text-slate-400" />
              </button>
            </div>

            <div className="overflow-y-auto relative" style={{ maxHeight: "calc(92vh - 52px)" }}>
              <GoogleOAuthProvider clientId={clientId}>
                <AuthGateSheetContent />
              </GoogleOAuthProvider>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
