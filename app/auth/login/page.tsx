"use client";
import {
  BlockTitle,
  List,
  ListInput,
  Page,
  Block,
  Button,
  Preloader,
  Navbar,
} from "konsta/react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ROUTE_PATH } from "@/utils/contants";

import { Formik, Form } from "formik";
import * as Yup from "yup";
import { FormikInput } from "@/app/components/formik-input";
import { useSendOtp, useVerifyOtp } from "@/hooks/useAuth";
import { useNotification } from "@/app/context/NotificationContext";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/hooks/useAppStore";
import { setSkippedAuth } from "@/store/slices/authSlice";

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

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { notify } = useNotification();
  const [currentStep, setCurrentStep] = useState<LoginStep>("mobile");

  const sendOtpMutation = useSendOtp();
  const verifyOtpMutation = useVerifyOtp();

  const isLoading = sendOtpMutation.isPending || verifyOtpMutation.isPending;

  const handleBack = (setFieldValue: any) => {
    setCurrentStep("mobile");
    setFieldValue("otp", "");
  };

  const handleNext = async (
    validateForm: any,
    setTouched: any,
    values: any,
  ) => {
    const errors = await validateForm();
    if (Object.keys(errors).length === 0) {
      try {
        if (currentStep === "mobile") {
          const res: any = await sendOtpMutation.mutateAsync({
            mobileNumber: values.mobile,
          });
          const otp = res?.data?.otp || res?.otp;
          notify({
            title: "OTP Sent " + (otp || ""),
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
      // Mark all fields touched
      const touchedFields = Object.keys(errors).reduce((acc, current) => {
        acc[current] = true;
        return acc;
      }, {} as any);
      setTouched(touchedFields);
    }
  };

  return (
    <Page
      className="flex flex-col justify-end"
      style={{
        background: "radial-gradient(at 0% 10%, #f0eff4, #f0ecff)",
      }}
    >
      <Navbar
        right={
          <p className="min-w-18 text-center">
            <Link
              href={ROUTE_PATH.HOME}
              onClick={() => dispatch(setSkippedAuth(true))}
            >
              Skip
            </Link>
          </p>
        }
      />

      <Image src="/login-card.png" fill objectFit="contain" alt="Logo" />
      <Block className="mb-auto flex items-center gap-2 mb-0">
        <Image src="/vercel.svg" width={24} height={24} alt="Vercel Logo" />
        <p className="text-lg">Brand Name</p>
      </Block>

      <Block>
        <h2 className="text-4xl font-bold">
          <span className="text-primary">Let's Grow together,</span> <br /> as
          always {";)"}
        </h2>
      </Block>

      <BlockTitle className="mt-auto z-10">Login</BlockTitle>
      <Block className="mb-0">
        <p>Donec et nulla auctor massa pharetra adipiscing ut sit amet sem.</p>
      </Block>
      <Formik
        initialValues={{
          mobile: "",
          otp: "",
        }}
        validationSchema={validationSchemas[currentStep]}
        onSubmit={(values) => {
          // Not using form submit here, handled by handleNext
        }}
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
            <List strongIos insetIos>
              {currentStep === "mobile" && (
                <FormikInput
                  media="+91"
                  name="mobile"
                  label="Mobile Number"
                  type="tel"
                  placeholder="e.g. 9876543210"
                  info="Enter 10 digit mobile number"
                  formatValue={(val) => val.replace(/\D/g, "").slice(0, 10)}
                />
              )}

              {currentStep === "otp" && (
                <FormikInput
                  name="otp"
                  label="OTP"
                  type="tel"
                  placeholder="e.g. 1234"
                  info="Enter 6 digit OTP sent to your mobile"
                  formatValue={(val) => val.replace(/\D/g, "").slice(0, 6)}
                />
              )}
            </List>

            <Block>
              {currentStep === "mobile" && (
                <Button
                  large
                  rounded
                  onClick={() => handleNext(validateForm, setTouched, values)}
                  disabled={!isValid || !dirty || isLoading}
                  type="button"
                  className="!text-black"
                >
                  {isLoading ? <Preloader className="w-5 h-5" /> : "Get OTP"}
                </Button>
              )}

              {currentStep === "otp" && (
                <div className="flex gap-2">
                  <Button
                    large
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
                    disabled={!isValid || !dirty || isLoading}
                    className="flex-1 !text-black"
                    type="button"
                    onClick={() => handleNext(validateForm, setTouched, values)}
                  >
                    {isLoading ? (
                      <Preloader className="w-5 h-5" />
                    ) : (
                      "Verify OTP"
                    )}
                  </Button>
                </div>
              )}
            </Block>

            <Block className="my-0 text-center mb-4">
              <p>
                Don't have an account?{" "}
                <Link
                  href={ROUTE_PATH.CREATE_ACCOUNT}
                  className="text-blue-600"
                >
                  Create Account
                </Link>
              </p>
            </Block>
          </Form>
        )}
      </Formik>
    </Page>
  );
}
