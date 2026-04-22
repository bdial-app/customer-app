"use client";
import {
  List,
  Page,
  Block,
  Navbar,
} from "konsta/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useState } from "react";
import { ROUTE_PATH } from "@/utils/contants";
import { Formik, Form, useFormikContext } from "formik";
import * as Yup from "yup";
import { FormikInput } from "@/app/components/formik-input";
import { useCreateAccount } from "@/hooks/useCreateAccount";
import { IonIcon } from "@ionic/react";
import {
  phonePortraitOutline,
  keyOutline,
  personOutline,
  arrowBack,
  arrowForwardOutline,
  locationOutline,
  checkmarkCircle,
  navigateOutline,
  alertCircleOutline,
  businessOutline,
  mapOutline,
  chevronDownOutline,
} from "ionicons/icons";
import { CITY_NAMES } from "@/app/data/locations";

// ─── Validation ─────────────────────────────────────────────────
const validationSchemas = {
  mobile: Yup.object({
    mobile: Yup.string()
      .matches(/^\d{10}$/, "Please enter valid 10 digit mobile number")
      .required("Required"),
  }),
  otp: Yup.object({
    otp: Yup.string()
      .matches(/^\d{6}$/, "Please enter 6 digit OTP")
      .required("Required"),
  }),
  details: Yup.object({
    name: Yup.string()
      .min(3, "Must be at least 3 characters")
      .max(100, "Must be under 100 characters")
      .required("Full name is required"),
    gender: Yup.string()
      .oneOf(["male", "female", "other"])
      .required("Gender is required"),
    city: Yup.string().required("City is required"),
    area: Yup.string(),
    pincode: Yup.string()
      .matches(/^\d{6}$/, "Must be 6 digits")
      .required("Pincode is required"),
  }),
};

// ─── Step Progress Bar ──────────────────────────────────────────
const StepProgress = ({
  currentStep,
}: {
  currentStep: "mobile" | "otp" | "details";
}) => {
  const steps = [
    { key: "mobile", label: "Phone", icon: phonePortraitOutline },
    { key: "otp", label: "Verify", icon: keyOutline },
    { key: "details", label: "Profile", icon: personOutline },
  ];
  const currentIdx = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="px-4 py-4">
      <div className="flex items-center max-w-[280px] mx-auto">
        {steps.map((step, i) => {
          const isActive = step.key === currentStep;
          const isComplete = i < currentIdx;

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-9 h-9 rounded-full grid place-content-center transition-all duration-300 ${
                    isActive
                      ? "bg-amber-500 text-white shadow-lg shadow-amber-200/50 scale-110"
                      : isComplete
                        ? "bg-green-500 text-white"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {isComplete ? (
                    <IonIcon icon={checkmarkCircle} className="text-base" />
                  ) : (
                    <IonIcon icon={step.icon} className="text-base" />
                  )}
                </div>
                <span
                  className={`text-[10px] font-semibold whitespace-nowrap ${
                    isActive
                      ? "text-amber-600"
                      : isComplete
                        ? "text-green-600"
                        : "text-slate-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 mx-2 -mt-4">
                  <div
                    className={`h-0.5 rounded-full transition-all duration-500 ${
                      i < currentIdx ? "bg-green-400" : "bg-slate-200"
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Gender Selector ────────────────────────────────────────────
const GenderSelector = () => {
  const { values, setFieldValue, touched, errors } = useFormikContext<any>();
  const genders = [
    { value: "male", label: "Male", emoji: "👨" },
    { value: "female", label: "Female", emoji: "👩" },
    { value: "other", label: "Other", emoji: "🧑" },
  ];

  return (
    <div className="px-4 py-2">
      <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">
        Gender
      </label>
      <div className="grid grid-cols-3 gap-2.5">
        {genders.map((g) => {
          const selected = values.gender === g.value;
          return (
            <button
              key={g.value}
              type="button"
              onClick={() => setFieldValue("gender", g.value)}
              className={`relative flex flex-col items-center gap-1.5 py-3.5 rounded-2xl border-2 transition-all duration-200 active:scale-95 ${
                selected
                  ? "border-amber-400 bg-amber-50 shadow-sm shadow-amber-100/50"
                  : "border-slate-100 bg-white hover:border-slate-200"
              }`}
            >
              {selected && (
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-500 rounded-full grid place-content-center shadow-sm">
                  <IonIcon icon={checkmarkCircle} className="text-white text-[11px]" />
                </div>
              )}
              <span className="text-2xl">{g.emoji}</span>
              <span
                className={`text-xs font-bold ${selected ? "text-amber-700" : "text-slate-500"}`}
              >
                {g.label}
              </span>
            </button>
          );
        })}
      </div>
      {touched.gender && errors.gender && (
        <div className="text-xs text-red-500 mt-1.5 px-1">
          {String(errors.gender)}
        </div>
      )}
    </div>
  );
};

// ─── City Selector ──────────────────────────────────────────────
const CitySelector = () => {
  const { values, setFieldValue, touched, errors, setFieldTouched } =
    useFormikContext<any>();
  const [cityOpen, setCityOpen] = useState(false);
  const [citySearch, setCitySearch] = useState("");

  const filteredCities = CITY_NAMES.filter((c) =>
    c.toLowerCase().includes(citySearch.toLowerCase()),
  );
  const isCitySupported = values.city && CITY_NAMES.includes(values.city);

  return (
    <div className="px-4 py-1.5 relative z-10">
      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
        City
      </label>
      <button
        type="button"
        onClick={() => setCityOpen(!cityOpen)}
        className={`w-full flex items-center gap-2 px-3.5 py-3 rounded-xl border-2 transition-all text-left ${
          touched.city && errors.city
            ? "border-red-300 bg-white"
            : values.city
              ? isCitySupported
                ? "border-green-200 bg-green-50/30"
                : "border-amber-200 bg-amber-50/30"
              : "border-slate-200 bg-white"
        }`}
      >
        <IonIcon
          icon={businessOutline}
          className="text-slate-400 text-base flex-shrink-0"
        />
        <span
          className={`flex-1 text-sm ${values.city ? "text-slate-800 font-medium" : "text-slate-400"}`}
        >
          {values.city || "Select your city"}
        </span>
        {values.city && isCitySupported && (
          <IonIcon icon={checkmarkCircle} className="text-green-500 text-base" />
        )}
        <IonIcon
          icon={chevronDownOutline}
          className={`text-slate-400 text-xs transition-transform ${cityOpen ? "rotate-180" : ""}`}
        />
      </button>
      {cityOpen && (
        <div className="absolute left-4 right-4 top-full mt-1 bg-white rounded-xl border border-slate-200 shadow-xl z-30 max-h-52 overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <input
              type="text"
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              placeholder="Search city..."
              className="w-full px-3 py-2 text-sm bg-slate-50 rounded-lg outline-none placeholder:text-slate-400"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto max-h-40">
            {filteredCities.length > 0 ? (
              filteredCities.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => {
                    setFieldValue("city", city);
                    setFieldTouched("city", true, false);
                    setCityOpen(false);
                    setCitySearch("");
                  }}
                  className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                    values.city === city
                      ? "bg-amber-50 text-amber-700 font-semibold"
                      : "text-slate-700 active:bg-slate-50"
                  }`}
                >
                  {city}
                </button>
              ))
            ) : (
              <div className="p-4 text-center">
                <p className="text-sm text-slate-500 font-medium">
                  City not available yet
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  We&apos;re expanding soon!
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      {touched.city && errors.city && (
        <div className="text-xs text-red-500 mt-1 px-1">
          {String(errors.city)}
        </div>
      )}
      {values.city && isCitySupported && (
        <p className="text-[10px] text-green-600 mt-1 px-1 font-medium">
          ✓ We&apos;re available in {values.city}!
        </p>
      )}
    </div>
  );
};

// ─── Location Details ──────────────────────────────────────────
const LocationFields = () => {
  const { values, setFieldValue, touched, errors, setFieldTouched } =
    useFormikContext<any>();

  return (
    <>
      <div className="px-4 py-1.5">
        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
          Area / Locality
        </label>
        <div
          className={`flex items-center gap-2 px-3.5 py-3 rounded-xl border-2 transition-all ${
            touched.area && errors.area
              ? "border-red-300 bg-white"
              : "border-slate-200 bg-white"
          }`}
        >
          <IonIcon
            icon={locationOutline}
            className="text-slate-400 text-base flex-shrink-0"
          />
          <input
            type="text"
            value={values.area}
            onChange={(e) => {
              setFieldValue("area", e.target.value);
              setFieldTouched("area", true, false);
            }}
            placeholder="e.g. Bandra West, Koregaon Park"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 text-slate-800"
          />
        </div>
        {touched.area && errors.area && (
          <div className="text-xs text-red-500 mt-1 px-1">{String(errors.area)}</div>
        )}
      </div>

      <div className="px-4 py-1.5">
        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
          Pincode
        </label>
        <div
          className={`flex items-center gap-2 px-3.5 py-3 rounded-xl border-2 transition-all ${
            touched.pincode && errors.pincode
              ? "border-red-300 bg-white"
              : "border-slate-200 bg-white"
          }`}
        >
          <IonIcon
            icon={mapOutline}
            className="text-slate-400 text-base flex-shrink-0"
          />
          <input
            type="tel"
            value={values.pincode}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 6);
              setFieldValue("pincode", val);
              setFieldTouched("pincode", true, false);
            }}
            placeholder="e.g. 411001"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 text-slate-800 tracking-wide"
          />
        </div>
        {touched.pincode && errors.pincode && (
          <div className="text-xs text-red-500 mt-1 px-1">{String(errors.pincode)}</div>
        )}
      </div>
    </>
  );
};

// ─── Main Page ──────────────────────────────────────────────────
function CreateAccountContent() {
  const searchParams = useSearchParams();
  const initialMobile = searchParams.get("mobile") ?? undefined;
  const {
    currentStep,
    isLoading,
    isSendingOtp,
    isVerifying,
    isSubmitting,
    resendCooldown,
    location,
    requestLocation,
    initialValues,
    handleBack,
    handleNext,
    handleResendOtp,
    handleSubmit,
  } = useCreateAccount(initialMobile);

  const stepInfo = {
    mobile: {
      title: "Enter your phone",
      subtitle: "We'll send you a one-time verification code",
    },
    otp: {
      title: "Verify your number",
      subtitle: "Enter the 6-digit code we sent to your phone",
    },
    details: {
      title: "Complete your profile",
      subtitle: "Just a few details and you're all set!",
    },
  };

  return (
    <Page className="bg-white">
      <Navbar title="Create Account" />

      {/* Header */}
      <div className="px-6 pt-2 pb-1">
        <h1 className="text-2xl font-bold text-slate-800">
          {stepInfo[currentStep].title}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {stepInfo[currentStep].subtitle}
        </p>
      </div>

      <StepProgress currentStep={currentStep} />

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchemas[currentStep]}
        onSubmit={handleSubmit}
      >
        {({
          isValid,
          validateForm,
          setTouched,
          setFieldValue,
          setFieldTouched,
          dirty,
          values,
          touched,
          errors,
        }) => (
          <Form className="contents">
            {/* ─── Step: Mobile ─── */}
            {currentStep === "mobile" && (
              <>
                <List strongIos insetIos className="!mt-2">
                  <FormikInput
                    media="+91"
                    name="mobile"
                    label="Mobile Number"
                    type="tel"
                    placeholder="e.g. 9876543210"
                    info="We'll send a verification code to this number"
                    formatValue={(val) => val.replace(/\D/g, "").slice(0, 10)}
                    inputClassName="text-lg font-medium tracking-wide"
                  />
                </List>

                <div className="px-4 mt-4">
                  <button
                    type="button"
                    onClick={() => handleNext(validateForm, setTouched, values)}
                    disabled={!isValid || !dirty || isSendingOtp}
                    className="flex w-full items-center justify-center gap-2 h-12 rounded-2xl bg-amber-400 text-slate-900 font-bold text-sm disabled:opacity-40 transition-all active:scale-[0.97] shadow-md shadow-amber-200"
                  >
                    {isSendingOtp ? (
                      <span className="w-4 h-4 border-2 border-slate-400/40 border-t-slate-900 rounded-full animate-spin" />
                    ) : (
                      <>
                        Send OTP
                        <IonIcon icon={arrowForwardOutline} className="text-base shrink-0" />
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {/* ─── Step: OTP ─── */}
            {currentStep === "otp" && (
              <>
                <div className="px-6 mb-2">
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 rounded-xl border border-amber-200">
                    <IonIcon
                      icon={phonePortraitOutline}
                      className="text-amber-600 text-base"
                    />
                    <span className="text-xs text-amber-700 font-medium">
                      Code sent to +91 {values.mobile}
                    </span>
                  </div>
                </div>

                <List strongIos insetIos className="!mt-2">
                  <FormikInput
                    name="otp"
                    label="Verification Code"
                    type="tel"
                    placeholder="••••••"
                    formatValue={(val) => val.replace(/\D/g, "").slice(0, 6)}
                    inputClassName="text-center text-2xl tracking-[0.4em] font-mono font-bold"
                  />
                </List>

                <div className="px-6 flex justify-center">
                  <button
                    type="button"
                    onClick={() =>
                      handleResendOtp(values.mobile, setFieldValue)
                    }
                    disabled={resendCooldown > 0 || isSendingOtp}
                    className={`text-xs font-semibold transition-colors ${
                      resendCooldown > 0 || isSendingOtp
                        ? "text-slate-400"
                        : "text-amber-600 active:text-amber-800"
                    }`}
                  >
                    {resendCooldown > 0
                      ? `Resend in ${resendCooldown}s`
                      : "Didn't receive it? Resend OTP"}
                  </button>
                </div>

                <div className="px-4 mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleBack(setFieldValue)}
                    disabled={isVerifying}
                    className="flex items-center justify-center gap-1.5 h-12 px-5 rounded-2xl border-2 border-slate-200 bg-white text-slate-600 font-semibold text-sm disabled:opacity-40 transition-all active:scale-[0.97]"
                  >
                    <IonIcon icon={arrowBack} className="text-base shrink-0" />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNext(validateForm, setTouched, values)}
                    disabled={!isValid || !dirty || isVerifying}
                    className="flex flex-1 items-center justify-center gap-2 h-12 rounded-2xl bg-amber-400 text-slate-900 font-bold text-sm disabled:opacity-40 transition-all active:scale-[0.97] shadow-md shadow-amber-200"
                  >
                    {isVerifying ? (
                      <span className="w-4 h-4 border-2 border-slate-400/40 border-t-slate-900 rounded-full animate-spin" />
                    ) : (
                      <>
                        Verify
                        <IonIcon icon={arrowForwardOutline} className="text-base shrink-0" />
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {/* ─── Step: Details ─── */}
            {currentStep === "details" && (
              <>
                <div className="overflow-y-auto max-h-[calc(100vh-280px)] pb-4 space-y-0.5">
                  {/* Full Name */}
                  <div className="px-4 pt-2 pb-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                      Full Name
                    </label>
                    <div
                      className={`flex items-center gap-2 px-3.5 py-3 rounded-xl border-2 transition-all focus-within:border-amber-300 ${
                        touched.name && errors.name ? "border-red-300 bg-white" : "border-slate-200 bg-white"
                      }`}
                    >
                      <IonIcon
                        icon={personOutline}
                        className="text-slate-400 text-base flex-shrink-0"
                      />
                      <input
                        type="text"
                        name="name"
                        value={values.name}
                        onChange={(e) => setFieldValue("name", e.target.value)}
                        onBlur={() => setFieldTouched("name", true)}
                        placeholder="e.g. Adeeb Shah"
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 text-slate-800"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 px-1">As it appears on your ID</p>
                    {touched.name && errors.name && (
                      <div className="text-xs text-red-500 mt-1 px-1">{String(errors.name)}</div>
                    )}
                  </div>

                  <GenderSelector />

                  {/* Location Section Header */}
                  <div className="px-4 pt-4 pb-1">
                    <div className="flex items-center gap-2">
                      <IonIcon
                        icon={locationOutline}
                        className="text-amber-500 text-sm"
                      />
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Your Location
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 ml-5">
                      Help us connect you with nearby services
                    </p>
                  </div>

                  <CitySelector />
                  <LocationFields />

                  {/* Geolocation Status */}
                  <div className="px-4 pt-2">
                    <div
                      className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
                        location
                          ? "bg-green-50 border-green-200"
                          : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-full grid place-content-center ${
                          location
                            ? "bg-green-100 text-green-600"
                            : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        <IonIcon
                          icon={
                            location ? navigateOutline : alertCircleOutline
                          }
                          className="text-lg"
                        />
                      </div>
                      <div className="flex-1">
                        <div
                          className={`text-xs font-bold ${location ? "text-green-700" : "text-slate-600"}`}
                        >
                          {location
                            ? "Location pinned"
                            : "GPS location needed"}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {location
                            ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
                            : "Tap to enable location access"}
                        </div>
                      </div>
                      {!location && (
                        <button
                          type="button"
                          onClick={requestLocation}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-[10px] font-bold active:bg-amber-600 transition-colors"
                        >
                          Enable
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-4 mt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleBack(setFieldValue)}
                    disabled={isSubmitting}
                    className="flex items-center justify-center gap-1.5 h-12 px-5 rounded-2xl border-2 border-slate-200 bg-white text-slate-600 font-semibold text-sm disabled:opacity-40 transition-all active:scale-[0.97]"
                  >
                    <IonIcon icon={arrowBack} className="text-base shrink-0" />
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={!isValid || !dirty || isSubmitting || !location}
                    className="flex flex-1 items-center justify-center gap-2 h-12 rounded-2xl bg-violet-600 text-white font-bold text-sm disabled:opacity-40 transition-all active:scale-[0.97] shadow-md shadow-violet-200"
                  >
                    {isSubmitting ? (
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <IonIcon icon={checkmarkCircle} className="text-base shrink-0" />
                        Create Account
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {/* Footer Link */}
            <Block className="!mt-6 text-center !mb-4">
              <p className="text-sm text-slate-500">
                Already have an account?{" "}
                <Link
                  href={ROUTE_PATH.LOGIN}
                  className="text-amber-600 font-semibold"
                >
                  Login
                </Link>
              </p>
            </Block>
          </Form>
        )}
      </Formik>
    </Page>
  );
}

export default function CreateAccountPage() {
  return (
    <Suspense>
      <CreateAccountContent />
    </Suspense>
  );
}
