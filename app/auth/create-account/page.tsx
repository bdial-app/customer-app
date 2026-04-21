"use client";
import {
  List,
  Page,
  Block,
  Button,
  Preloader,
  Navbar,
} from "konsta/react";
import Link from "next/link";
import { ROUTE_PATH } from "@/utils/contants";
import { Formik, Form, useFormikContext } from "formik";
import * as Yup from "yup";
import { FormikInput } from "@/app/components/formik-input";
import { useCreateAccount } from "@/hooks/useCreateAccount";
import { useAppDispatch } from "@/hooks/useAppStore";
import { setSkippedAuth } from "@/store/slices/authSlice";
import { IonIcon } from "@ionic/react";
import {
  phonePortraitOutline,
  keyOutline,
  personOutline,
  locationOutline,
  checkmarkCircle,
  navigateOutline,
  alertCircleOutline,
} from "ionicons/icons";

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
    area: Yup.string().required("Area is required"),
    gender: Yup.string()
      .oneOf(["male", "female", "other"])
      .required("Gender is required"),
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
    <div className="px-6 pt-5 pb-3">
      <div className="flex items-center justify-between">
        {steps.map((step, i) => {
          const isActive = step.key === currentStep;
          const isComplete = i < currentIdx;

          return (
            <div key={step.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-10 h-10 rounded-full grid place-content-center transition-all duration-300 ${
                    isActive
                      ? "bg-amber-400 text-white shadow-lg shadow-amber-200 scale-110"
                      : isComplete
                        ? "bg-green-100 text-green-600"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {isComplete ? (
                    <IonIcon icon={checkmarkCircle} className="text-lg" />
                  ) : (
                    <IonIcon icon={step.icon} className="text-lg" />
                  )}
                </div>
                <span
                  className={`text-[10px] font-semibold ${
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
                <div className="flex-1 mx-2 mb-5">
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
    <div className="px-4 py-3">
      <label className="block text-xs font-medium text-slate-500 mb-2.5">
        Gender
      </label>
      <div className="flex gap-2.5">
        {genders.map((g) => {
          const selected = values.gender === g.value;
          return (
            <button
              key={g.value}
              type="button"
              onClick={() => setFieldValue("gender", g.value)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all duration-200 active:scale-95 ${
                selected
                  ? "border-amber-400 bg-amber-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <span className="text-xl">{g.emoji}</span>
              <span
                className={`text-xs font-semibold ${selected ? "text-amber-700" : "text-slate-500"}`}
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

// ─── Location Details ──────────────────────────────────────────
const LocationFields = () => {
  const { values, setFieldValue, touched, errors, setFieldTouched } =
    useFormikContext<any>();

  return (
    <>
      <div className="px-4 py-2">
        <label className="block text-xs font-medium text-slate-500 mb-1.5">
          Area / Locality
        </label>
        <div
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border-2 transition-all ${
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
            placeholder="e.g. Bandra West"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 text-slate-800"
          />
        </div>
        {touched.area && errors.area && (
          <div className="text-xs text-red-500 mt-1 px-1">{String(errors.area)}</div>
        )}
      </div>
    </>
  );
};

// ─── Main Page ──────────────────────────────────────────────────
export default function CreateAccountPage() {
  const dispatch = useAppDispatch();
  const {
    currentStep,
    isLoading,
    resendCooldown,
    location,
    requestLocation,
    initialValues,
    handleBack,
    handleNext,
    handleResendOtp,
    handleSubmit,
  } = useCreateAccount();

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
      <Navbar
        title="Create Account"
        right={
          <Link
            href={ROUTE_PATH.HOME}
            onClick={() => dispatch(setSkippedAuth(true))}
            className="text-sm text-slate-500 font-medium pr-4"
          >
            Skip
          </Link>
        }
      />

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
          dirty,
          values,
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

                <Block className="!mt-4">
                  <Button
                    large
                    rounded
                    onClick={() =>
                      handleNext(validateForm, setTouched, values)
                    }
                    disabled={!isValid || !dirty || isLoading}
                    type="button"
                  >
                    {isLoading ? (
                      <Preloader className="w-5 h-5" />
                    ) : (
                      "Send OTP"
                    )}
                  </Button>
                </Block>
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
                    disabled={resendCooldown > 0 || isLoading}
                    className={`text-xs font-semibold transition-colors ${
                      resendCooldown > 0 || isLoading
                        ? "text-slate-400"
                        : "text-amber-600 active:text-amber-800"
                    }`}
                  >
                    {resendCooldown > 0
                      ? `Resend in ${resendCooldown}s`
                      : "Didn't receive it? Resend OTP"}
                  </button>
                </div>

                <Block className="!mt-4">
                  <div className="flex gap-2.5">
                    <Button
                      rounded
                      clear
                      large
                      onClick={() => handleBack(setFieldValue)}
                      className="flex-1"
                      type="button"
                      disabled={isLoading}
                    >
                      Back
                    </Button>
                    <Button
                      large
                      rounded
                      disabled={!isValid || !dirty || isLoading}
                      className="flex-1"
                      onClick={() =>
                        handleNext(validateForm, setTouched, values)
                      }
                      type="button"
                    >
                      {isLoading ? (
                        <Preloader className="w-5 h-5" />
                      ) : (
                        "Verify"
                      )}
                    </Button>
                  </div>
                </Block>
              </>
            )}

            {/* ─── Step: Details ─── */}
            {currentStep === "details" && (
              <>
                <div className="overflow-y-auto max-h-[calc(100vh-300px)] pb-4">
                  <List strongIos insetIos className="!mt-2">
                    <FormikInput
                      name="name"
                      label="Full Name"
                      type="text"
                      placeholder="e.g. Adeeb Shah"
                      info="As it appears on your ID"
                    />
                  </List>

                  <GenderSelector />

                  <div className="px-4 pt-3 pb-1">
                    <div className="flex items-center gap-2 mb-1">
                      <IonIcon
                        icon={locationOutline}
                        className="text-slate-400 text-sm"
                      />
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Location
                      </span>
                    </div>
                  </div>

                  <LocationFields />

                  {/* Geolocation Status */}
                  <div className="px-4 pt-3">
                    <div
                      className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
                        location
                          ? "bg-green-50 border-green-200"
                          : "bg-red-50 border-red-200"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-full grid place-content-center ${
                          location
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-500"
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
                          className={`text-xs font-bold ${location ? "text-green-700" : "text-red-700"}`}
                        >
                          {location
                            ? "Location secured"
                            : "Location access needed"}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {location
                            ? "Your coordinates have been saved"
                            : "Required to complete registration"}
                        </div>
                      </div>
                      {!location && (
                        <Button
                          small
                          outline
                          rounded
                          className="!text-[10px] !h-7 !px-3"
                          onClick={requestLocation}
                          type="button"
                        >
                          Allow
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <Block className="!mt-3">
                  <div className="flex gap-2.5">
                    <Button
                      rounded
                      clear
                      onClick={() => handleBack(setFieldValue)}
                      className="flex-1"
                      type="button"
                      disabled={isLoading}
                    >
                      Back
                    </Button>
                    <Button
                      large
                      rounded
                      disabled={!isValid || !dirty || isLoading || !location}
                      className="flex-1"
                      type="submit"
                    >
                      {isLoading ? (
                        <Preloader className="w-5 h-5" />
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </div>
                </Block>
              </>
            )}

            {/* Footer Link */}
            <Block className="!my-0 text-center !mb-4">
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
