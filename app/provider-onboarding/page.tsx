"use client";
import { useState, useEffect, useRef } from "react";
import {
  List,
  Button,
  Block,
  Navbar,
  Page,
} from "konsta/react";
import { IonIcon } from "@ionic/react";
import {
  arrowBack,
  cloudUploadOutline,
  checkmarkCircle,
  documentTextOutline,
  trashOutline,
  alertCircleOutline,
  timeOutline,
  checkmarkDoneCircleOutline,
  storefrontOutline,
  locationOutline,
  shieldCheckmarkOutline,
  imageOutline,
  informationCircleOutline,
  sparklesOutline,
  cardOutline,
  fingerPrintOutline,
  closeCircle,
} from "ionicons/icons";
import { useAppContext } from "../context/AppContext";
import { useRouter } from "next/navigation";
import TimePicker from "../components/time-picker";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { FormikInput } from "../components/formik-input";
import { useAppSelector } from "@/hooks/useAppStore";
import {
  becomeProvider,
  getMyProviderStatus,
} from "@/services/provider.service";
import { AppDialog } from "../components/app-dialog";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/jpg",
  "application/pdf",
];

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------
const step1Schema = Yup.object({
  brand_name: Yup.string().trim().required("Brand name is required"),
  description: Yup.string().trim().required("Description is required"),
  contact_number: Yup.string()
    .matches(/^\d{10}$/, "Enter a valid 10-digit mobile number")
    .required("Contact number is required"),
  city: Yup.string().trim().required("City is required"),
  address: Yup.string().trim().required("Address is required"),
  area: Yup.string().trim().required("Area is required"),
  pincode: Yup.string()
    .matches(/^\d{6}$/, "Pincode must be 6 digits")
    .required("Pincode is required"),
});

const step2Schema = Yup.object({
  identity_doc: Yup.mixed<File>()
    .nullable()
    .test("fileSize", "File must be less than 5 MB", (val) =>
      !val || (val instanceof File && val.size <= MAX_FILE_SIZE),
    )
    .test("fileType", "Only JPEG, PNG or PDF allowed", (val) =>
      !val || (val instanceof File && ALLOWED_FILE_TYPES.includes(val.type)),
    ),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ---------------------------------------------------------------------------
// Progress header
// ---------------------------------------------------------------------------
const ProgressHeader = ({
  currentStep,
  isStep1Valid,
  isSubmitting,
  onStepClick,
}: {
  currentStep: 1 | 2;
  isStep1Valid: boolean;
  isSubmitting: boolean;
  onStepClick: (step: 1 | 2) => void;
}) => {
  const steps = [
    { id: 1, label: "Business Details", icon: storefrontOutline },
    { id: 2, label: "Verification", icon: shieldCheckmarkOutline },
  ];

  return (
    <div className="px-4 pt-3 pb-4">
      <div className="flex items-center gap-0">
        {steps.map((step, idx) => {
          const isActive = currentStep === step.id;
          const isDone =
            currentStep > step.id ||
            (step.id === 1 && isStep1Valid && currentStep === 2);
          const canClick = step.id === 1 || (step.id === 2 && isStep1Valid);

          return (
            <div key={step.id} className="flex items-center flex-1">
              <button
                type="button"
                disabled={!canClick || isSubmitting}
                onClick={() =>
                  canClick &&
                  !isSubmitting &&
                  onStepClick(step.id as 1 | 2)
                }
                className="flex flex-col items-center gap-1.5 flex-1 disabled:opacity-50"
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isActive
                      ? "bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-200"
                      : isDone
                      ? "bg-green-500 border-green-500"
                      : "bg-white border-slate-200"
                  }`}
                >
                  {isDone && !isActive ? (
                    <IonIcon
                      icon={checkmarkCircle}
                      className="text-white text-lg"
                    />
                  ) : (
                    <IonIcon
                      icon={step.icon}
                      className={`text-lg ${
                        isActive ? "text-white" : "text-slate-400"
                      }`}
                    />
                  )}
                </div>
                <span
                  className={`text-[10px] font-semibold ${
                    isActive
                      ? "text-indigo-600"
                      : isDone
                      ? "text-green-600"
                      : "text-slate-400"
                  }`}
                >
                  {step.label}
                </span>
              </button>
              {idx < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-1 rounded-full transition-all duration-500 ${
                    isStep1Valid ? "bg-green-400" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------
const SectionHeader = ({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle?: string;
}) => (
  <div className="flex items-center gap-3 px-4 pt-4 pb-2">
    <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
      <IonIcon icon={icon} className="text-indigo-500 text-lg" />
    </div>
    <div>
      <p className="text-sm font-bold text-slate-800">{title}</p>
      {subtitle && (
        <p className="text-[11px] text-slate-400">{subtitle}</p>
      )}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Document type selector
// ---------------------------------------------------------------------------
const DOC_TYPES = [
  {
    id: "aadhaar",
    label: "Aadhaar Card",
    icon: fingerPrintOutline,
    color: "indigo",
    desc: "12-digit unique identity",
  },
  {
    id: "pan",
    label: "PAN Card",
    icon: cardOutline,
    color: "emerald",
    desc: "Permanent account number",
  },
  {
    id: "other",
    label: "Other ID Proof",
    icon: documentTextOutline,
    color: "amber",
    desc: "Passport, Voter ID, etc.",
  },
] as const;

type DocTypeId = (typeof DOC_TYPES)[number]["id"];

const DocumentTypeSelector = ({
  selected,
  onChange,
}: {
  selected: DocTypeId;
  onChange: (id: DocTypeId) => void;
}) => (
  <div className="px-4 pt-2 pb-1">
    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
      Select document type
    </p>
    <div className="grid grid-cols-3 gap-2">
      {DOC_TYPES.map((doc) => {
        const isActive = selected === doc.id;
        const colorMap: Record<
          string,
          { ring: string; bg: string; text: string; icon: string }
        > = {
          indigo: {
            ring: "ring-indigo-500 bg-indigo-50",
            bg: "bg-indigo-50",
            text: "text-indigo-700",
            icon: "text-indigo-500",
          },
          emerald: {
            ring: "ring-emerald-500 bg-emerald-50",
            bg: "bg-emerald-50",
            text: "text-emerald-700",
            icon: "text-emerald-500",
          },
          amber: {
            ring: "ring-amber-500 bg-amber-50",
            bg: "bg-amber-50",
            text: "text-amber-700",
            icon: "text-amber-500",
          },
        };
        const c = colorMap[doc.color];

        return (
          <button
            key={doc.id}
            type="button"
            onClick={() => onChange(doc.id)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all duration-200 active:scale-[0.97] ${
              isActive
                ? `ring-2 ${c.ring} border-transparent`
                : "border-slate-100 bg-white hover:border-slate-200"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isActive ? c.bg : "bg-slate-50"
              }`}
            >
              <IonIcon
                icon={doc.icon}
                className={`text-xl ${isActive ? c.icon : "text-slate-400"}`}
              />
            </div>
            <span
              className={`text-[10px] font-bold leading-tight text-center ${
                isActive ? c.text : "text-slate-500"
              }`}
            >
              {doc.label}
            </span>
          </button>
        );
      })}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Document file picker
// ---------------------------------------------------------------------------
interface DocFilePickerProps {
  file: File | null;
  error?: string;
  touched?: boolean;
  docType: DocTypeId;
  onChange: (file: File | null) => void;
}

const DocFilePicker = ({
  file,
  error,
  touched,
  docType,
  onChange,
}: DocFilePickerProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const hasError = touched && !!error;

  const docLabel =
    DOC_TYPES.find((d) => d.id === docType)?.label ?? "Document";

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(null);
  }, [file]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    onChange(selected);
    e.target.value = "";
  };

  return (
    <div className="px-4 py-2">
      {/* Always-mounted hidden input */}
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        className="hidden"
        onChange={handleChange}
      />

      {file ? (
        /* ---- File selected ---- */
        <div className="rounded-2xl border border-green-200 bg-gradient-to-b from-green-50/60 to-white overflow-hidden shadow-sm">
          {/* Preview area */}
          {preview ? (
            <div className="relative w-full h-44 bg-slate-100 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt={`${docLabel} preview`}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 bg-green-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                <IonIcon icon={checkmarkCircle} className="text-sm" />
                Uploaded
              </div>
              <button
                type="button"
                onClick={() => onChange(null)}
                className="absolute top-2 right-2 w-7 h-7 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-90 transition-transform"
              >
                <IonIcon icon={closeCircle} className="text-white text-lg" />
              </button>
            </div>
          ) : (
            <div className="relative w-full h-32 bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
              <div className="flex flex-col items-center gap-1.5 text-slate-400">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                  <IonIcon
                    icon={documentTextOutline}
                    className="text-3xl text-indigo-400"
                  />
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  PDF Document
                </span>
              </div>
              <div className="absolute top-2 left-2 bg-green-600/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                <IonIcon icon={checkmarkCircle} className="text-sm" />
                Uploaded
              </div>
              <button
                type="button"
                onClick={() => onChange(null)}
                className="absolute top-2 right-2 w-7 h-7 bg-black/20 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              >
                <IonIcon
                  icon={closeCircle}
                  className="text-slate-600 text-lg"
                />
              </button>
            </div>
          )}

          {/* File info bar */}
          <div className="flex items-center gap-3 p-3 border-t border-green-100">
            <div className="p-1.5 bg-green-100 rounded-lg shrink-0">
              <IonIcon
                icon={checkmarkCircle}
                className="text-green-600 text-lg"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">
                {file.name}
              </p>
              <p className="text-[10px] text-slate-500">
                {formatFileSize(file.size)} &bull;{" "}
                {file.type === "application/pdf" ? "PDF" : "Image"} &bull;{" "}
                {docLabel}
              </p>
            </div>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-full px-3 py-1.5 active:scale-95 transition-transform shrink-0"
            >
              Replace
            </button>
          </div>
        </div>
      ) : (
        /* ---- Empty / upload state ---- */
        <label
          className={`relative flex flex-col items-center justify-center w-full rounded-2xl border-2 border-dashed transition-all cursor-pointer group ${
            hasError
              ? "border-red-300 bg-red-50/40 min-h-[180px]"
              : "border-slate-200 bg-gradient-to-b from-slate-50/50 to-white hover:border-indigo-300 min-h-[180px]"
          }`}
        >
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={handleChange}
          />
          <div className="flex flex-col items-center gap-3 p-6 pointer-events-none">
            <div
              className={`p-4 rounded-2xl border transition-all duration-200 group-hover:scale-105 group-hover:shadow-md ${
                hasError
                  ? "bg-red-50 border-red-200 text-red-400"
                  : "bg-white border-slate-100 text-indigo-500 shadow-sm"
              }`}
            >
              <IonIcon icon={cloudUploadOutline} className="text-4xl" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                Upload {docLabel}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Take a photo or upload a scanned copy
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5 mt-1">
              {["JPEG", "PNG", "PDF"].map((f) => (
                <span
                  key={f}
                  className="text-[10px] bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full font-medium"
                >
                  {f}
                </span>
              ))}
              <span className="text-[10px] bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full font-medium">
                Max 5 MB
              </span>
            </div>
          </div>
        </label>
      )}

      {/* Validation error */}
      {hasError && (
        <div className="flex items-center gap-1.5 mt-2 px-1">
          <IonIcon
            icon={alertCircleOutline}
            className="text-red-500 text-sm shrink-0"
          />
          <p className="text-xs text-red-500 font-medium">{error}</p>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Document guidelines
// ---------------------------------------------------------------------------
const DocumentGuidelines = () => (
  <div className="mx-4 mt-3 space-y-3">
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-3">
        Document guidelines
      </p>
      <div className="space-y-2.5">
        {[
          "Document should be clearly visible and not blurred",
          "All four corners of the document must be visible",
          "File size should not exceed 5 MB",
          "Accepted: Aadhaar Card, PAN Card, Passport, Voter ID",
        ].map((text, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <div className="w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-[9px] font-bold text-indigo-600">
                {i + 1}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{text}</p>
          </div>
        ))}
      </div>
    </div>

    <div className="flex items-start gap-2.5 px-1">
      <IonIcon
        icon={shieldCheckmarkOutline}
        className="text-green-500 text-base shrink-0 mt-0.5"
      />
      <p className="text-[10px] text-slate-400 leading-relaxed">
        Your documents are encrypted end-to-end and stored securely. Only
        verified administrators can access them for identity verification.
      </p>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// What happens next
// ---------------------------------------------------------------------------
const WhatHappensNext = () => (
  <div className="mx-4 mt-4 mb-2 rounded-2xl border border-slate-100 bg-gradient-to-b from-slate-50/80 to-white p-4 shadow-sm">
    <div className="flex items-center gap-2 mb-3">
      <IonIcon
        icon={informationCircleOutline}
        className="text-indigo-400 text-lg"
      />
      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
        What happens next
      </p>
    </div>
    <div className="space-y-3">
      {[
        {
          step: "1",
          text: "Our team reviews your identity document",
          time: "Within 24 hrs",
        },
        {
          step: "2",
          text: "Your provider profile gets verified and activated",
          time: "1-2 business days",
        },
        {
          step: "3",
          text: "You receive a notification and can start listing services",
          time: "After approval",
        },
      ].map((item) => (
        <div key={item.step} className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
            {item.step}
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-700 font-medium">{item.text}</p>
            <p className="text-[10px] text-slate-400">{item.time}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Under-review / status page
// ---------------------------------------------------------------------------
const UnderReviewBanner = ({
  status,
  onGoBack,
}: {
  status: "pending" | "in_review" | "approved";
  onGoBack: () => void;
}) => {
  const config = {
    pending: {
      icon: timeOutline,
      iconBg: "bg-amber-50 border-amber-200",
      iconColor: "text-amber-500",
      title: "Application Submitted",
      subtitle:
        "Your application is in our queue and will be reviewed shortly. This usually takes 1-2 business days.",
      steps: [
        { label: "Application submitted", done: true },
        { label: "Identity verification in progress", done: false },
        { label: "Approval & account activation", done: false },
      ],
    },
    in_review: {
      icon: shieldCheckmarkOutline,
      iconBg: "bg-blue-50 border-blue-200",
      iconColor: "text-blue-500",
      title: "Under Active Review",
      subtitle:
        "Our team is currently verifying your identity and documents. You'll hear from us soon.",
      steps: [
        { label: "Application submitted", done: true },
        { label: "Identity verification in progress", done: true },
        { label: "Approval & account activation", done: false },
      ],
    },
    approved: {
      icon: sparklesOutline,
      iconBg: "bg-green-50 border-green-200",
      iconColor: "text-green-500",
      title: "You're Approved!",
      subtitle:
        "Your provider account is active. Switch to Provider Mode from your profile to start listing services.",
      steps: [
        { label: "Application submitted", done: true },
        { label: "Identity verified", done: true },
        { label: "Account activated", done: true },
      ],
    },
  }[status];

  return (
    <Page>
      <Navbar
        title="Application Status"
        leftClassName="w-11"
        left={
          <Button clear onClick={onGoBack}>
            <IonIcon icon={arrowBack} className="w-5 h-5" />
          </Button>
        }
      />
      <div className="flex flex-col items-center px-6 pt-8 pb-8 gap-6">
        <div className={`p-5 rounded-full border-2 ${config.iconBg}`}>
          <IonIcon
            icon={config.icon}
            className={`text-5xl ${config.iconColor}`}
          />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            {config.title}
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
            {config.subtitle}
          </p>
        </div>

        <div className="w-full bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-0">
          {config.steps.map((s, i) => (
            <div key={i}>
              <div className="flex items-center gap-3 py-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 ${
                    s.done
                      ? "bg-green-500 border-green-500"
                      : "bg-white border-slate-200"
                  }`}
                >
                  {s.done && (
                    <IonIcon
                      icon={checkmarkDoneCircleOutline}
                      className="text-white text-xs"
                    />
                  )}
                </div>
                <p
                  className={`text-sm font-medium ${
                    s.done ? "text-slate-800" : "text-slate-400"
                  }`}
                >
                  {s.label}
                </p>
              </div>
              {i < config.steps.length - 1 && (
                <div className="ml-3 w-0.5 h-3 bg-slate-100 rounded-full" />
              )}
            </div>
          ))}
        </div>

        <div className="w-full bg-indigo-50 border border-indigo-100 rounded-2xl p-3 flex items-start gap-2">
          <IonIcon
            icon={informationCircleOutline}
            className="text-indigo-400 text-lg shrink-0 mt-0.5"
          />
          <p className="text-xs text-indigo-700 leading-relaxed">
            You can continue using the app as a customer while your application
            is being reviewed.
          </p>
        </div>

        <Button large rounded className="w-full" onClick={onGoBack}>
          Continue as Customer
        </Button>
      </div>
    </Page>
  );
};

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
const ProviderOnboardingPage = () => {
  const { providerStatus, setProviderStatus } = useAppContext();
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [docType, setDocType] = useState<DocTypeId>("aadhaar");
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const pendingSubmitRef = useRef<(() => void) | null>(null);

  // Fetch real provider status on mount
  useEffect(() => {
    let cancelled = false;
    const fetchStatus = async () => {
      try {
        const result = await getMyProviderStatus();
        if (!cancelled) setProviderStatus(result.providerStatus as any);
      } catch {
        // keep as not_applied
      } finally {
        if (!cancelled) setStatusLoading(false);
      }
    };
    fetchStatus();
    return () => {
      cancelled = true;
    };
  }, [setProviderStatus]);

  const alreadyApplied =
    providerStatus === "pending" ||
    providerStatus === "in_review" ||
    providerStatus === "approved";

  const handleBack = () => {
    if (isSubmitting) return;
    if (currentStep > 1) setCurrentStep(1);
    else router.back();
  };

  const handleNext = async (validateForm: any, setTouched: any) => {
    const errors = await validateForm();
    if (Object.keys(errors).length === 0) {
      setCurrentStep(2);
    } else {
      setTouched(
        Object.keys(errors).reduce(
          (acc, k) => ({ ...acc, [k]: true }),
          {} as any,
        ),
      );
    }
  };

  const handleSubmit = async (values: any) => {
    if (!user?.id) {
      setSubmitError("You must be logged in to become a provider.");
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await becomeProvider({
        userId: user.id,
        brandName: values.brand_name.trim(),
        description: values.description.trim(),
        contactNumber: `+91${values.contact_number.trim()}`,
        city: values.city.trim(),
        area: values.area.trim(),
        address: values.address.trim(),
        pincode: values.pincode.trim(),
        openTime: values.open_time || undefined,
        closeTime: values.close_time || undefined,
        aadhaarFile: values.identity_doc || undefined,
      });
      // If user uploaded doc → pending verification; if skipped → approved (unverified)
      setProviderStatus(values.identity_doc ? "pending" : "approved");
    } catch (err: any) {
      const message =
        err?.response?.data?.message ??
        err?.message ??
        "Something went wrong. Please try again.";
      setSubmitError(
        Array.isArray(message) ? message.join(", ") : message,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading
  if (statusLoading) {
    return (
      <Page>
        <Navbar title="Become a Provider" />
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
          <div className="w-8 h-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Checking your status...</p>
        </div>
      </Page>
    );
  }

  // Already applied
  if (alreadyApplied) {
    return (
      <UnderReviewBanner
        status={providerStatus as "pending" | "in_review" | "approved"}
        onGoBack={() => router.back()}
      />
    );
  }

  return (
    <Page>
      <Navbar
        title="Become a Provider"
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
          identity_doc: null as File | null,
        }}
        validationSchema={currentStep === 1 ? step1Schema : step2Schema}
        onSubmit={handleSubmit}
        validateOnChange={false}
        validateOnBlur
      >
        {({
          values,
          setFieldValue,
          validateForm,
          setTouched,
          errors,
          touched,
          submitForm,
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
          const isStep2Valid = values.identity_doc instanceof File;

          return (
            <Form className="contents">
              <ProgressHeader
                currentStep={currentStep}
                isStep1Valid={isStep1Valid}
                isSubmitting={isSubmitting}
                onStepClick={setCurrentStep}
              />

              <div className="overflow-y-auto max-h-[calc(100vh-200px)] pb-36">
                {currentStep === 1 ? (
                  <>
                    {/* Tip banner */}
                    <div className="mx-4 mb-3 p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-start gap-2.5">
                      <IonIcon
                        icon={sparklesOutline}
                        className="text-indigo-500 text-lg shrink-0 mt-0.5"
                      />
                      <p className="text-xs text-indigo-700 leading-relaxed">
                        Fill in your business details below. Accurate
                        information helps customers find and trust your
                        services.
                      </p>
                    </div>

                    <SectionHeader
                      icon={storefrontOutline}
                      title="Business Information"
                      subtitle="Tell customers about your brand"
                    />
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
                        placeholder="10-digit mobile number"
                        formatValue={(val) =>
                          val.replace(/\D/g, "").slice(0, 10)
                        }
                      />
                    </List>

                    <SectionHeader
                      icon={locationOutline}
                      title="Location Details"
                      subtitle="Help customers find you"
                    />
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
                          formatValue={(val) =>
                            val.replace(/\D/g, "").slice(0, 6)
                          }
                        />
                      </div>
                      <FormikInput
                        name="area"
                        label="Area / Locality"
                        type="text"
                        placeholder="e.g. Yerawada"
                      />
                    </List>

                    <SectionHeader
                      icon={timeOutline}
                      title="Business Hours"
                      subtitle="Optional - shown on your profile"
                    />
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
                    {/* Step 2 intro */}
                    <div className="mx-4 mt-3 mb-2 p-3 bg-amber-50/70 border border-amber-100 rounded-2xl flex items-start gap-2.5">
                      <IonIcon
                        icon={shieldCheckmarkOutline}
                        className="text-amber-500 text-lg shrink-0 mt-0.5"
                      />
                      <div>
                        <p className="text-xs text-amber-800 leading-relaxed">
                          Upload a government-issued identity document for
                          verification. This helps build customer trust and improves your search ranking.
                        </p>
                        <p className="text-[10px] text-amber-600 mt-1 font-medium">
                          This step is optional - you can always verify later from your dashboard.
                        </p>
                      </div>
                    </div>

                    <SectionHeader
                      icon={imageOutline}
                      title="Identity Verification"
                      subtitle="Upload any one of the accepted documents"
                    />

                    {/* Document type selector */}
                    <DocumentTypeSelector
                      selected={docType}
                      onChange={(id) => {
                        setDocType(id);
                        if (values.identity_doc) {
                          setFieldValue("identity_doc", null);
                        }
                      }}
                    />

                    {/* File uploader */}
                    <DocFilePicker
                      file={values.identity_doc}
                      error={errors.identity_doc as string}
                      touched={touched.identity_doc as boolean}
                      docType={docType}
                      onChange={(file) =>
                        setFieldValue("identity_doc", file)
                      }
                    />

                    {/* Guidelines */}
                    <DocumentGuidelines />

                    {/* What happens next */}
                    <WhatHappensNext />
                  </>
                )}

                {/* Error banner */}
                {submitError && (
                  <Block>
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-2xl p-3 mt-2">
                      <IonIcon
                        icon={alertCircleOutline}
                        className="text-red-500 text-lg shrink-0 mt-0.5"
                      />
                      <p className="text-xs text-red-600 font-medium leading-relaxed">
                        {submitError}
                      </p>
                    </div>
                  </Block>
                )}
              </div>

              {/* Bottom action bar */}
              <div className="fixed bottom-0 left-0 w-full pb-safe z-10 bg-white/80 backdrop-blur-sm border-t border-slate-100 px-4 pt-3 pb-5">
                <div className="flex gap-3">
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
                        onClick={() =>
                          handleNext(validateForm, setTouched)
                        }
                        disabled={!isStep1Valid || isSubmitting}
                        type="button"
                      >
                        Next Step
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
                      {isStep2Valid ? (
                        <Button
                          large
                          rounded
                          className="flex-1"
                          type="submit"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <span className="flex items-center gap-2 justify-center">
                              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                              Submitting...
                            </span>
                          ) : (
                            "Submit"
                          )}
                        </Button>
                      ) : (
                        <Button
                          large
                          rounded
                          className="flex-1"
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => {
                            pendingSubmitRef.current = submitForm;
                            setShowSkipConfirm(true);
                          }}
                        >
                          {isSubmitting ? (
                            <span className="flex items-center gap-2 justify-center">
                              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                              Submitting...
                            </span>
                          ) : (
                            "Skip & Submit"
                          )}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </Form>
          );
        }}
      </Formik>

      {/* Skip Verification Confirmation */}
      <AppDialog
        open={showSkipConfirm}
        onClose={() => setShowSkipConfirm(false)}
        icon={informationCircleOutline}
        iconColor="text-amber-600"
        iconBg="bg-amber-50"
        title="Skip Verification?"
        description="You can always verify later from your dashboard, but verified providers get better visibility and trust from customers."
        confirmLabel="Skip for Now"
        cancelLabel="Add Verification"
        onConfirm={() => {
          setShowSkipConfirm(false);
          pendingSubmitRef.current?.();
          pendingSubmitRef.current = null;
        }}
        confirmColor="gray"
      />
    </Page>
  );
};

export default ProviderOnboardingPage;
