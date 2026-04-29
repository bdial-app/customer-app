"use client";
import { useRef } from "react";
import { motion } from "framer-motion";
import { IonIcon } from "@ionic/react";
import {
  addOutline,
  trashOutline,
  imagesOutline,
  cloudUploadOutline,
} from "ionicons/icons";
import { ProviderDetailsPhoto } from "@/services/provider.service";
import { useUploadPhotos, useDeletePhoto } from "@/hooks/usePhotos";

interface ProviderPhotosTabProps {
  photos: ProviderDetailsPhoto[];
  providerId: string | null;
}

const ProviderPhotosTab = ({ photos, providerId }: ProviderPhotosTabProps) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadPhotos();
  const deleteMutation = useDeletePhoto();

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !providerId) return;
    uploadMutation.mutate({ providerId, files: Array.from(files) });
    e.target.value = "";
  };

  const handleDelete = (photoId: string) => {
    deleteMutation.mutate(photoId);
  };

  const maxPhotos = 10;
  const remaining = maxPhotos - photos.length;

  return (
    <div className="animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h3 className="text-sm font-bold text-slate-800">
          Photos ({photos.length}/{maxPhotos})
        </h3>
        {photos.length > 0 && providerId && remaining > 0 && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => fileRef.current?.click()}
            disabled={uploadMutation.isPending}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-teal-50 active:bg-teal-100"
          >
            <IonIcon icon={addOutline} className="text-teal-600 text-sm" />
            <span className="text-xs font-semibold text-teal-600">Add</span>
          </motion.button>
        )}
      </div>

      {/* Upload progress */}
      {uploadMutation.isPending && (
        <div className="mx-4 mb-3 px-4 py-3 bg-teal-50 rounded-xl flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-teal-700 font-medium">Uploading photos...</span>
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
                className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 group"
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
                  onClick={() => handleDelete(photo.id)}
                  disabled={deleteMutation.isPending}
                  className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
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
          <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <IonIcon icon={imagesOutline} className="text-4xl text-teal-400" />
          </div>
          <h4 className="text-base font-bold text-slate-800 mb-1">
            No photos yet
          </h4>
          <p className="text-sm text-slate-500 max-w-[250px] mx-auto mb-5">
            Upload photos of your work to attract more customers
          </p>
          {providerId ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => fileRef.current?.click()}
              disabled={uploadMutation.isPending}
              className="px-5 py-2.5 rounded-xl bg-teal-500 text-white text-sm font-semibold inline-flex items-center gap-1.5"
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
    </div>
  );
};

export default ProviderPhotosTab;
