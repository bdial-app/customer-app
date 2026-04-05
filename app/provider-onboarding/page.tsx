"use client";
import { useState } from "react";
import {
  List,
  ListInput,
  Button,
  Block,
  BlockTitle,
  Navbar,
  Page,
  Segmented,
  SegmentedButton,
} from "konsta/react";
import { IonIcon } from "@ionic/react";
import { arrowBack, cloudUploadOutline, checkmarkCircle } from "ionicons/icons";
import { useAppContext } from "../context/AppContext";
import { useRouter } from "next/navigation";
import TimePicker from "../components/time-picker";
import { Formik, Form, useFormikContext } from "formik";
import * as Yup from "yup";
import { FormikInput } from "../components/formik-input";

const validationSchemas = {
  1: Yup.object({
    brand_name: Yup.string().required("Required"),
    contact_number: Yup.string().required("Required"),
    description: Yup.string().required("Required"),
    city: Yup.string().required("Required"),
    address: Yup.string().required("Required"),
    area: Yup.string().required("Required"),
    pincode: Yup.string()
      .matches(/^\d{6}$/, "Must be 6 digits")
      .required("Required"),
  }),
  2: Yup.object({
    aadhaar_doc_url: Yup.string().required("Required"),
  }),
};

interface FilePickerCardProps {
  label: string;
  info?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}

const FilePickerCard = ({
  label,
  info,
  value,
  onChange,
  required,
}: FilePickerCardProps) => {
  return (
    <div className="px-4 py-2">
      <div className="text-xs font-semibold text-slate-500 mb-2 px-1 uppercase tracking-wider flex items-center justify-between">
        <span>{label}</span>
        {required && (
          <span className="text-red-500 text-[10px] bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
            Required
          </span>
        )}
      </div>
      <label className="relative flex flex-col items-center justify-center w-full min-h-[120px] rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer overflow-hidden group">
        <input
          type="file"
          className="absolute inset-0 opacity-0 cursor-pointer"
          onChange={onChange}
        />

        {value ? (
          <div className="flex flex-col items-center gap-2 p-4 animate-in zoom-in-95 duration-200">
            <div className="p-3 aspect-square grid place-content-center rounded-full text-green-600 shadow-sm border border-green-200">
              <IonIcon icon={checkmarkCircle} className="text-3xl" />
            </div>
            <div className="text-sm font-semibold text-slate-800">
              Document Uploaded
            </div>
            <div className="text-[10px] text-slate-500 bg-white px-2 py-1 rounded shadow-xs border border-slate-100 max-w-[200px] truncate">
              {value.split("\\").pop()}
            </div>
            <div className="mt-2 px-4 py-1.5 rounded-full bg-slate-100 text-indigo-600 text-[11px] font-bold border border-slate-200 active:scale-95 transition-transform">
              Replace Document
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 p-4">
            <div className="p-3 bg-white rounded-2xl text-indigo-500 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform duration-200">
              <IonIcon icon={cloudUploadOutline} className="text-3xl" />
            </div>
            <div className="text-sm font-semibold text-slate-700">
              Tap to upload
            </div>
            {info && (
              <div className="text-[10px] text-slate-400 font-medium">
                {info}
              </div>
            )}
          </div>
        )}
      </label>
    </div>
  );
};

const ProviderOnboardingPage = () => {
  const { setProviderStatus } = useAppContext();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (values: any) => {
    setIsSubmitting(true);
    // Simulate API Call
    setTimeout(() => {
      console.log("Submitting:", values);
      setProviderStatus("pending");
      setIsSubmitting(false);
      router.back();
    }, 2000);
  };

  const handleNext = async (validateForm: any, setTouched: any) => {
    const errors = await validateForm();
    if (Object.keys(errors).length === 0) {
      if (currentStep < 2) setCurrentStep((prev) => (prev + 1) as 1 | 2);
    } else {
      const touchedFields = Object.keys(errors).reduce((acc, current) => {
        acc[current] = true;
        return acc;
      }, {} as any);
      setTouched(touchedFields);
    }
  };

  const handleBack = () => {
    if (isSubmitting) return;

    if (currentStep > 1) {
      setCurrentStep(1);
    } else {
      router.back();
    }
  };

  return (
    <Page>
      <Navbar
        title="Provider Onboarding"
        leftClassName="w-11"
        left={
          <Button clear onClick={handleBack} disabled={isSubmitting}>
            <IonIcon icon={arrowBack} className="w-5 h-5" />
          </Button>
        }
      />

      <Formik
        initialValues={{
          brand_name: "",
          description: "",
          address: "",
          city: "",
          area: "",
          pincode: "",
          contact_number: "",
          open_time: "",
          close_time: "",
          profile_photo_url: "",
          aadhaar_doc_url: "",
          ijamat_number: "",
          ijamat_expiry: "",
          ijamat_doc_url: "",
        }}
        validationSchema={validationSchemas[currentStep]}
        onSubmit={handleSubmit}
      >
        {({
          values,
          setFieldValue,
          isValid,
          dirty,
          validateForm,
          setTouched,
        }) => {
          const isStep1Valid = Boolean(
            values.brand_name.trim() &&
            values.description.trim() &&
            values.address.trim() &&
            values.city.trim() &&
            values.contact_number.trim() &&
            values.area.trim() &&
            values.pincode.trim(),
          );
          const isStep2Valid = Boolean(values.aadhaar_doc_url.trim());

          return (
            <Form className="contents">
              <StepIndicator
                currentStep={currentStep}
                setCurrentStep={setCurrentStep}
                isSubmitting={isSubmitting}
                isStep1Valid={isStep1Valid}
              />

              <div className="overflow-y-auto max-h-[calc(100vh-220px)] pb-32">
                {currentStep === 1 ? (
                  <>
                    <BlockTitle>Provider Information</BlockTitle>
                    <List strongIos insetIos>
                      <FormikInput
                        name="brand_name"
                        label="Brand Name"
                        type="text"
                        placeholder="e.g. Babji's Catering"
                      />
                      <FormikInput
                        name="description"
                        label="Description"
                        type="textarea"
                        placeholder="Tell us about your services..."
                      />
                      <FormikInput
                        name="contact_number"
                        label="Contact Number"
                        type="tel"
                        placeholder="e.g. 9876543210"
                        formatValue={(val) =>
                          val.replace(/\D/g, "").slice(0, 10)
                        }
                      />
                    </List>

                    <BlockTitle>Location Details</BlockTitle>
                    <List strongIos insetIos>
                      <FormikInput
                        name="address"
                        label="Address"
                        type="text"
                        placeholder="Shop address or locality"
                      />
                      <div className="flex">
                        <FormikInput
                          name="city"
                          label="City"
                          type="text"
                          placeholder="e.g. Pune"
                        />
                        <FormikInput
                          name="pincode"
                          label="Pincode"
                          type="text"
                          placeholder="411001"
                        />
                      </div>
                      <FormikInput
                        name="area"
                        label="Area"
                        type="text"
                        placeholder="e.g. Yerawada"
                      />
                    </List>

                    <BlockTitle className="!text-slate-400 !text-xs !uppercase !tracking-widest !font-bold mt-4">
                      Business Hours
                    </BlockTitle>
                    <List strongIos insetIos className="!mt-0">
                      <TimePicker
                        label="Open Time"
                        value={values.open_time}
                        onChange={(val) => setFieldValue("open_time", val)}
                      />
                      <TimePicker
                        label="Close Time"
                        value={values.close_time}
                        onChange={(val) => setFieldValue("close_time", val)}
                      />
                    </List>
                  </>
                ) : (
                  <>
                    <BlockTitle className="!text-slate-400 !text-xs !uppercase !tracking-widest !font-bold pt-4">
                      Verification Documents
                    </BlockTitle>

                    <FilePickerCard
                      label="Aadhaar Card"
                      info="JPEG, PNG or PDF (Max 5MB)"
                      required
                      value={values.aadhaar_doc_url}
                      onChange={(e) =>
                        setFieldValue("aadhaar_doc_url", e.target.value)
                      }
                    />

                    <Block className="text-xs text-slate-500 pb-4">
                      <p>
                        Your documents are stored securely and only accessible
                        to verified administrators. iJamat details are optional
                        but help in faster verification.
                      </p>
                    </Block>
                  </>
                )}
              </div>

              <Block className="fixed bottom-0 left-0 pb-safe w-full pt-4 px-4 my-4! z-10">
                <div className="flex gap-3 pb-4">
                  {currentStep === 1 ? (
                    <>
                      <Button
                        large
                        rounded
                        clear
                        className="flex-1"
                        onClick={handleBack}
                        disabled={isSubmitting}
                        type="button"
                      >
                        Cancel
                      </Button>
                      <Button
                        large
                        rounded
                        className="flex-1"
                        onClick={() => handleNext(validateForm, setTouched)}
                        disabled={!isStep1Valid || isSubmitting}
                        type="button"
                      >
                        Next
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        large
                        rounded
                        clear
                        className="flex-1"
                        onClick={handleBack}
                        disabled={isSubmitting}
                        type="button"
                      >
                        Back
                      </Button>
                      <Button
                        large
                        rounded
                        className="flex-1"
                        type="submit"
                        disabled={!isStep2Valid || isSubmitting}
                      >
                        {isSubmitting ? "Submitting..." : "Submit"}
                      </Button>
                    </>
                  )}
                </div>
              </Block>
            </Form>
          );
        }}
      </Formik>
    </Page>
  );
};

export default ProviderOnboardingPage;

const StepIndicator = ({
  currentStep,
  setCurrentStep,
  isSubmitting,
  isStep1Valid,
}: {
  currentStep: 1 | 2;
  setCurrentStep: (step: 1 | 2) => void;
  isSubmitting: boolean;
  isStep1Valid: boolean;
}) => (
  <div className="px-4 py-4">
    <Segmented strong rounded>
      <SegmentedButton
        active={currentStep === 1}
        onClick={() => setCurrentStep(1)}
        disabled={isSubmitting}
      >
        1. Details
      </SegmentedButton>
      <SegmentedButton
        active={currentStep === 2}
        onClick={() => isStep1Valid && setCurrentStep(2)}
        disabled={!isStep1Valid || isSubmitting}
      >
        2. Documents
      </SegmentedButton>
    </Segmented>
  </div>
);
