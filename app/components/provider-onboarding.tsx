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
  Sheet,
} from "konsta/react";
import { IonIcon } from "@ionic/react";
import {
  arrowBack,
  cloudUploadOutline,
  documentOutline,
  checkmarkCircle,
} from "ionicons/icons";
import { useAppContext } from "../context/AppContext";

interface FilePickerCardProps {
  label: string;
  info?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}

interface ProviderOnboardingProps {
  opened: boolean;
  onClose: () => void;
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

const ProviderOnboarding = ({ opened, onClose }: ProviderOnboardingProps) => {
  const { setProviderStatus } = useAppContext();

  const [details, setDetails] = useState({
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
      onClose();
    }, 2000);
  };

  return (
    <Sheet
      opened={opened}
      onBackdropClick={isSubmitting ? undefined : onClose}
      className="pb-safe rounded-t-3xl"
    >
      <Page className="static bg-white">
        <Navbar
          title="Provider Onboarding"
          leftClassName="w-11"
          left={
            <Button clear onClick={onClose} disabled={isSubmitting}>
              <IonIcon icon={arrowBack} className="w-5 h-5" />
            </Button>
          }
        />

        <div className="overflow-y-auto max-h-[80vh] pb-10">
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

          <FilePickerCard
            label="iJamat Card (Optional)"
            info="Capture or upload photo"
            value={details.ijamat_doc_url}
            onChange={(e) =>
              setDetails({ ...details, ijamat_doc_url: e.target.value })
            }
          />

          <div className="mx-8 border-b border-slate-100 my-2" />

          <BlockTitle className="!text-slate-400 !text-xs !uppercase !tracking-widest !font-bold mt-4">
            Additional Information
          </BlockTitle>
          <List strongIos insetIos className="!mt-0">
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
          </List>

          <Block className="text-xs text-slate-500 pb-4">
            <p>
              Your documents are stored securely and only accessible to verified
              administrators. iJamat details are optional but help in faster
              verification.
            </p>
          </Block>

          <Block className="border-t border-t-slate-300 mt-4 absolute! bottom-0! mb-0! pb-4 w-full bg-white dark:bg-grey-800 pt-4">
            <div className="flex gap-3">
              <Button 
                clear 
                className="flex-1" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                large
                rounded
                className="flex-1 font-bold"
                onClick={handleSubmit}
                disabled={!details.aadhaar_doc_url.trim() || isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </Block>
        </div>
      </Page>
    </Sheet>
  );
};

export default ProviderOnboarding;
