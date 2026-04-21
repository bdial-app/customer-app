"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ROUTE_PATH } from "@/utils/contants";
import { Formik, Form, useField } from "formik";
import * as Yup from "yup";
import { useSendOtp, useVerifyOtp, useGoogleSignIn } from "@/hooks/useAuth";
import { useNotification } from "@/app/context/NotificationContext";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/hooks/useAppStore";
import { setSkippedAuth } from "@/store/slices/authSlice";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";

type LoginStep = "mobile" | "otp";

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
};

function StyledInput({
  name,
  label,
  placeholder,
  prefix,
  formatValue,
}: {
  name: string;
  label: string;
  placeholder: string;
  prefix?: string;
  formatValue?: (val: string) => string;
}) {
  const [field, meta, helpers] = useField(name);
  const showError = meta.touched && meta.error;

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div
        className={`flex items-center rounded-xl border-2 bg-white/80 backdrop-blur-sm transition-all duration-200 ${
          showError
            ? "border-red-400 ring-2 ring-red-100"
            : "border-slate-200 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100"
        }`}
      >
        {prefix && (
          <span className="pl-4 pr-2 text-sm font-semibold text-slate-500 select-none">
            {prefix}
          </span>
        )}
        <input
          type="tel"
          inputMode="numeric"
          placeholder={placeholder}
          value={field.value}
          onBlur={field.onBlur}
          name={field.name}
          onChange={(e) => {
            const val = e.target.value;
            helpers.setValue(formatValue ? formatValue(val) : val);
          }}
          className="flex-1 bg-transparent px-4 py-3.5 text-base text-slate-800 outline-none placeholder:text-slate-400"
        />
      </div>
      {showError && (
        <p className="text-xs text-red-500 pl-1">{meta.error}</p>
      )}
    </div>
  );
}

function LoginContent() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { notify } = useNotification();
  const [currentStep, setCurrentStep] = useState<LoginStep>("mobile");

  const sendOtpMutation = useSendOtp();
  const verifyOtpMutation = useVerifyOtp();
  const googleSignInMutation = useGoogleSignIn();

  const isLoading =
    sendOtpMutation.isPending ||
    verifyOtpMutation.isPending ||
    googleSignInMutation.isPending;

  const handleBack = (setFieldValue: (f: string, v: string) => void) => {
    setCurrentStep("mobile");
    setFieldValue("otp", "");
  };

  const handleNext = async (
    validateForm: () => Promise<Record<string, string>>,
    setTouched: (t: Record<string, boolean>) => void,
    values: { mobile: string; otp: string },
  ) => {
    const errors = await validateForm();
    if (Object.keys(errors).length === 0) {
      try {
        if (currentStep === "mobile") {
          await sendOtpMutation.mutateAsync({ mobileNumber: values.mobile });
          notify({
            title: "OTP Sent",
            subtitle: "OTP sent to your mobile number!",
          });
          setCurrentStep("otp");
        } else if (currentStep === "otp") {
          const res = await verifyOtpMutation.mutateAsync({
            mobileNumber: values.mobile,
            otp: values.otp,
          });

          if (res.user && res.user.name) {
            router.push(ROUTE_PATH.HOME);
            notify({
              title: "Welcome Back",
              subtitle: `Logged in as ${res.user.name}`,
            });
          } else {
            router.push(ROUTE_PATH.CREATE_ACCOUNT);
            notify({
              title: "Profile Incomplete",
              subtitle: "Please complete your profile details.",
            });
          }
        }
      } catch (err: any) {
        notify({
          title: "Error",
          subtitle:
            err?.response?.data?.message ??
            "Something went wrong. Please retry.",
        });
      }
    } else {
      const touchedFields = Object.keys(errors).reduce(
        (acc, current) => {
          acc[current] = true;
          return acc;
        },
        {} as Record<string, boolean>,
      );
      setTouched(touchedFields);
    }
  };

  const handleGoogleSuccess = async (tokenResponse: { access_token: string }) => {
    try {
      const userInfoRes = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } },
      );
      const userInfo = await userInfoRes.json();

      const res = await googleSignInMutation.mutateAsync({
        email: userInfo.email,
        name: userInfo.name,
        googleId: userInfo.sub,
      });

      if (res.user && res.user.name) {
        router.push(ROUTE_PATH.HOME);
        notify({
          title: "Welcome",
          subtitle: `Signed in as ${res.user.name}`,
        });
      } else {
        router.push(ROUTE_PATH.CREATE_ACCOUNT);
        notify({
          title: "Almost There",
          subtitle: "Please complete your profile details.",
        });
      }
    } catch (err: any) {
      notify({
        title: "Google Sign-In Failed",
        subtitle:
          err?.response?.data?.message ?? "Could not sign in with Google.",
      });
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => {
      notify({
        title: "Google Sign-In",
        subtitle: "Google sign-in was cancelled or failed.",
      });
    },
  });

  const handleAppleSignIn = () => {
    notify({
      title: "Coming Soon",
      subtitle: "Apple Sign-In will be available shortly.",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
      {/* Skip button */}
      <div className="flex justify-end p-4 pt-[env(safe-area-inset-top,12px)]">
        <Link
          href={ROUTE_PATH.HOME}
          onClick={() => dispatch(setSkippedAuth(true))}
          className="text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors px-3 py-1.5 rounded-full hover:bg-slate-100"
        >
          Skip for now
        </Link>
      </div>

      {/* Logo & Branding */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center pt-6 pb-8"
      >
        {/* Logo placeholder */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200/50 mb-4">
          <span className="text-3xl font-black text-white">T</span>
        </div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">
          Tijarah Connect
        </h1>
      </motion.div>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="flex-1 px-6"
      >
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
          <p className="text-sm text-slate-500 mt-1">
            Sign in to access your account
          </p>
        </div>

        {/* Phone / OTP Form */}
        <Formik
          initialValues={{ mobile: "", otp: "" }}
          validationSchema={validationSchemas[currentStep]}
          onSubmit={() => {}}
        >
          {({ isValid, validateForm, setTouched, setFieldValue, dirty, values }) => (
            <Form className="space-y-4">
              <AnimatePresence mode="wait">
                {currentStep === "mobile" && (
                  <motion.div
                    key="mobile"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.25 }}
                  >
                    <StyledInput
                      name="mobile"
                      label="Mobile Number"
                      placeholder="9876543210"
                      prefix="+91"
                      formatValue={(val) => val.replace(/\D/g, "").slice(0, 10)}
                    />
                  </motion.div>
                )}
                {currentStep === "otp" && (
                  <motion.div
                    key="otp"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.25 }}
                  >
                    <StyledInput
                      name="otp"
                      label="Verification Code"
                      placeholder="Enter 6-digit OTP"
                      formatValue={(val) => val.replace(/\D/g, "").slice(0, 6)}
                    />
                    <p className="text-xs text-slate-500 mt-2 pl-1">
                      OTP sent to +91 {values.mobile}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action buttons */}
              <div className="pt-1">
                {currentStep === "mobile" ? (
                  <button
                    type="button"
                    onClick={() => handleNext(validateForm, setTouched, values)}
                    disabled={!isValid || !dirty || isLoading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-base shadow-md shadow-amber-200/50 active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none disabled:active:scale-100"
                  >
                    {isLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Sending...
                      </span>
                    ) : (
                      "Get OTP"
                    )}
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleBack(setFieldValue)}
                      disabled={isLoading}
                      className="flex-1 py-3.5 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold text-base hover:bg-slate-50 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNext(validateForm, setTouched, values)}
                      disabled={!isValid || !dirty || isLoading}
                      className="flex-[2] py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-base shadow-md shadow-amber-200/50 active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none disabled:active:scale-100"
                    >
                      {isLoading ? (
                        <span className="inline-flex items-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Verifying...
                        </span>
                      ) : (
                        "Verify OTP"
                      )}
                    </button>
                  </div>
                )}
              </div>
            </Form>
          )}
        </Formik>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            or continue with
          </span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Social sign-in buttons */}
        <div className="space-y-3">
          {/* Google */}
          <button
            type="button"
            onClick={() => googleLogin()}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl border-2 border-slate-200 bg-white font-semibold text-slate-700 text-base hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all disabled:opacity-50 shadow-sm"
          >
            <FcGoogle className="text-xl" />
            Sign in with Google
          </button>

          {/* Apple */}
          <button
            type="button"
            onClick={handleAppleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-black text-white font-semibold text-base hover:bg-slate-900 active:scale-[0.98] transition-all disabled:opacity-50 shadow-sm"
          >
            <FaApple className="text-xl" />
            Sign in with Apple
          </button>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="px-6 py-6 pb-[env(safe-area-inset-bottom,24px)] text-center space-y-2"
      >
        <p className="text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link
            href={ROUTE_PATH.CREATE_ACCOUNT}
            className="font-semibold text-amber-600 hover:text-amber-700"
          >
            Create Account
          </Link>
        </p>
        <p className="text-xs text-slate-400">
          By continuing, you agree to our{" "}
          <span className="underline cursor-pointer">Terms</span> &{" "}
          <span className="underline cursor-pointer">Privacy Policy</span>
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200/50 animate-pulse">
          <span className="text-3xl font-black text-white">T</span>
        </div>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <LoginContent />
    </GoogleOAuthProvider>
  );
}
