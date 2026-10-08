"use client";
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IonIcon } from "@ionic/react";
import {
  addOutline,
  trashOutline,
  imagesOutline,
  cloudUploadOutline,
  alertCircleOutline,
  closeOutline,
  star,
  sunnyOutline,
  storefrontOutline,
  scanOutline,
  informationCircleOutline,
} from "ionicons/icons";
import { ProviderDetailsPhoto } from "@/services/provider.service";
import { useUploadPhotos, useDeletePhoto } from "@/hooks/usePhotos";
import { AppDialog } from "../app-dialog";
import { checkPickedFile, UploadFileError } from "@/utils/compress-image";
import { Card, EmptyState, GroupLabel, ManagePage, PrimaryButton, SectionHeader, StickyActionBar } from "./manage/kit";

const MAX_PHOTOS = 10;
const MAX_PER_UPLOAD = 3;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const UPLOAD_RULES = `Up to ${MAX_PER_UPLOAD} at a time · JPEG, PNG or WebP · any size, we optimise them`;

const TIPS = [
  { icon: sunnyOutline, text: "Shoot in daylight — bright, sharp photos look more trustworthy." },
  { icon: storefrontOutline, text: "Show your shop front, your team and real work you've done." },
  { icon: scanOutline, text: "Keep it simple: one clear subject per photo, no heavy text or posters." },
];

interface ProviderPhotosTabProps {
  photos: ProviderDetailsPhoto[];
  providerId: string | null;
}

const ProviderPhotosTab = ({ photos, providerId }: ProviderPhotosTabProps) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadPhotos();
  const deleteMutation = useDeletePhoto();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const remaining = MAX_PHOTOS - photos.length;
  const isBusy = uploadMutation.isPending || deleteMutation.isPending;
  const sorted = [...photos].sort((a, b) => a.displayOrder - b.displayOrder);
  const canAdd = !!providerId && remaining > 0;
  const openPicker = () => fileRef.current?.click();

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected?.length || !providerId) return;
    setUploadError(null);

    const files = Array.from(selected);

    // Validate count
    if (files.length > MAX_PER_UPLOAD) {
      setUploadError(`You can upload at most ${MAX_PER_UPLOAD} photos at a time.`);
      e.target.value = "";
      return;
    }
    if (files.length > remaining) {
      setUploadError(`You can only add ${remaining} more photo${remaining === 1 ? "" : "s"} (${photos.length}/${MAX_PHOTOS} used).`);
      e.target.value = "";
      return;
    }

    // Validate each file
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setUploadError(`"${file.name}" is not a supported format. Use JPEG, PNG, or WebP.`);
        e.target.value = "";
        return;
      }
      const tooBig = checkPickedFile(file);
      if (tooBig) {
        setUploadError(tooBig);
        e.target.value = "";
        return;
      }
    }

    uploadMutation.mutate(
      { providerId, files },
      {
        onError: (err) => {
          setUploadError(err instanceof UploadFileError ? err.message : "Upload failed. Please try again.");
        },
      },
    );
    e.target.value = "";
  };

  const handleDelete = (photoId: string) => {
    deleteMutation.mutate(photoId, {
      onError: () => {
        setUploadError("Failed to delete photo. Please try again.");
      },
    });
  };

  return (
    <ManagePage>
      <SectionHeader
        title="Photos"
        subtitle="Photos are the first thing customers look at. Real photos of your work win their trust."
      />

      {/* Error message */}
      <AnimatePresence>
        {uploadError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div role="alert" className="flex items-start gap-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 ring-1 ring-rose-100 dark:ring-rose-900/60 pl-4 pr-1 py-1">
              <IonIcon icon={alertCircleOutline} className="text-[18px] text-rose-500 dark:text-rose-400 shrink-0 mt-[13px]" />
              <p className="flex-1 py-3 text-[13px] font-medium leading-snug text-rose-700 dark:text-rose-200">{uploadError}</p>
              <button
                type="button"
                onClick={() => setUploadError(null)}
                aria-label="Dismiss message"
                className="w-11 h-11 rounded-xl flex items-center justify-center text-rose-400 active:bg-rose-100 dark:active:bg-rose-900/40 shrink-0"
              >
                <IonIcon icon={closeOutline} className="text-[20px]" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload progress */}
      {uploadMutation.isPending && (
        <div className="flex items-center gap-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 ring-1 ring-indigo-100 dark:ring-indigo-900/60 px-4 py-3.5">
          <span className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin shrink-0" />
          <div className="min-w-0">
            <p className="text-[13.5px] font-bold text-indigo-900 dark:text-indigo-100">Uploading your photos…</p>
            <p className="text-[12px] text-indigo-700/70 dark:text-indigo-200/70 mt-0.5">This can take a few seconds on mobile data.</p>
          </div>
        </div>
      )}

      {photos.length > 0 ? (
        <>
          {/* Gallery */}
          <div className="grid grid-cols-3 gap-2">
            {sorted.map((photo, i) => {
              const first = i === 0;
              return (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className={`relative aspect-square overflow-hidden bg-slate-200/70 dark:bg-slate-800 ring-1 ring-black/5 dark:ring-white/5 ${
                    first ? "col-span-2 row-span-2 rounded-[22px]" : "rounded-2xl"
                  }`}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <IonIcon icon={imagesOutline} className="text-2xl text-slate-300 dark:text-slate-600" />
                  </div>
                  {photo.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photo.imageUrl}
                      alt={`Business photo ${i + 1}`}
                      className="relative w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/45 to-transparent" />

                  {/* Delete: a 44px tap area around a small, calm button */}
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(photo.id)}
                    disabled={isBusy}
                    aria-label={`Delete photo ${i + 1}`}
                    className="absolute top-0 right-0 w-11 h-11 flex items-center justify-center disabled:opacity-40 group"
                  >
                    <span className="w-8 h-8 rounded-full bg-black/55 backdrop-blur-sm ring-1 ring-white/20 flex items-center justify-center group-active:scale-90 transition-transform">
                      <IonIcon icon={trashOutline} className="text-white text-[15px]" />
                    </span>
                  </button>

                  {/* Order */}
                  {first ? (
                    <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-white/90 dark:bg-slate-900/85 backdrop-blur-sm text-[11.5px] font-bold text-slate-800 dark:text-white shadow-sm">
                      <IonIcon icon={star} className="text-[12px] text-amber-500" />
                      Shown first
                    </span>
                  ) : (
                    <span className="absolute bottom-1.5 left-1.5 min-w-[22px] h-[22px] px-1.5 rounded-full bg-black/50 backdrop-blur-sm text-[11px] font-bold text-white flex items-center justify-center">
                      {i + 1}
                    </span>
                  )}
                </motion.div>
              );
            })}

            {/* Add tile — fills the next slot in the grid */}
            {canAdd && (
              <button
                type="button"
                onClick={openPicker}
                disabled={isBusy}
                className="aspect-square rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/50 dark:bg-indigo-950/30 flex flex-col items-center justify-center gap-1 text-indigo-600 dark:text-indigo-300 active:scale-[0.97] transition-transform disabled:opacity-50"
              >
                <span className="w-9 h-9 rounded-full bg-white dark:bg-indigo-900/60 shadow-sm flex items-center justify-center">
                  <IonIcon icon={addOutline} className="text-[20px]" />
                </span>
                <span className="text-[12px] font-bold">Add</span>
              </button>
            )}
          </div>

          {/* Capacity */}
          <div className="px-1">
            <div className="flex items-center justify-between text-[12.5px]">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                {photos.length} of {MAX_PHOTOS} photos
              </span>
              <span className="text-slate-400 dark:text-slate-500">
                {remaining > 0 ? `${remaining} ${remaining === 1 ? "spot" : "spots"} left` : "Full"}
              </span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(photos.length / MAX_PHOTOS) * 100}%` }}
                transition={{ duration: 0.5 }}
                className={`h-full rounded-full ${remaining === 0 ? "bg-amber-400" : "bg-gradient-to-r from-indigo-500 to-violet-500"}`}
              />
            </div>
          </div>

          {/* Limit info */}
          {remaining === 0 && (
            <div className="flex items-start gap-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 ring-1 ring-amber-100 dark:ring-amber-900/50 px-4 py-3">
              <IonIcon icon={alertCircleOutline} className="text-[18px] text-amber-500 shrink-0 mt-px" />
              <p className="text-[13px] leading-snug text-amber-800 dark:text-amber-200">
                You&apos;ve reached the maximum of {MAX_PHOTOS} photos. Delete one to add a new one.
              </p>
            </div>
          )}
        </>
      ) : providerId ? (
        <EmptyState
          icon={imagesOutline}
          title="Add your first photos"
          body="Customers trust businesses they can see. Add photos of your shop, your team or your work."
          action={
            <PrimaryButton icon={cloudUploadOutline} onClick={openPicker} disabled={isBusy} loading={uploadMutation.isPending}>
              Upload photos
            </PrimaryButton>
          }
          secondary={<p className="text-[11.5px] text-slate-400 dark:text-slate-500">{UPLOAD_RULES}</p>}
        />
      ) : (
        <EmptyState
          icon={imagesOutline}
          title="No photos yet"
          body="Set up your provider profile first to upload photos."
        />
      )}

      {/* Tips */}
      <GroupLabel>Tips for great photos</GroupLabel>
      <Card className="!py-1.5">
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {TIPS.map((t) => (
            <li key={t.text} className="flex items-start gap-3 py-2.5">
              <span className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center shrink-0">
                <IonIcon icon={t.icon} className="text-[16px] text-indigo-600 dark:text-indigo-300" />
              </span>
              <p className="text-[13px] text-slate-600 dark:text-slate-300 leading-snug pt-1.5">{t.text}</p>
            </li>
          ))}
        </ul>
        {photos.length > 0 && (
          <p className="flex items-center gap-1.5 border-t border-slate-100 dark:border-slate-800 pt-2.5 pb-1.5 mt-0.5 text-[11.5px] text-slate-400 dark:text-slate-500">
            <IonIcon icon={informationCircleOutline} className="text-[14px] shrink-0" />
            {UPLOAD_RULES}
          </p>
        )}
      </Card>

      {photos.length > 0 && canAdd && (
        <StickyActionBar>
          <PrimaryButton full icon={addOutline} onClick={openPicker} disabled={isBusy} loading={uploadMutation.isPending}>
            {uploadMutation.isPending ? "Uploading…" : "Add photos"}
          </PrimaryButton>
        </StickyActionBar>
      )}

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleUpload}
      />

      {/* Delete photo confirmation */}
      <AppDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        icon={trashOutline}
        iconColor="text-red-500"
        iconBg="bg-red-50 dark:bg-red-950/50"
        title="Delete this photo?"
        description="It will be removed from your business page. This can't be undone."
        confirmLabel="Delete"
        cancelLabel="Keep it"
        onConfirm={() => {
          if (deleteTarget) handleDelete(deleteTarget);
          setDeleteTarget(null);
        }}
        confirmColor="red"
      />
    </ManagePage>
  );
};

export default ProviderPhotosTab;
