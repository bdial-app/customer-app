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
import Image from "next/image";
import Link from "next/link";
import { ROUTE_PATH } from "@/utils/contants";
import { Formik, Form, useFormikContext } from "formik";
import * as Yup from "yup";
import { FormikInput } from "@/app/components/formik-input";
import { useCreateAccount } from "@/hooks/useCreateAccount";

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

  return (
    <Page
      className="flex flex-col justify-end"
      style={{ background: "radial-gradient(at 0% 10%, #f0eff4, #f0ecff)" }}
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
                <>
                  <FormikInput
                    name="otp"
                    label="OTP"
                    type="tel"
                    placeholder="e.g. 123456"
                    info="Enter 6 digit OTP sent to your mobile"
                    formatValue={(val) => val.replace(/\D/g, "").slice(0, 6)}
                  />
                  <div className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() =>
                        handleResendOtp(values.mobile, setFieldValue)
                      }
                      disabled={resendCooldown > 0 || isLoading}
                      className="text-sm text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      {resendCooldown > 0
                        ? `Resend OTP in ${resendCooldown}s`
                        : "Resend OTP"}
                    </button>
                  </div>
                </>
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
                <div className="flex flex-col gap-4">
                  {/* Location Status Indicator */}
                  <div className={`p-3 rounded-lg border flex items-center justify-between ${location ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex flex-col">
                      <span className={`text-xs font-bold ${location ? 'text-green-700' : 'text-red-700'}`}>
                        {location ? '✓ Geolocation Secured' : '✗ Location Required'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {location ? 'Your coordinates have been pinned.' : 'Please allow location access to continue.'}
                      </span>
                    </div>
                    {!location && (
                      <Button small outline rounded className="w-fit text-[10px] h-7" onClick={requestLocation} type="button">
                        Retry
                      </Button>
                    )}
                  </div>

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
