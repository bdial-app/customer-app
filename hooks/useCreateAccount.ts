import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ROUTE_PATH } from "@/utils/contants";
import { useSendOtp, useVerifyOtp, useCreateAccountMutation } from "./useAuth";
import { useNotification } from "@/app/context/NotificationContext";

export type CreateAccountStep = "mobile" | "otp" | "details";

export const useCreateAccount = () => {
  const router = useRouter();
  const { notify } = useNotification();
  const [currentStep, setCurrentStep] = useState<CreateAccountStep>("mobile");
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

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      notify({
        title: "Geolocation Error",
        subtitle: "Your browser does not support geolocation.",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        notify({
          title: "Location Secured",
          subtitle: "We've accurately pinned your location.",
        });
      },
      (error) => {
        let message = "Please enable location to complete registration.";
        if (error.code === error.PERMISSION_DENIED) {
          message =
            "Location access denied. Please enable it in browser settings and try again.";
        }
        notify({
          title: "Location Required",
          subtitle: message,
        });
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [notify]);

  useEffect(
    () => () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    },
    [],
  );

  useEffect(() => {
    if (currentStep === "details" && !location) {
      requestLocation();
    }
  }, [currentStep, location, requestLocation]);

  const sendOtpMutation = useSendOtp();
  const verifyOtpMutation = useVerifyOtp();
  const createAccountMutation = useCreateAccountMutation();

  const isLoading =
    sendOtpMutation.isPending ||
    verifyOtpMutation.isPending ||
    createAccountMutation.isPending;

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
        await sendOtpMutation.mutateAsync({ mobileNumber: values.mobile });
        notify({
          title: "OTP Sent",
          subtitle: "OTP sent to your mobile number!",
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
      });
    }
  };

  const handleSubmit = async (values: any) => {
    if (!location) {
      notify({
        title: "Location Required",
        subtitle:
          "We need your geolocation to complete registration. Please allow access.",
      });
      requestLocation();
      return;
    }

    try {
      await createAccountMutation.mutateAsync({
        name: values.name,
        gender: values.gender,
        city: values.city,
        area: values.area,
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
      });
    }
  };

  const handleResendOtp = async (
    mobile: string,
    setFieldValue: (field: string, value: any) => void,
  ) => {
    if (resendCooldown > 0) return;
    try {
      await sendOtpMutation.mutateAsync({ mobileNumber: mobile });
      setFieldValue("otp", "");
      notify({
        title: "OTP Sent",
        subtitle: "OTP resent to your mobile number!",
      });
      startCooldown();
    } catch (err: any) {
      notify({
        title: "Error",
        subtitle:
          err?.response?.data?.message ?? "Failed to resend OTP. Try again.",
      });
    }
  };

  const initialValues = {
    mobile: "",
    otp: "",
    name: "",
    gender: "male",
    city: "",
    area: "",
    pincode: "",
  };

  return {
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
  };
};
