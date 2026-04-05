"use client"
import { BlockTitle, List, ListInput, Page, Block, Button, Preloader, Navbar } from "konsta/react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ROUTE_PATH } from "@/utils/contants";

import { Formik, Form } from "formik";
import * as Yup from "yup";
import { FormikInput } from "@/app/components/formik-input";

type LoginStep = "mobile" | "otp";

const validationSchemas = {
  mobile: Yup.object({
    mobile: Yup.string()
      .matches(/^\d{10}$/, "Please enter valid 10 digit mobile number")
      .required("Required"),
  }),
  otp: Yup.object({
    otp: Yup.string()
      .matches(/^\d{4}$/, "Please enter 4 digit OTP")
      .required("Required"),
  }),
};

export default function LoginPage() {
  const [currentStep, setCurrentStep] = useState<LoginStep>("mobile");

  const handleBack = (setFieldValue: any) => {
    setCurrentStep("mobile");
    setFieldValue("otp", "");
  };

  const handleNext = async (validateForm: any, setTouched: any) => {
    const errors = await validateForm();
    if (Object.keys(errors).length === 0) {
      if (currentStep === "mobile") setCurrentStep("otp");
    } else {
      // Mark all fields touched
      const touchedFields = Object.keys(errors).reduce((acc, current) => {
        acc[current] = true;
        return acc;
      }, {} as any);
      setTouched(touchedFields);
    }
  };

    return <Page className="flex flex-col justify-end" style={{
        background: 'radial-gradient(at 0% 10%, #f0eff4, #f0ecff)',

    }}>

        <Navbar right={<p className="min-w-18 text-center"><Link href={ROUTE_PATH.HOME}>Skip</Link></p>}
        />

        <Image src="/login-card.png" fill objectFit="contain" alt="Logo" />
        <Block className="mb-auto flex items-center gap-2 mb-0">
            <Image src="/vercel.svg" width={24} height={24} alt="Vercel Logo" />
            <p className="text-lg">Brand Name</p>

        </Block>

        <Block>
            <h2 className="text-4xl font-bold"><span className="text-primary">Let's Grow together,</span> <br /> as always {";)"}</h2>
        </Block>

        <BlockTitle className="mt-auto z-10">Login</BlockTitle>
        <Block className="mb-0">
            <p>
                Donec et nulla auctor massa pharetra adipiscing ut sit amet sem.
            </p>
        </Block>
        <Formik
            initialValues={{
                mobile: "",
                otp: "",
            }}
            validationSchema={validationSchemas[currentStep]}
            onSubmit={(values) => {
                console.log("Logging in with:", values);
            }}
        >
            {({ isValid, validateForm, setTouched, setFieldValue, dirty }) => (
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
                                info="Enter 4 digit OTP sent to your mobile"
                                formatValue={(val) => val.replace(/\D/g, "").slice(0, 4)}
                            />
                        )}
                    </List>

                    <Block>
                        {currentStep === "mobile" && (
                            <Button
                                large
                                rounded
                                onClick={() => handleNext(validateForm, setTouched)}
                                disabled={!isValid || !dirty}
                                type="button"
                            >
                                Get OTP
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
                                >
                                    Back
                                </Button>
                                <Button
                                    large
                                    rounded
                                    disabled={!isValid || !dirty}
                                    className="flex-1"
                                    type="submit"
                                >
                                    Verify OTP
                                </Button>
                            </div>
                        )}
                    </Block>

                    <Block className="my-0 text-center mb-4">
                        <p>Don't have an account? <Link href={ROUTE_PATH.CREATE_ACCOUNT} className="text-blue-600">Create Account</Link></p>
                    </Block>
                </Form>
            )}
        </Formik>
    </Page>;
}