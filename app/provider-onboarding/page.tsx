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
            <div className="p-3 bg-green-100 rounded-full text-green-600 shadow-sm border border-green-200">
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

  const [currentStep, setCurrentStep] = useState(1);
  const [details, setDetails] = useState({
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
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    setIsSubmitting(true);
    // Simulate API Call
    setTimeout(() => {
      setProviderStatus("pending");
      setIsSubmitting(false);
      router.back();
    }, 2000);
  };

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (isSubmitting) return;

    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const isStep1Valid = Boolean(
    details.brand_name.trim() &&
    details.city.trim() &&
    details.contact_number.trim()
  );

  const isStep2Valid = Boolean(details.aadhaar_doc_url.trim());

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
              <ListInput
                label="Brand Name"
                type="text"
                placeholder="e.g. Arbaj's Catering"
                required
                value={details.brand_name}
                onChange={(e) =>
                  setDetails({ ...details, brand_name: e.target.value })
                }
              />
              <ListInput
                label="Description"
                type="textarea"
                placeholder="Tell us about your services..."
                value={details.description}
                onChange={(e) =>
                  setDetails({ ...details, description: e.target.value })
                }
              />
              <ListInput
                label="Contact Number"
                type="tel"
                placeholder="e.g. +91 9876543210"
                required
                value={details.contact_number}
                onChange={(e) =>
                  setDetails({ ...details, contact_number: e.target.value })
                }
              />
            </List>

            <BlockTitle>Location Details</BlockTitle>
            <List strongIos insetIos>
              <ListInput
                label="Address"
                type="text"
                placeholder="Shop address or locality"
                value={details.address}
                onChange={(e) =>
                  setDetails({ ...details, address: e.target.value })
                }
              />
              <div className="flex">
                <ListInput
                  label="City"
                  type="text"
                  placeholder="e.g. Pune"
                  required
                  className="flex-1"
                  value={details.city}
                  onChange={(e) =>
                    setDetails({ ...details, city: e.target.value })
                  }
                />
                <ListInput
                  label="Pincode"
                  type="text"
                  placeholder="411001"
                  className="w-1/3"
                  value={details.pincode}
                  onChange={(e) =>
                    setDetails({ ...details, pincode: e.target.value })
                  }
                />
              </div>
              <ListInput
                label="Area"
                type="text"
                placeholder="e.g. Yerawada"
                value={details.area}
                onChange={(e) =>
                  setDetails({ ...details, area: e.target.value })
                }
              />
            </List>

            <BlockTitle className="!text-slate-400 !text-xs !uppercase !tracking-widest !font-bold mt-4">
              Business Hours
            </BlockTitle>
            <List strongIos insetIos className="!mt-0">
              <TimePicker
                label="Open Time"
                value={details.open_time}
                onChange={(val) => setDetails({ ...details, open_time: val })}
              />
              <TimePicker
                label="Close Time"
                value={details.close_time}
                onChange={(val) => setDetails({ ...details, close_time: val })}
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
              value={details.aadhaar_doc_url}
              onChange={(e) =>
                setDetails({ ...details, aadhaar_doc_url: e.target.value })
              }
            />

            {/* COMMENTED FOR FUTURE USE_ DONT REMOVE - ARBAJ */}
            {/* <FilePickerCard
              label="iJamat Card (Optional)"
              info="Capture or upload photo"
              value={details.ijamat_doc_url}
              onChange={(e) =>
                setDetails({ ...details, ijamat_doc_url: e.target.value })
              }
            /> */}

            {/* <div className="mx-8 border-b border-slate-100 my-2" /> */}

            {/* <BlockTitle className="!text-slate-400 !text-xs !uppercase !tracking-widest !font-bold mt-4">
              Additional Information
            </BlockTitle> */}
            {/* <List strongIos insetIos className="!mt-0">
              <ListInput
                label="iJamat Number (Optional)"
                type="text"
                placeholder="e.g. 12345678"
                value={details.ijamat_number}
                onChange={(e) =>
                  setDetails({ ...details, ijamat_number: e.target.value })
                }
              />
              <ListInput
                label="iJamat Expiry (Optional)"
                type="date"
                placeholder="Select date"
                value={details.ijamat_expiry}
                onChange={(e) =>
                  setDetails({ ...details, ijamat_expiry: e.target.value })
                }
              />
            </List> */}

            <Block className="text-xs text-slate-500 pb-4">
              <p>
                Your documents are stored securely and only accessible to
                verified administrators. iJamat details are optional but help in
                faster verification.
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
              >
                Cancel
              </Button>
              <Button
                large
                rounded
                onClick={handleNext}
                disabled={!isStep1Valid || isSubmitting}
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
              >
                Back
              </Button>
              <Button
                large
                rounded
                className="flex-1"
                onClick={handleSubmit}
                disabled={!isStep2Valid || isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </>
          )}
        </div>
      </Block>
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
  currentStep: number;
  setCurrentStep: (step: number) => void;
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
