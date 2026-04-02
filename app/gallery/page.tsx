"use client"
import { Block, Navbar, Button, Page } from "konsta/react";
import { useState } from "react";
import Link from "next/link";
import { ROUTE_PATH } from "@/utils/contants";
import { IonIcon } from "@ionic/react";
import { arrowBack, expand, contract } from "ionicons/icons";

export default function GalleryPage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  // Mock gallery images - this would come from API or previous page
  const galleryImages = [
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800",
    "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800",
    "https://images.unsplash.com/photo-1560749614-612495a177a5?w=800",
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800",
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800",
    "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800"
  ];

  const handlePrevious = () => {
    setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  const handleNext = () => {
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const handleThumbnailClick = (index: number) => {
    setCurrentImageIndex(index);
    setIsZoomed(false); // Reset zoom when changing image
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  return (
    <Page style={{
      background: 'radial-gradient(at 0% 10%, #f0eff4, #f0ecff)',
    }}>
      <Navbar
        centerTitle={false}
        title="Gallery"
        titleClassName="ml-2"
        innerClassName="justify-start"
        leftClassName="w-11"
        left={
          <Link href={ROUTE_PATH.PROVIDER_DETAILS}>
            <IonIcon icon={arrowBack} />
          </Link>
        }
        right={
          <Button clear onClick={toggleZoom}>
            <IonIcon icon={isZoomed ? contract : expand} className="w-5 h-5" />
          </Button>
        }
      />

      {/* Main Image Display */}
      <Block className="mt-4">
        <div className="relative bg-black rounded-lg overflow-hidden">
          <div 
            className={`relative cursor-pointer transition-transform duration-300 ${isZoomed ? 'scale-150' : 'scale-100'}`}
            onClick={toggleZoom}
            style={{
              transformOrigin: 'center',
              overflow: isZoomed ? 'auto' : 'hidden'
            }}
          >
            <img
              src={galleryImages[currentImageIndex]}
              alt={`Gallery image ${currentImageIndex + 1}`}
              className="w-full h-96 object-contain"
              draggable={false}
            />
          </div>
          
          {/* Navigation Arrows */}
          <Button
            clear
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 rounded-full w-10 h-10"
            onClick={handlePrevious}
          >
            <IonIcon icon={arrowBack} className="w-5 h-5" />
          </Button>
          
          <Button
            clear
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 rounded-full w-10 h-10 rotate-180"
            onClick={handleNext}
          >
            <IonIcon icon={arrowBack} className="w-5 h-5" />
          </Button>

          {/* Image Counter */}
          <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-sm">
            {currentImageIndex + 1} / {galleryImages.length}
          </div>
        </div>
      </Block>

      {/* Thumbnail Strip */}
      <Block className="mt-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {galleryImages.map((image, index) => (
            <div
              key={index}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                index === currentImageIndex 
                  ? 'border-primary scale-110' 
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
              onClick={() => handleThumbnailClick(index)}
            >
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </Block>

      {/* Instructions */}
      <Block className="text-center">
        <p className="text-sm text-gray-600">
          {isZoomed ? "Click to zoom out" : "Click image to zoom in"}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Swipe or use arrows to navigate
        </p>
      </Block>

      {/* Touch/Swipe Support */}
      <div 
        className="absolute inset-0 z-10 pointer-events-none"
        onTouchStart={(e) => {
          const touch = e.touches[0];
          const startX = touch.clientX;
          
          const onTouchEnd = (endEvent: TouchEvent) => {
            const touch = endEvent.changedTouches[0];
            const endX = touch.clientX;
            const diff = startX - endX;
            
            if (Math.abs(diff) > 50) {
              if (diff > 0) {
                handleNext(); // Swipe left - next image
              } else {
                handlePrevious(); // Swipe right - previous image
              }
            }
            
            document.removeEventListener('touchend', onTouchEnd);
          };
          
          document.addEventListener('touchend', onTouchEnd);
        }}
      />
    </Page>
  );
}
