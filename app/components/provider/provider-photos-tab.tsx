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
} from "ionicons/icons";
import { ProviderDetailsPhoto } from "@/services/provider.service";
import { useUploadPhotos, useDeletePhoto } from "@/hooks/usePhotos";
import { AppDialog } from "../app-dialog";

const MAX_PHOTOS = 10;
const MAX_PER_UPLOAD = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

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
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(`"${file.name}" exceeds 5 MB. Please choose a smaller image.`);
        e.target.value = "";
        return;
      }
    }

    uploadMutation.mutate(
      { providerId, files },
      {
        onError: () => {
          setUploadError("Upload failed. Please try again.");
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
    <div className="animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white">
          Photos ({photos.length}/{MAX_PHOTOS})
        </h3>
        {photos.length > 0 && providerId && remaining > 0 && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => fileRef.current?.click()}
            disabled={isBusy}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-teal-50 dark:bg-teal-900/30 active:bg-teal-100 disabled:opacity-50"
          >
            <IonIcon icon={addOutline} className="text-teal-600 text-sm" />
            <span className="text-xs font-semibold text-teal-600">Add</span>
          </motion.button>
        )}
      </div>

      {/* Error message */}
      <AnimatePresence>
        {uploadError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-4 mb-3 px-4 py-3 bg-red-50 dark:bg-red-900/30 rounded-xl flex items-start gap-2.5"
          >
            <IonIcon icon={alertCircleOutline} className="text-red-500 text-sm mt-0.5 shrink-0" />
            <div className="flex-1">
              <span className="text-xs text-red-700 dark:text-red-300 font-medium">{uploadError}</span>
            </div>
            <button onClick={() => setUploadError(null)} className="text-red-400 text-xs font-bold shrink-0">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload progress */}
      {uploadMutation.isPending && (
        <div className="mx-4 mb-3 px-4 py-3 bg-teal-50 dark:bg-teal-900/30 rounded-xl flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-teal-700 dark:text-teal-300 font-medium">Uploading photos...</span>
        </div>
      )}

      {/* Limit info */}
      {remaining === 0 && (
        <div className="mx-4 mb-3 px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center gap-2">
          <IonIcon icon={alertCircleOutline} className="text-amber-500 text-sm shrink-0" />
          <span className="text-[11px] text-amber-700 dark:text-amber-300">Maximum {MAX_PHOTOS} photos reached. Delete some to add new ones.</span>
        </div>
      )}

      {photos.length > 0 ? (
        <div className="px-4 grid grid-cols-3 gap-2">
          {photos
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((photo, i) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 group"
              >
                {photo.imageUrl ? (
                  <img
                    src={photo.imageUrl}
                    alt={`Photo ${i + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <IonIcon icon={imagesOutline} className="text-xl text-slate-300" />
                  </div>
                )}
                {/* Delete overlay */}
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  onClick={() => setDeleteTarget(photo.id)}
                  disabled={isBusy}
                  className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center disabled:opacity-40"
                >
                  <IonIcon icon={trashOutline} className="text-white text-sm" />
                </motion.button>
                {/* Order badge */}
                <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/50 backdrop-blur-sm">
                  <span className="text-[10px] text-white font-medium">{i + 1}</span>
                </div>
              </motion.div>
            ))}
        </div>
      ) : (
        /* Empty State */
        <div className="px-4 py-12 text-center">
          <div className="w-20 h-20 bg-teal-50 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <IonIcon icon={imagesOutline} className="text-4xl text-teal-400" />
          </div>
          <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1">
            No photos yet
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[250px] mx-auto mb-5">
            Upload photos of your work to attract more customers
          </p>
          {providerId ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => fileRef.current?.click()}
              disabled={isBusy}
              className="px-5 py-2.5 rounded-xl bg-teal-500 text-white text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <IonIcon icon={cloudUploadOutline} className="text-lg" />
              Upload Photos
            </motion.button>
          ) : (
            <p className="text-xs text-slate-400">
              Set up your provider profile first to upload photos
            </p>
          )}
        </div>
      )}

      {/* Upload constraints hint */}
      {photos.length > 0 && remaining > 0 && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-2 px-4">
          Max {MAX_PER_UPLOAD} photos per upload · JPEG, PNG, WebP · Under 5 MB each
        </p>
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

      <div className="h-20" />

      {/* Delete photo confirmation */}
      <AppDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        icon={trashOutline}
        iconColor="text-red-500"
        iconBg="bg-red-50"
        title="Delete Photo?"
        description="This photo will be permanently removed."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => {
          if (deleteTarget) handleDelete(deleteTarget);
          setDeleteTarget(null);
        }}
        confirmColor="red"
      />
    </div>
  );
};

export default ProviderPhotosTab;
