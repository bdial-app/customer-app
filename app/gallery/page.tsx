"use client";
import { Page } from "konsta/react";
import { useState, useRef } from "react";
import dynamic from "next/dynamic";
const IonIcon = dynamic(
  () => import("@ionic/react").then((m) => m.IonIcon),
  { ssr: false }
);
import { arrowBack } from "ionicons/icons";
import { useRouter } from "next/navigation";
import PhotoGallery from "../components/photo-gallery";

export default function GalleryPage() {
  const router = useRouter();

  return (
    <Page className="!bg-gray-50/80">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-3 bg-white border-b border-gray-100/80">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center active:scale-90 transition-transform"
        >
          <IonIcon icon={arrowBack} className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-[17px] font-bold text-gray-900">Gallery</h1>
      </div>

      {/* Photo Grid with Lightbox */}
      <div className="pt-2">
        <PhotoGallery />
      </div>
    </Page>
  );
}
