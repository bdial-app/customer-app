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

  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

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
        notify({ title: "OTP Sent", subtitle: "OTP sent to your mobile number!" });
        startCooldown();
        setCurrentStep("otp");
      } else if (currentStep === "otp") {
        await verifyOtpMutation.mutateAsync({
          mobileNumber: values.mobile,
          otp: values.otp,
        });
        setCurrentStep("details");
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
    try {
      await createAccountMutation.mutateAsync({
        mobile: values.mobile,
        otp: values.otp,
        name: values.name,
        gender: values.gender,
        city: values.city,
        area: values.area,
        pincode: values.pincode,
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
      notify({ title: "OTP Sent", subtitle: "OTP resent to your mobile number!" });
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

  return { currentStep, isLoading, resendCooldown, initialValues, handleBack, handleNext, handleResendOtp, handleSubmit };
};
