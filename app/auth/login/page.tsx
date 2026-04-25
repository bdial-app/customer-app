"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ROUTE_PATH } from "@/utils/contants";
import { Formik, Form, useField } from "formik";
import * as Yup from "yup";
import { useSendOtp, useVerifyOtp, useGoogleSignIn } from "@/hooks/useAuth";
import { useNotification } from "@/app/context/NotificationContext";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { IonIcon } from "@ionic/react";
import { logoApple } from "ionicons/icons";

type LoginStep = "mobile" | "otp";

const schemas = {
  mobile: Yup.object({
    mobile: Yup.string()
      .matches(/^\d{10}$/, "Enter valid 10 digit number")
      .required("Required"),
  }),
  otp: Yup.object({
    otp: Yup.string()
      .matches(/^\d{6}$/, "Enter 6 digit OTP")
      .required("Required"),
  }),
};

/* ── Tiny spinner ────────────────────────────────────────── */
function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5 text-current" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

/* ── Inline input ────────────────────────────────────────── */
function PhoneInput({
  name,
  placeholder,
  prefix,
  format,
  autoFocus,
}: {
  name: string;
  placeholder: string;
  prefix?: string;
  format?: (v: string) => string;
  autoFocus?: boolean;
}) {
  const [field, meta, helpers] = useField(name);
  const err = meta.touched && meta.error;
  return (
    <div>
      <div
        className={`flex items-center h-14 rounded-2xl bg-white border transition-colors ${
          err
            ? "border-red-300"
            : "border-gray-200 focus-within:border-gray-400"
        }`}
      >
        {prefix && (
          <span className="pl-4 text-[15px] font-medium text-gray-400 select-none">
            {prefix}
          </span>
        )}
        <input
          autoFocus={autoFocus}
          type="tel"
          inputMode="numeric"
          placeholder={placeholder}
          value={field.value}
          onBlur={field.onBlur}
          name={field.name}
          onChange={(e) =>
            helpers.setValue(format ? format(e.target.value) : e.target.value)
          }
          className="flex-1 h-full bg-transparent px-3 text-[16px] text-gray-900 outline-none placeholder:text-gray-300"
        />
      </div>
      {err && (
        <p className="text-[11px] text-red-400 mt-1 ml-1">{meta.error}</p>
      )}
    </div>
  );
}

/* ── Core login content (lives inside GoogleOAuthProvider) ── */
function LoginContent() {
  const router = useRouter();
  const { notify } = useNotification();
  const [step, setStep] = useState<LoginStep>("mobile");

  const sendOtp = useSendOtp();
  const verifyOtp = useVerifyOtp();
  const googleMutation = useGoogleSignIn();

  const [resendCountdown, setResendCountdown] = useState(0);

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const id = setInterval(
      () => setResendCountdown((c) => (c <= 1 ? 0 : c - 1)),
      1000,
    );
    return () => clearInterval(id);
  }, [resendCountdown]);

  const busy =
    sendOtp.isPending || verifyOtp.isPending || googleMutation.isPending;

  const isApple = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent);
  }, []);

  /* ── OTP flow ── */
  const handleSubmit = async (
    validateForm: () => Promise<Record<string, string>>,
    setTouched: (t: Record<string, boolean>) => void,
    values: { mobile: string; otp: string },
  ) => {
    const errors = await validateForm();
    if (Object.keys(errors).length) {
      setTouched(Object.fromEntries(Object.keys(errors).map((k) => [k, true])));
      return;
    }
    try {
      if (step === "mobile") {
        const res = await sendOtp.mutateAsync({ mobileNumber: values.mobile });

        // New user — skip OTP, go straight to registration with mobile pre-filled
        if (res?.userExists === false) {
          router.push(`${ROUTE_PATH.CREATE_ACCOUNT}?mobile=${values.mobile}`);
          return;
        }

        const otp: string | undefined = res?.data?.otp;
        notify({
          title: "OTP Sent",
          subtitle: otp ? `Your code: ${otp}` : "Check your messages",
          variant: "success",
          duration: 10000,
        });
        setResendCountdown(60);
        setStep("otp");
      } else {
        const res = await verifyOtp.mutateAsync({
          mobileNumber: values.mobile,
          otp: values.otp,
        });
        if (res.user?.name) {
          router.push(ROUTE_PATH.HOME);
          notify({
            title: "Welcome back",
            subtitle: res.user.name,
            variant: "success",
          });
        } else {
          router.push(ROUTE_PATH.CREATE_ACCOUNT);
          notify({
            title: "Almost there",
            subtitle: "Complete your profile",
            variant: "info",
          });
        }
      }
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.error_code === "OTP_RATE_LIMITED" && data?.retryAfterSeconds) {
        setResendCountdown(data.retryAfterSeconds);
        if (step === "mobile") setStep("otp");
        notify({
          title: "OTP already sent",
          subtitle: `You can resend in ${data.retryAfterSeconds}s`,
          variant: "warning",
        });
      } else {
        notify({
          title: "Error",
          subtitle: data?.message ?? "Something went wrong",
          variant: "error",
        });
      }
    }
  };

  /* ── Google SSO ── */
  const googleLogin = useGoogleLogin({
    onSuccess: async (tok) => {
      try {
        const r = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tok.access_token}` },
        });
        const info = await r.json();
        const res = await googleMutation.mutateAsync({
          email: info.email,
          name: info.name,
          googleId: info.sub,
        });
        if (res.user?.name) {
          router.push(ROUTE_PATH.HOME);
          notify({
            title: "Welcome",
            subtitle: res.user.name,
            variant: "success",
          });
        } else {
          router.push(ROUTE_PATH.CREATE_ACCOUNT);
          notify({
            title: "Almost there",
            subtitle: "Complete your profile",
            variant: "info",
          });
        }
      } catch (err: any) {
        notify({
          title: "Google Sign-In failed",
          subtitle: err?.response?.data?.message ?? "Please try again",
          variant: "error",
        });
      }
    },
    onError: () =>
      notify({
        title: "Cancelled",
        subtitle: "Google sign-in was cancelled",
        variant: "warning",
      }),
  });

  const handleApple = () =>
    notify({
      title: "Coming Soon",
      subtitle: "Apple Sign-In coming shortly",
      variant: "info",
    });

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-50">
      {/* ── Top safe-area (no skip) ── */}
      <div
        className="shrink-0"
        style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 12px)" }}
      />

      {/* ── Logo area ── */}
      <div className="flex flex-col items-center pt-10 pb-6 shrink-0">
        <div className="w-16 h-16 rounded-[18px] overflow-hidden mb-3">
          <img
            src="/icons/512.png"
            alt="Tijarah Logo"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* ── Card ── */}
      <div className="flex-1 flex flex-col bg-white rounded-t-[28px] shadow-[0_-4px_30px_rgba(0,0,0,0.04)] px-6 pt-7 pb-0 overflow-y-auto">
        <AnimatePresence mode="wait">
          {step === "mobile" ? (
            <motion.div
              key="mobile-heading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-6"
            >
              <h1 className="text-[22px] font-bold text-gray-900 leading-tight">
                Enter your mobile number
              </h1>
              <p className="text-[13px] text-gray-400 mt-1">
                We&apos;ll send a verification code
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="otp-heading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-6"
            >
              <h1 className="text-[22px] font-bold text-gray-900 leading-tight">
                Verification code
              </h1>
              <p className="text-[13px] text-gray-400 mt-1">
                Sent to your mobile number
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <Formik
          initialValues={{ mobile: "", otp: "" }}
          validationSchema={schemas[step]}
          onSubmit={() => {}}
        >
          {({
            isValid,
            validateForm,
            setTouched,
            setFieldValue,
            dirty,
            values,
          }) => (
            <Form className="flex flex-col flex-1">
              <AnimatePresence mode="wait">
                {step === "mobile" && (
                  <motion.div
                    key="phone"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16 }}
                    transition={{ duration: 0.2 }}
                  >
                    <PhoneInput
                      name="mobile"
                      placeholder="9876 543 210"
                      prefix="+91"
                      format={(v) => v.replace(/\D/g, "").slice(0, 10)}
                      autoFocus
                    />
                  </motion.div>
                )}
                {step === "otp" && (
                  <motion.div
                    key="otp"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16 }}
                    transition={{ duration: 0.2 }}
                  >
                    <PhoneInput
                      name="otp"
                      placeholder="000 000"
                      format={(v) => v.replace(/\D/g, "").slice(0, 6)}
                      autoFocus
                    />
                    <div className="flex items-center justify-between mt-2 ml-1">
                      <button
                        type="button"
                        onClick={() => {
                          setStep("mobile");
                          setFieldValue("otp", "");
                        }}
                        className="text-[12px] text-amber-600 font-medium"
                      >
                        Change number
                      </button>
                      <button
                        type="button"
                        disabled={resendCountdown > 0 || sendOtp.isPending}
                        onClick={async () => {
                          try {
                            const res = await sendOtp.mutateAsync({
                              mobileNumber: values.mobile,
                            });
                            const code: string | undefined = res?.data?.otp;
                            setFieldValue("otp", "");
                            setResendCountdown(60);
                            notify({
                              title: "OTP Resent",
                              subtitle: code
                                ? `Your new code: ${code}`
                                : "Check your messages",
                              variant: "success",
                              duration: 10000,
                            });
                          } catch (err: any) {
                            const data = err?.response?.data;
                            if (
                              data?.error_code === "OTP_RATE_LIMITED" &&
                              data?.retryAfterSeconds
                            ) {
                              setResendCountdown(data.retryAfterSeconds);
                              notify({
                                title: "Please wait",
                                subtitle: `Resend available in ${data.retryAfterSeconds}s`,
                                variant: "warning",
                              });
                            } else {
                              notify({
                                title: "Error",
                                subtitle:
                                  data?.message ?? "Failed to resend OTP",
                                variant: "error",
                              });
                            }
                          }
                        }}
                        className={`text-[12px] font-medium ${
                          resendCountdown > 0
                            ? "text-gray-300"
                            : "text-amber-600"
                        }`}
                      >
                        {resendCountdown > 0
                          ? `Resend in ${resendCountdown}s`
                          : "Resend OTP"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* CTA */}
              <button
                type="button"
                onClick={() => handleSubmit(validateForm, setTouched, values)}
                disabled={!isValid || !dirty || busy}
                className="mt-5 h-[52px] rounded-2xl bg-gray-900 text-white text-[15px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:bg-gray-200 disabled:text-gray-400"
              >
                {busy ? <Spinner /> : step === "mobile" ? "Continue" : "Verify"}
              </button>

              {/* ── Divider ── */}
              {step === "mobile" && (
                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-[11px] font-medium text-gray-300 uppercase tracking-widest">
                    or
                  </span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
              )}

              {/* ── Social buttons ── */}
              {step === "mobile" && (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => googleLogin()}
                    disabled={busy}
                    className="w-full h-[52px] rounded-2xl border border-gray-200 bg-white flex items-center justify-center gap-3 text-[15px] font-medium text-gray-700 active:scale-[0.98] transition-all disabled:opacity-40"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Continue with Google
                  </button>

                  {isApple && (
                    <button
                      type="button"
                      onClick={handleApple}
                      disabled={busy}
                      className="w-full h-[52px] rounded-2xl bg-black text-white flex items-center justify-center gap-3 text-[15px] font-medium active:scale-[0.98] transition-all disabled:opacity-40"
                    >
                      <IonIcon icon={logoApple} className="text-lg" />
                      Continue with Apple
                    </button>
                  )}
                </div>
              )}

              {/* ── Footer ── */}
              <div
                className="mt-auto pt-6 text-center shrink-0"
                style={{
                  paddingBottom: "max(env(safe-area-inset-bottom, 0px), 20px)",
                }}
              >
                <p className="text-[13px] text-gray-400">
                  Don&apos;t have an account?{" "}
                  <Link
                    href={ROUTE_PATH.CREATE_ACCOUNT}
                    className="text-gray-900 font-semibold"
                  >
                    Sign up
                  </Link>
                </p>
                <p className="text-[10px] text-gray-300 mt-3 leading-relaxed">
                  By continuing you agree to our Terms & Privacy Policy
                </p>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}

/* ── Page wrapper (client-only for Google SDK) ── */
export default function LoginPage() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
        <div className="w-16 h-16 rounded-[18px] overflow-hidden animate-pulse">
          <img
            src="/icons/512.png"
            alt="Loading"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <LoginContent />
    </GoogleOAuthProvider>
  );
}
