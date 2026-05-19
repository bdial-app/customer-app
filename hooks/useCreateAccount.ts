import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ROUTE_PATH } from "@/utils/contants";
import { useSendOtp, useRegistrationSendOtp, useVerifyOtp, useCreateAccountMutation } from "./useAuth";
import { useNotification } from "@/app/context/NotificationContext";
import { getCurrentPosition } from "@/utils/geolocation";

export type CreateAccountStep = "mobile" | "otp" | "details";

export const useCreateAccount = (initialMobile?: string) => {
  const router = useRouter();
  const { notify } = useNotification();
  const [currentStep, setCurrentStep] = useState<CreateAccountStep>(
    initialMobile ? "otp" : "mobile",
  );
  const [resendCooldown, setResendCooldown] = useState(0);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = useCallback(() => {
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    setResendCooldown(60);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const requestLocation = useCallback(async () => {
    try {
      const pos = await getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
      setLocation({ lat: pos.latitude, lng: pos.longitude });
      notify({
        title: "Location Secured",
        subtitle: "We've accurately pinned your location.",
        variant: "success",
      });
    } catch (error: any) {
      const message =
        error?.code === 1 || error?.message?.includes("denied")
          ? "Location access denied. Please enable it in settings and try again."
          : "Please enable location to complete registration.";
      notify({
        title: "Location Required",
        subtitle: message,
        variant: "warning",
      });
    }
  }, [notify]);

  useEffect(
    () => () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    },
    [],
  );


  const sendOtpMutation = useSendOtp();
  const registrationSendOtpMutation = useRegistrationSendOtp();
  const verifyOtpMutation = useVerifyOtp();
  const createAccountMutation = useCreateAccountMutation();

  // Granular loading states so each button only spins for its own action
  const isSendingOtp =
    sendOtpMutation.isPending || registrationSendOtpMutation.isPending;
  const isVerifying = verifyOtpMutation.isPending;
  const isSubmitting = createAccountMutation.isPending;
  const isLoading = isSendingOtp || isVerifying || isSubmitting;

  // When arriving from login redirect with a pre-filled mobile, auto-send the OTP
  const autoSentRef = useRef(false);
  useEffect(() => {
    if (!initialMobile || autoSentRef.current) return;
    autoSentRef.current = true;
    registrationSendOtpMutation.mutateAsync({ mobileNumber: initialMobile }).then((res) => {
      const otp: string | undefined = res?.data?.otp;
      notify({
        title: "OTP Sent",
        subtitle: otp ? `Your code: ${otp}` : "Check your messages",
        variant: "success",
        duration: 10000,
      });
      startCooldown();
    }).catch((err: any) => {
      notify({
        title: "Error",
        subtitle: err?.response?.data?.message ?? "Failed to send OTP. Please try again.",
        variant: "error",
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMobile]);

  const handleBack = (setFieldValue: (field: string, value: any) => void) => {
    if (currentStep === "otp") {
      setCurrentStep("mobile");
      setFieldValue("otp", "");
    } else if (currentStep === "details") {
      setCurrentStep("otp");
    }
  };

  const handleNext = async (
    validateForm: () => Promise<Record<string, string>>,
    setTouched: (fields: Record<string, boolean>) => void,
    values: any,
  ) => {
    const errors = await validateForm();
    if (Object.keys(errors).length > 0) {
      setTouched(
        Object.keys(errors).reduce(
          (acc, key) => ({ ...acc, [key]: true }),
          {} as Record<string, boolean>,
        ),
      );
      return;
    }

    try {
      if (currentStep === "mobile") {
        const res = await registrationSendOtpMutation.mutateAsync({ mobileNumber: values.mobile });
        const otp: string | undefined = res?.data?.otp;
        notify({
          title: "OTP Sent",
          subtitle: otp ? `Your code: ${otp}` : "OTP sent to your mobile number!",
          variant: "success",
          duration: 10000,
        });
        startCooldown();
        setCurrentStep("otp");
      } else if (currentStep === "otp") {
        const res = await verifyOtpMutation.mutateAsync({
          mobileNumber: values.mobile,
          otp: values.otp,
        });

        // If user already has a name, they are already registered - direct home
        if (res.user && res.user.name) {
          router.push(ROUTE_PATH.HOME);
          notify({
            title: "Welcome Back",
            subtitle: `Logged in as ${res.user.name}`,
            variant: "success",
          });
        } else {
          setCurrentStep("details");
        }
      }
    } catch (err: any) {
      notify({
        title: "Error",
        subtitle:
          err?.response?.data?.message ?? "Something went wrong. Please retry.",
        variant: "error",
      });
    }
  };

  const handleSubmit = async (values: any) => {
    if (!location) {
      notify({
        title: "Location Required",
        subtitle:
          "We need your geolocation to complete registration. Please allow access.",
        variant: "warning",
      });
      requestLocation();
      return;
    }

    try {
      await createAccountMutation.mutateAsync({
        name: values.name?.trim(),
        gender: values.gender,
        city: values.city?.trim(),
        area: values.area?.trim(),
        pincode: values.pincode,
        latitude: location.lat,
        longitude: location.lng,
      });
      router.push(ROUTE_PATH.HOME);
    } catch (err: any) {
      notify({
        title: "Error",
        subtitle:
          err?.response?.data?.message ?? "Account creation failed. Try again.",
        variant: "error",
      });
    }
  };

  const handleResendOtp = async (
    mobile: string,
    setFieldValue: (field: string, value: any) => void,
  ) => {
    if (resendCooldown > 0) return;
    try {
      const res = await registrationSendOtpMutation.mutateAsync({ mobileNumber: mobile });
      const otp: string | undefined = res?.data?.otp;
      setFieldValue("otp", "");
      notify({
        title: "OTP Sent",
        subtitle: otp ? `Your code: ${otp}` : "OTP resent to your mobile!",
        variant: "success",
        duration: 10000,
      });
      startCooldown();
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.error_code === "OTP_RATE_LIMITED" && data?.retryAfterSeconds) {
        setResendCooldown(data.retryAfterSeconds);
        notify({
          title: "Please wait",
          subtitle: `You can resend in ${data.retryAfterSeconds}s`,
          variant: "warning",
        });
      } else {
        notify({
          title: "Error",
          subtitle: data?.message ?? "Failed to resend OTP. Try again.",
          variant: "error",
        });
      }
    }
  };

  const initialValues = {
    mobile: initialMobile ?? "",
    otp: "",
    name: "",
    gender: "",
    city: "",
    area: "",
    pincode: "",
  };

  return {
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
  };
};
