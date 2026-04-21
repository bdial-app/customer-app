"use client";
import { useState, useRef, useEffect } from "react";
import { Button, Navbar, Page } from "konsta/react";
import { IonIcon } from "@ionic/react";
import {
  arrowBack,
  cloudUploadOutline,
  checkmarkCircle,
  documentTextOutline,
  closeCircle,
  alertCircleOutline,
  shieldCheckmarkOutline,
  informationCircleOutline,
  cardOutline,
  fingerPrintOutline,
  checkmarkCircleOutline,
  hourglassOutline,
} from "ionicons/icons";
import { useRouter } from "next/navigation";
import { submitVerification, getMyProviderStatus } from "@/services/provider.service";
import { useQueryClient } from "@tanstack/react-query";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const DOC_TYPES = [
  { id: "aadhaar", label: "Aadhaar Card", icon: fingerPrintOutline, color: "indigo" },
  { id: "pan", label: "PAN Card", icon: cardOutline, color: "emerald" },
  { id: "other", label: "Other ID", icon: documentTextOutline, color: "amber" },
] as const;

type DocTypeId = (typeof DOC_TYPES)[number]["id"];

export default function VerifyPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const [docType, setDocType] = useState<DocTypeId>("aadhaar");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyProviderStatus()
      .then((res) => {
        setCurrentStatus(res.verificationStatus);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    if (selected) {
      if (selected.size > MAX_FILE_SIZE) {
        setSubmitError("File must be less than 5 MB");
        return;
      }
      if (!ALLOWED_FILE_TYPES.includes(selected.type)) {
        setSubmitError("Only JPEG, PNG or PDF allowed");
        return;
      }
      setSubmitError(null);
    }
    setFile(selected);
    e.target.value = "";
  };

  const handleSubmit = async () => {
    if (!file) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await submitVerification(file, docType);
      queryClient.invalidateQueries({ queryKey: ["my-provider"] });
      setSubmitted(true);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ?? err?.message ?? "Something went wrong. Please try again.";
      setSubmitError(Array.isArray(message) ? message.join(", ") : message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Page>
        <Navbar title="Identity Verification" />
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
          <div className="w-8 h-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      </Page>
    );
  }

  // Already verified
  if (currentStatus === "approved" && !submitted) {
    return (
      <Page>
        <Navbar
          title="Identity Verification"
          leftClassName="w-11"
          left={
            <Button clear onClick={() => router.back()}>
              <IonIcon icon={arrowBack} className="w-5 h-5" />
            </Button>
          }
        />
        <div className="flex flex-col items-center px-6 pt-12 gap-5">
          <div className="p-5 rounded-full bg-emerald-50 border-2 border-emerald-200">
            <IonIcon icon={checkmarkCircleOutline} className="text-5xl text-emerald-500" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Already Verified</h2>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
              Your identity has been verified. You have a verified badge on your profile.
            </p>
          </div>
          <Button large rounded className="w-full mt-4" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </Page>
    );
  }

  // Pending verification
  if (currentStatus === "pending" && !submitted) {
    return (
      <Page>
        <Navbar
          title="Identity Verification"
          leftClassName="w-11"
          left={
            <Button clear onClick={() => router.back()}>
              <IonIcon icon={arrowBack} className="w-5 h-5" />
            </Button>
          }
        />
        <div className="flex flex-col items-center px-6 pt-12 gap-5">
          <div className="p-5 rounded-full bg-amber-50 border-2 border-amber-200">
            <IonIcon icon={hourglassOutline} className="text-5xl text-amber-500" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Verification Pending</h2>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
              Your documents are being reviewed. This usually takes 1-2 business days.
            </p>
          </div>
          <Button large rounded className="w-full mt-4" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </Page>
    );
  }

  // Success state
  if (submitted) {
    return (
      <Page>
        <Navbar
          title="Identity Verification"
          leftClassName="w-11"
          left={
            <Button clear onClick={() => router.back()}>
              <IonIcon icon={arrowBack} className="w-5 h-5" />
            </Button>
          }
        />
        <div className="flex flex-col items-center px-6 pt-12 gap-5">
          <div className="p-5 rounded-full bg-emerald-50 border-2 border-emerald-200">
            <IonIcon icon={checkmarkCircle} className="text-5xl text-emerald-500" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Document Submitted</h2>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
              Your identity document has been submitted for review. We&apos;ll verify it within 1-2 business days.
            </p>
          </div>
          <div className="w-full bg-indigo-50 border border-indigo-100 rounded-2xl p-3 flex items-start gap-2">
            <IonIcon icon={informationCircleOutline} className="text-indigo-400 text-lg shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-700 leading-relaxed">
              Once verified, you&apos;ll receive a verified badge and improved search ranking.
            </p>
          </div>
          <Button large rounded className="w-full mt-2" onClick={() => router.back()}>
            Back to Dashboard
          </Button>
        </div>
      </Page>
    );
  }

  // Upload form
  const docLabel = DOC_TYPES.find((d) => d.id === docType)?.label ?? "Document";

  return (
    <Page>
      <Navbar
        title="Identity Verification"
        leftClassName="w-11"
        left={
          <Button clear onClick={() => router.back()}>
            <IonIcon icon={arrowBack} className="w-5 h-5" />
          </Button>
        }
      />

      <div className="overflow-y-auto max-h-[calc(100vh-120px)] pb-36">
        {/* Intro */}
        <div className="mx-4 mt-4 mb-3 p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-start gap-2.5">
          <IonIcon icon={shieldCheckmarkOutline} className="text-indigo-500 text-lg shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-indigo-800 font-semibold mb-0.5">Why verify?</p>
            <p className="text-[11px] text-indigo-700 leading-relaxed">
              Verified providers appear higher in search results and earn more customer trust. Upload a government-issued ID to get your verified badge.
            </p>
          </div>
        </div>

        {/* Document type selector */}
        <div className="px-4 pt-2 pb-3">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Select document type
          </p>
          <div className="grid grid-cols-3 gap-2">
            {DOC_TYPES.map((doc) => {
              const isActive = docType === doc.id;
              const colorMap: Record<string, { ring: string; bg: string; text: string; icon: string }> = {
                indigo: { ring: "ring-indigo-500 bg-indigo-50", bg: "bg-indigo-50", text: "text-indigo-700", icon: "text-indigo-500" },
                emerald: { ring: "ring-emerald-500 bg-emerald-50", bg: "bg-emerald-50", text: "text-emerald-700", icon: "text-emerald-500" },
                amber: { ring: "ring-amber-500 bg-amber-50", bg: "bg-amber-50", text: "text-amber-700", icon: "text-amber-500" },
              };
              const c = colorMap[doc.color];
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => {
                    setDocType(doc.id);
                    setFile(null);
                    setSubmitError(null);
                  }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all duration-200 active:scale-[0.97] ${
                    isActive ? `ring-2 ${c.ring} border-transparent` : "border-slate-100 bg-white"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isActive ? c.bg : "bg-slate-50"}`}>
                    <IonIcon icon={doc.icon} className={`text-xl ${isActive ? c.icon : "text-slate-400"}`} />
                  </div>
                  <span className={`text-[10px] font-bold leading-tight text-center ${isActive ? c.text : "text-slate-500"}`}>
                    {doc.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* File uploader */}
        <div className="px-4 py-2">
          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            className="hidden"
            onChange={handleFileChange}
          />

          {file ? (
            <div className="rounded-2xl border border-green-200 bg-gradient-to-b from-green-50/60 to-white overflow-hidden shadow-sm">
              {preview ? (
                <div className="relative w-full h-44 bg-slate-100 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt={`${docLabel} preview`} className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 bg-green-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <IonIcon icon={checkmarkCircle} className="text-sm" />
                    Selected
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <IonIcon icon={closeCircle} className="text-white text-lg" />
                  </button>
                </div>
              ) : (
                <div className="relative w-full h-32 bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
                  <div className="flex flex-col items-center gap-1.5 text-slate-400">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                      <IonIcon icon={documentTextOutline} className="text-3xl text-indigo-400" />
                    </div>
                    <span className="text-xs font-semibold text-slate-500">PDF Document</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/20 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <IonIcon icon={closeCircle} className="text-slate-600 text-lg" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-3 p-3 border-t border-green-100">
                <div className="p-1.5 bg-green-100 rounded-lg shrink-0">
                  <IonIcon icon={checkmarkCircle} className="text-green-600 text-lg" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{file.name}</p>
                  <p className="text-[10px] text-slate-500">
                    {formatFileSize(file.size)} &bull; {file.type === "application/pdf" ? "PDF" : "Image"} &bull; {docLabel}
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
            <label className="relative flex flex-col items-center justify-center w-full rounded-2xl border-2 border-dashed border-slate-200 bg-gradient-to-b from-slate-50/50 to-white hover:border-indigo-300 min-h-[180px] cursor-pointer group transition-all">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileChange}
              />
              <div className="flex flex-col items-center gap-3 p-6 pointer-events-none">
                <div className="p-4 rounded-2xl border bg-white border-slate-100 text-indigo-500 shadow-sm transition-all duration-200 group-hover:scale-105 group-hover:shadow-md">
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
                    <span key={f} className="text-[10px] bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full font-medium">
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
        </div>

        {/* Guidelines */}
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
                    <span className="text-[9px] font-bold text-indigo-600">{i + 1}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-start gap-2.5 px-1">
            <IonIcon icon={shieldCheckmarkOutline} className="text-green-500 text-base shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Your documents are encrypted end-to-end and stored securely. Only verified administrators can access them.
            </p>
          </div>
        </div>

        {/* Error */}
        {submitError && (
          <div className="mx-4 mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-2xl p-3">
            <IonIcon icon={alertCircleOutline} className="text-red-500 text-lg shrink-0 mt-0.5" />
            <p className="text-xs text-red-600 font-medium leading-relaxed">{submitError}</p>
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 w-full pb-safe z-10 bg-white/80 backdrop-blur-sm border-t border-slate-100 px-4 pt-3 pb-5">
        <div className="flex gap-3">
          <Button
            large
            rounded
            clear
            className="flex-1"
            onClick={() => router.back()}
            disabled={isSubmitting}
            type="button"
          >
            Cancel
          </Button>
          <Button
            large
            rounded
            className="flex-1"
            onClick={handleSubmit}
            disabled={!file || isSubmitting}
            type="button"
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
        </div>
      </div>
    </Page>
  );
}
