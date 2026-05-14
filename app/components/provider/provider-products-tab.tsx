"use client";
import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { IonIcon } from "@ionic/react";
import {
  addOutline,
  createOutline,
  trashOutline,
  cameraOutline,
  closeOutline,
  cubeOutline,
  pricetagOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  closeCircleOutline,
} from "ionicons/icons";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { ProviderDetailsProduct } from "@/services/provider.service";
import { checkContent } from "@/utils/content-sanitizer";
import { AppDialog } from "../app-dialog";
import {
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "@/hooks/useProduct";
import { uploadProductImage } from "@/services/product.service";

interface ProviderProductsTabProps {
  products: ProviderDetailsProduct[];
  providerId: string | null;
}

const productSchema = Yup.object({
  name: Yup.string().required("Product name is required").max(150),
  price: Yup.string().nullable(),
  description: Yup.string().max(2000).nullable(),
  currency: Yup.string().oneOf(["INR", "USD"]).default("INR"),
  productType: Yup.string().oneOf(["product", "service"]).default("product"),
});

async function compressImage(file: File, maxDim = 1200, quality = 0.82): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { naturalWidth: w, naturalHeight: h } = img;
      const scale = Math.min(1, maxDim / Math.max(w, h));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          resolve(new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

const ProviderProductsTab = ({
  products,
  providerId,
}: ProviderProductsTabProps) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<ProviderDetailsProduct | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const isSaving = createMutation.isPending || updateMutation.isPending || isUploading;

  const handleAdd = () => {
    setEditing(null);
    setPhotoFiles([]);
    setPhotoPreviews([]);
    setPhotoError(null);
    setSheetOpen(true);
  };

  const handleEdit = (p: ProviderDetailsProduct) => {
    setEditing(p);
    setPhotoFiles([]);
    // Load existing photos from photoUrls (or fallback to photoUrl)
    const existing = p.photoUrls?.length ? [...p.photoUrls] : p.photoUrl ? [p.photoUrl] : [];
    setPhotoPreviews(existing);
    setPhotoError(null);
    setSheetOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        setDeleteOpen(false);
        setSheetOpen(false);
        setEditing(null);
      },
    });
  };

  const handleToggleActive = (p: ProviderDetailsProduct) => {
    updateMutation.mutate({ id: p.id, isActive: !p.isActive });
  };

  const handleToggleHero = (p: ProviderDetailsProduct) => {
    updateMutation.mutate({ id: p.id, isHero: !p.isHero });
  };

  const heroCount = products.filter((p) => p.isHero).length;

  const [photoError, setPhotoError] = useState<string | null>(null);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (files.length === 0) return;
    setPhotoError(null);

    const slotsLeft = 5 - photoPreviews.length;
    if (slotsLeft <= 0) {
      setPhotoError("Maximum 5 photos allowed.");
      return;
    }
    const toAdd = files.slice(0, slotsLeft);

    // Compress every image client-side before previewing/uploading
    const compressed = await Promise.all(toAdd.map((f) => compressImage(f)));
    setPhotoFiles((prev) => [...prev, ...compressed]);
    setPhotoPreviews((prev) => [...prev, ...compressed.map((f) => URL.createObjectURL(f))]);
  };

  const removePhoto = (index: number) => {
    const url = photoPreviews[index];
    const isBlob = url.startsWith("blob:");
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
    if (isBlob) {
      // Find the index within photoFiles (blob urls are appended after server urls)
      const blobIndex = photoPreviews.slice(0, index).filter((u) => u.startsWith("blob:")).length;
      setPhotoFiles((prev) => prev.filter((_, i) => i !== blobIndex));
    }
    setPhotoError(null);
  };

  const activeCount = products.filter((p) => p.isActive).length;
  const inactiveCount = products.length - activeCount;

  return (
    <div className="animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">
            Products & Services
          </h3>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            {activeCount} active
            {inactiveCount > 0 && ` · ${inactiveCount} inactive`}
            {heroCount > 0 && <span className="text-amber-500"> · ★ {heroCount}/3 hero</span>}
          </p>
        </div>
        {!providerId && (
          <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded-full font-medium">
            Set up your provider profile first
          </span>
        )}
      </div>

      {/* Product List */}
      {products.length > 0 ? (
        <div className="px-4 pb-4">
          {/* Stats pills */}
          <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
            <span className="shrink-0 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              📦 {products.filter(p => p.productType !== "service").length} Products
            </span>
            {products.some(p => p.productType === "service") && (
              <span className="shrink-0 px-3 py-1.5 rounded-full bg-teal-50 dark:bg-teal-900/30 text-[11px] font-semibold text-teal-600 dark:text-teal-400">
                🛠️ {products.filter(p => p.productType === "service").length} Services
              </span>
            )}
            {heroCount > 0 && (
              <span className="shrink-0 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                ★ {heroCount} Hero
              </span>
            )}
          </div>

          {/* Cards */}
          <div className="space-y-2.5">
            {products.map((p, i) => {
              const hasImage = !!(p.photoUrl || p.photoUrls?.[0]);
              const isService = p.productType === "service";
              const currencySymbol = p.currency === "INR" ? "₹" : "$";
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.025 }}
                  onClick={() => handleEdit(p)}
                  className={`rounded-2xl active:scale-[0.98] transition-all cursor-pointer ${
                    !p.isActive ? "opacity-45" : ""
                  }`}
                >
                  <div
                    className={`flex items-center gap-3.5 px-3.5 py-3 rounded-2xl ${
                      p.isHero
                        ? "bg-gradient-to-r from-amber-50 to-orange-50/50 dark:from-amber-900/15 dark:to-orange-900/10 border border-amber-200/70 dark:border-amber-800/40"
                        : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700"
                    }`}
                  >
                    {/* Image */}
                    <div className="relative w-[60px] h-[60px] rounded-xl shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-700">
                      {hasImage ? (
                        <img
                          src={p.photoUrl || p.photoUrls?.[0]}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-xl">{isService ? "🛠️" : "📦"}</span>
                        </div>
                      )}
                      {(p.photoUrls?.length ?? 0) > 1 && (
                        <span className="absolute bottom-0 right-0 bg-black/60 text-white text-[7px] font-bold px-1 py-px rounded-tl">
                          +{(p.photoUrls?.length ?? 1) - 1}
                        </span>
                      )}
                    </div>

                    {/* Text content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="text-[13px] font-bold text-slate-800 dark:text-white leading-tight truncate">
                          {p.name}
                        </p>
                        {p.isHero && (
                          <span className="text-amber-500 text-[11px] shrink-0">★</span>
                        )}
                      </div>

                      {p.description ? (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed line-clamp-1">
                          {p.description}
                        </p>
                      ) : null}

                      <div className="flex items-center gap-2 mt-1.5">
                        {p.price !== null ? (
                          <span className="text-[13px] font-extrabold text-slate-800 dark:text-white">
                            {currencySymbol}{Number(p.price).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 italic">
                            Price on request
                          </span>
                        )}
                        <span className="text-slate-200 dark:text-slate-600">·</span>
                        <span className={`text-[10px] font-semibold ${
                          isService
                            ? "text-teal-500 dark:text-teal-400"
                            : "text-slate-400 dark:text-slate-500"
                        }`}>
                          {isService ? "Service" : "Product"}
                        </span>
                        {!p.isActive && (
                          <>
                            <span className="text-slate-200 dark:text-slate-600">·</span>
                            <span className="text-[10px] font-semibold text-red-400">Inactive</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Edit indicator */}
                    <div className="shrink-0 w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center">
                      <IonIcon icon={createOutline} className="text-[15px] text-slate-400 dark:text-slate-500" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="px-4 py-12 text-center">
          <div className="w-20 h-20 bg-teal-50 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <IonIcon icon={cubeOutline} className="text-4xl text-teal-400" />
          </div>
          <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1">
            No products or services yet
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[250px] mx-auto mb-5">
            Add your products or services to showcase to customers
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleAdd}
            disabled={!providerId}
            className="px-5 py-2.5 rounded-xl bg-teal-500 text-white text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <IonIcon icon={addOutline} className="text-lg" />
            Add Product or Service
          </motion.button>
        </div>
      )}

      {/* FAB */}
      {products.length > 0 && providerId && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleAdd}
          className="fixed right-5 bottom-28 z-20 w-14 h-14 rounded-2xl bg-teal-500 text-white shadow-lg shadow-teal-500/25 flex items-center justify-center"
        >
          <IonIcon icon={addOutline} className="text-2xl" />
        </motion.button>
      )}

      <div className="h-20" />

      {/* Add/Edit Modal */}
      {createPortal(
      <AnimatePresence>
        {sheetOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end justify-center"
            onClick={() => !isSaving && setSheetOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="w-full max-w-md bg-white dark:bg-slate-800 rounded-t-3xl max-h-[90vh] overflow-y-auto"
              style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 16px)" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white dark:bg-slate-800 z-10 border-b border-slate-100 dark:border-slate-700 px-5 py-4 flex items-center justify-between rounded-t-3xl">
                <h3 className="text-base font-bold text-slate-800 dark:text-white">
                  {editing ? (editing.productType === "service" ? "Edit Service" : "Edit Product") : "New Item"}
                </h3>
                <div className="flex items-center gap-2">
                  {editing && (
                    <button
                      onClick={() => setDeleteOpen(true)}
                      className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center"
                    >
                      <IonIcon icon={trashOutline} className="text-sm text-red-500" />
                    </button>
                  )}
                  <button
                    onClick={() => !isSaving && setSheetOpen(false)}
                      className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center"
                    >
                      <IonIcon icon={closeOutline} className="text-lg text-slate-500 dark:text-slate-400" />
                  </button>
                </div>
              </div>

              <Formik
                initialValues={{
                  name: editing?.name || "",
                  description: editing?.description || "",
                  price: editing?.price != null ? String(editing.price) : "",
                  currency: editing?.currency || "INR",
                  productType: editing?.productType || "product",
                }}
                validationSchema={productSchema}
                enableReinitialize
                onSubmit={async (values) => {
                  // Content sanitization
                  const nameCheck = checkContent(values.name);
                  const descCheck = checkContent(values.description || "");
                  if (nameCheck.flagged || descCheck.flagged) {
                    return;
                  }

                  // Collect server URLs that the user kept
                  const keptServerUrls = photoPreviews.filter((u) => !u.startsWith("blob:"));

                  // Upload new files
                  let newUrls: string[] = [];
                  if (photoFiles.length > 0) {
                    try {
                      setIsUploading(true);
                      const results = await Promise.all(
                        photoFiles.map((f) => uploadProductImage(f)),
                      );
                      newUrls = results.map((r) => r.url);
                    } catch {
                      // Continue with what we have
                    } finally {
                      setIsUploading(false);
                    }
                  }

                  const photoUrls = [...keptServerUrls, ...newUrls];

                  const payload = {
                    name: values.name.trim(),
                    description: values.description?.trim() || undefined,
                    price: values.price ? parseFloat(values.price) : undefined,
                    currency: values.currency || "INR",
                    productType: values.productType || "product",
                    photoUrl: photoUrls[0] || undefined,
                    photoUrls,
                  };

                  if (editing) {
                    updateMutation.mutate(
                      { id: editing.id, ...payload },
                      { onSuccess: () => { setSheetOpen(false); setEditing(null); } },
                    );
                  } else if (providerId) {
                    createMutation.mutate(
                      { providerId, ...payload },
                      { onSuccess: () => setSheetOpen(false) },
                    );
                  }
                }}
              >
                {({ values, setFieldValue, isValid, dirty }) => (
                  <Form className="p-5 space-y-5">
                    {/* Product Type Toggle */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Type</label>
                      <div className="flex gap-2">
                        {(["product", "service"] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setFieldValue("productType", t)}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                              values.productType === t
                                ? t === "service"
                                  ? "bg-teal-50 dark:bg-teal-900/30 border-teal-400 text-teal-700 dark:text-teal-400"
                                  : "bg-amber-50 dark:bg-amber-900/30 border-amber-400 text-amber-700 dark:text-amber-400"
                                : "bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600"
                            }`}
                          >
                            {t === "product" ? "📦 Product" : "🛠️ Service"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Photo Upload Section */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Photos <span className="text-slate-400 dark:text-slate-500 font-normal">({photoPreviews.length}/5)</span>
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {photoPreviews.map((url, i) => (
                          <div key={i} className="relative w-20 h-20">
                            <img src={url} alt="" className="w-full h-full object-cover rounded-xl border border-slate-200" loading="lazy" decoding="async" />
                            <button
                              type="button"
                              onClick={() => removePhoto(i)}
                              className="absolute -top-1.5 -right-1.5 z-10 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform"
                            >
                              <IonIcon icon={closeOutline} className="text-white text-xs" />
                            </button>
                            {i === 0 && (
                              <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[8px] text-center py-0.5 font-bold rounded-b-xl">
                                Cover
                              </span>
                            )}
                          </div>
                        ))}
                        {photoPreviews.length < 5 && (
                          <label className="w-20 h-20 rounded-xl border-2 border-dashed border-teal-300 bg-teal-50/50 flex flex-col items-center justify-center cursor-pointer hover:border-teal-400 hover:bg-teal-50 transition-colors active:scale-95">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={handlePhotoSelect}
                            />
                            <IonIcon icon={cameraOutline} className="text-lg text-teal-500" />
                            <span className="text-[9px] text-teal-600 mt-0.5 font-medium">Add</span>
                          </label>
                        )}
                      </div>
                      {photoPreviews.length === 0 && (
                        <p className="text-[10px] text-slate-400 mt-2">
                          Tap the + button to add up to 5 photos. You can select multiple at once.
                        </p>
                      )}
                      {photoError && (
                        <p className="text-[10px] text-red-500 mt-1.5 flex items-center gap-1">
                          <IonIcon icon={closeCircleOutline} className="text-xs" />
                          {photoError}
                        </p>
                      )}
                    </div>

                    {/* Product Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Product Name</label>
                      <Field
                        name="name"
                        placeholder="e.g. Bridal Mehendi Package"
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 transition-colors"
                      />
                      <ErrorMessage name="name" component="p" className="text-[10px] text-red-500 mt-1" />
                    </div>

                    {/* Price */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Price ({values.currency === "INR" ? "₹" : "$"})
                        <span className="text-slate-400 dark:text-slate-500 font-normal ml-1">— optional</span>
                      </label>
                      <Field
                        name="price"
                        type="number"
                        placeholder="Leave blank if price varies or not applicable"
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 transition-colors"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                      <Field
                        as="textarea"
                        name="description"
                        rows={3}
                        placeholder="What's included, duration, special features..."
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 transition-colors resize-none"
                      />
                    </div>

                    {/* Currency */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Currency</label>
                      <div className="flex gap-2">
                        {(["INR", "USD"] as const).map((c) => {
                          const hasPrice = values.price != null && String(values.price).trim() !== "";
                          return (
                            <button
                              key={c}
                              type="button"
                              disabled={!hasPrice}
                              onClick={() => setFieldValue("currency", c)}
                              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                                !hasPrice
                                  ? "bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 border-slate-200 dark:border-slate-700 cursor-not-allowed"
                                  : values.currency === c
                                    ? "bg-teal-500 text-white border-teal-500"
                                    : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600"
                              }`}
                            >
                              {c === "INR" ? "₹ INR" : "$ USD"}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Hero Product Toggle */}
                    {editing && (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30">
                        <div>
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">★ Hero Product</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{heroCount}/3 slots used</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleHero(editing)}
                          disabled={!editing.isHero && heroCount >= 3}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            editing.isHero
                              ? "bg-amber-500 text-white"
                              : heroCount >= 3
                                ? "bg-slate-100 dark:bg-slate-700 text-slate-300 cursor-not-allowed"
                                : "bg-white dark:bg-slate-700 text-amber-600 border border-amber-300"
                          }`}
                        >
                          {editing.isHero ? "Remove" : "Make Hero"}
                        </button>
                      </div>
                    )}

                    {/* Submit */}
                    <div className="pt-2 pb-8">
                      <button
                        type="submit"
                        disabled={!isValid || (!dirty && photoFiles.length === 0 && !editing) || isSaving}
                        className="w-full py-3.5 rounded-xl bg-teal-500 text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isSaving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            {isUploading ? "Uploading photos..." : editing ? "Saving..." : "Adding..."}
                          </>
                        ) : editing ? (
                          "Save Changes"
                        ) : (
                          values.productType === "service" ? "Add Service" : "Add Product"
                        )}
                      </button>
                      {(createMutation.isError || updateMutation.isError) && (
                        <p className="text-xs text-red-500 text-center mt-2">
                          Something went wrong. Please try again.
                        </p>
                      )}
                    </div>
                  </Form>
                )}
              </Formik>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body,
      )}

      {/* Delete Confirmation */}
      <AppDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        icon={trashOutline}
        iconColor="text-red-500"
        iconBg="bg-red-50"
        title="Delete Product?"
        description="This product will be permanently removed."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => editing && handleDelete(editing.id)}
        confirmColor="red"
      />
    </div>
  );
};

export default ProviderProductsTab;
