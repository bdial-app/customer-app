"use client";
import {
  BlockTitle,
  List,
  Page,
  Block,
  Button,
  Preloader,
  Navbar,
} from "konsta/react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROUTE_PATH } from "@/utils/contants";

import { Formik, Form, useFormikContext } from "formik";
import * as Yup from "yup";
import { FormikInput } from "@/app/components/formik-input";
import { useSendOtp, useVerifyOtp, useCreateAccount } from "@/hooks/useAuth";
import { useNotification } from "@/app/context/NotificationContext";

type CreateAccountStep = "mobile" | "otp" | "details";

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
      .required("Full name is required"),
    city: Yup.string().required("City is required"),
    pincode: Yup.string()
      .matches(/^\d{6}$/, "Please enter valid 6 digit pincode")
      .required("Required"),
    area: Yup.string(),
    gender: Yup.string(),
  }),
};

const GenderSelector = () => {
  const { values, setFieldValue } = useFormikContext<any>();
  return (
    <div className="px-4 py-2">
      <label className="block text-xs text-gray-500 mb-2">Gender</label>
      <div className="flex gap-2">
        {["male", "female", "other"].map((g) => (
          <Button
            key={g}
            rounded
            outline={values.gender !== g}
            onClick={() => setFieldValue("gender", g)}
            className="flex-1"
            type="button"
          >
            {g.charAt(0).toUpperCase() + g.slice(1)}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default function CreateAccountPage() {
  const router = useRouter();
  const { notify } = useNotification();
  const [currentStep, setCurrentStep] = useState<CreateAccountStep>("mobile");

  const sendOtpMutation = useSendOtp();
  const verifyOtpMutation = useVerifyOtp();
  const createAccountMutation = useCreateAccount();

  const isLoading =
    sendOtpMutation.isPending ||
    verifyOtpMutation.isPending ||
    createAccountMutation.isPending;

  const handleBack = (setFieldValue: any) => {
    if (currentStep === "otp") {
      setCurrentStep("mobile");
      setFieldValue("otp", "");
    } else if (currentStep === "details") {
      setCurrentStep("otp");
    }
  };

  const handleNext = async (
    validateForm: any,
    setTouched: any,
    values: any,
  ) => {
    setApiError(null);
    const errors = await validateForm();
    if (Object.keys(errors).length > 0) {
      const touchedFields = Object.keys(errors).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {} as any);
      setTouched(touchedFields);
      return;
    }

    try {
      if (currentStep === "mobile") {
        await sendOtpMutation.mutateAsync({ mobileNumber: values.mobile });
        notify({
          title: "OTP Sent",
          subtitle: "OTP sent to your mobile number!",
        });
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
            <Link href={ROUTE_PATH.HOME}>Skip</Link>
          </p>
        }
      />
      <Image src="/login-card.png" fill objectFit="contain" alt="Logo" />

      <Block className="mb-auto flex items-center gap-2 mb-0">
        <Image src="/vercel.svg" width={24} height={24} alt="Vercel Logo" />
        <p className="text-lg">Brand Name</p>
      </Block>

      <BlockTitle className="mt-auto z-10">Create Account</BlockTitle>
      <Block className="mb-0">
        <p>
          {currentStep === "mobile" &&
            "Enter your mobile number to get started"}
          {currentStep === "otp" &&
            "We've sent a verification code to your mobile"}
          {currentStep === "details" && "Tell us a bit about yourself"}
        </p>
      </Block>

      <Formik
        initialValues={{
          mobile: "",
          otp: "",
          name: "",
          gender: "male",
          city: "",
          area: "",
          pincode: "",
        }}
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
            <List strongIos insetIos>
              {currentStep === "mobile" && (
                <FormikInput
                  media={"+91"}
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
                  info="Enter 4 digit OTP sent to your mobile"
                  formatValue={(val) => val.replace(/\D/g, "").slice(0, 6)}
                />
              )}

              {currentStep === "details" && (
                <>
                  <FormikInput
                    name="name"
                    label="Full Name"
                    type="text"
                    placeholder="e.g. John Doe"
                  />
                  <GenderSelector />
                  <FormikInput
                    name="city"
                    label="City"
                    type="text"
                    placeholder="e.g. Mumbai"
                  />
                  <FormikInput
                    name="area"
                    label="Area"
                    type="text"
                    placeholder="e.g. Andheri West"
                  />
                  <FormikInput
                    name="pincode"
                    label="Pincode"
                    type="text"
                    placeholder="e.g. 400058"
                    formatValue={(val) => val.replace(/\D/g, "").slice(0, 6)}
                  />
                </>
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
                >
                  {isLoading ? <Preloader className="w-5 h-5" /> : "Get OTP"}
                </Button>
              )}

              {currentStep === "otp" && (
                <div className="flex gap-2">
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
                    disabled={!isValid || !dirty || isLoading}
                    className="flex-1"
                    onClick={() => handleNext(validateForm, setTouched, values)}
                    type="button"
                  >
                    {isLoading ? (
                      <Preloader className="w-5 h-5" />
                    ) : (
                      "Verify OTP"
                    )}
                  </Button>
                </div>
              )}

              {currentStep === "details" && (
                <div className="flex gap-2">
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
                    disabled={!isValid || !dirty || isLoading}
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
              )}
            </Block>

            <Block className="my-0 text-center mb-4">
              <p>
                Already have an account?{" "}
                <Link href={ROUTE_PATH.LOGIN} className="text-blue-600">
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
