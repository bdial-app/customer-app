"use client";
import { useState, useRef } from "react";
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
import { AppDialog } from "../app-dialog";
import {
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "@/hooks/useProduct";
import { uploadProviderPhotos } from "@/services/photo.service";

interface ProviderProductsTabProps {
  products: ProviderDetailsProduct[];
  providerId: string | null;
}

const productSchema = Yup.object({
  name: Yup.string().required("Product name is required").max(150),
  price: Yup.string().required("Price is required"),
  description: Yup.string().max(2000).nullable(),
  currency: Yup.string().oneOf(["INR", "USD"]).default("INR"),
});

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
    setSheetOpen(true);
  };

  const handleEdit = (p: ProviderDetailsProduct) => {
    setEditing(p);
    setPhotoFiles([]);
    setPhotoPreviews(p.photoUrl ? [p.photoUrl] : []);
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

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newFiles = [...photoFiles, ...files].slice(0, 5);
    setPhotoFiles(newFiles);
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
    // Keep existing server URLs for editing, plus new file previews
    if (editing?.photoUrl && photoPreviews[0] === editing.photoUrl) {
      setPhotoPreviews([editing.photoUrl, ...newPreviews]);
    } else {
      setPhotoPreviews(newPreviews);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    const isServerUrl = editing?.photoUrl && photoPreviews[index] === editing.photoUrl;
    const newPreviews = photoPreviews.filter((_, i) => i !== index);
    setPhotoPreviews(newPreviews);
    if (!isServerUrl) {
      const fileIndex = editing?.photoUrl ? index - 1 : index;
      setPhotoFiles((prev) => prev.filter((_, i) => i !== fileIndex));
    }
  };

  const activeCount = products.filter((p) => p.isActive).length;
  const inactiveCount = products.length - activeCount;

  return (
    <div className="animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          <h3 className="text-sm font-bold text-slate-800">
            Products & Services
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {activeCount} active
            {inactiveCount > 0 && ` · ${inactiveCount} inactive`}
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
        <div className="px-4 space-y-2.5">
          {products.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`bg-white rounded-2xl border overflow-hidden flex shadow-sm ${
                !p.isActive
                  ? "border-slate-200 opacity-60"
                  : "border-slate-100"
              }`}
            >
              {/* Photo */}
              <div
                className="w-[88px] h-[88px] shrink-0 bg-slate-100 cursor-pointer"
                onClick={() => handleEdit(p)}
              >
                {p.photoUrl ? (
                  <img
                    src={p.photoUrl}
                    alt={p.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <IonIcon
                      icon={cubeOutline}
                      className="text-2xl text-slate-300"
                    />
                  </div>
                )}
              </div>

              {/* Info */}
              <div
                className="flex-1 min-w-0 p-3 flex flex-col justify-center cursor-pointer"
                onClick={() => handleEdit(p)}
              >
                <p className="text-[13px] font-semibold text-slate-800 truncate">
                  {p.name}
                </p>
                {p.description && (
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                    {p.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  {p.price !== null && (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                      <IonIcon
                        icon={pricetagOutline}
                        className="text-[10px]"
                      />
                      {p.currency === "INR" ? "₹" : "$"}
                      {p.price}
                    </span>
                  )}
                  {!p.isActive && (
                    <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-500 text-[10px] font-medium">
                      Inactive
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col items-center justify-center gap-1 pr-2">
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  onClick={() => handleEdit(p)}
                  className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center"
                >
                  <IonIcon
                    icon={createOutline}
                    className="text-slate-400 text-sm"
                  />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  onClick={() => handleToggleActive(p)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    p.isActive ? "bg-emerald-50" : "bg-slate-50"
                  }`}
                >
                  <IonIcon
                    icon={
                      p.isActive
                        ? checkmarkCircleOutline
                        : alertCircleOutline
                    }
                    className={`text-sm ${
                      p.isActive ? "text-emerald-500" : "text-slate-400"
                    }`}
                  />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="px-4 py-12 text-center">
          <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <IonIcon icon={cubeOutline} className="text-4xl text-teal-400" />
          </div>
          <h4 className="text-base font-bold text-slate-800 mb-1">
            No products yet
          </h4>
          <p className="text-sm text-slate-500 max-w-[250px] mx-auto mb-5">
            Add your products or services to showcase to customers
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleAdd}
            disabled={!providerId}
            className="px-5 py-2.5 rounded-xl bg-teal-500 text-white text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <IonIcon icon={addOutline} className="text-lg" />
            Add Product
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
              className="w-full max-w-md bg-white rounded-t-3xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white z-10 border-b border-slate-100 px-5 py-4 flex items-center justify-between rounded-t-3xl">
                <h3 className="text-base font-bold text-slate-800">
                  {editing ? "Edit Product" : "New Product"}
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
                    className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
                  >
                    <IonIcon icon={closeOutline} className="text-lg text-slate-500" />
                  </button>
                </div>
              </div>

              <Formik
                initialValues={{
                  name: editing?.name || "",
                  description: editing?.description || "",
                  price: editing?.price != null ? String(editing.price) : "",
                  currency: editing?.currency || "INR",
                }}
                validationSchema={productSchema}
                enableReinitialize
                onSubmit={async (values) => {
                  let photoUrl = editing?.photoUrl || undefined;

                  // Upload new photos if any
                  if (photoFiles.length > 0 && providerId) {
                    try {
                      setIsUploading(true);
                      const uploaded = await uploadProviderPhotos(providerId, photoFiles);
                      if (uploaded.length > 0) {
                        photoUrl = uploaded[0].imageUrl;
                      }
                    } catch {
                      // Continue with existing photo
                    } finally {
                      setIsUploading(false);
                    }
                  }

                  const payload = {
                    name: values.name,
                    description: values.description || undefined,
                    price: values.price ? parseFloat(values.price) : undefined,
                    currency: values.currency || "INR",
                    photoUrl,
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
                    {/* Photo Upload Section */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        Photos <span className="text-slate-400 font-normal">(up to 5)</span>
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {photoPreviews.map((url, i) => (
                          <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200">
                            <img src={url} alt="" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removePhoto(i)}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-sm"
                            >
                              <IonIcon icon={closeOutline} className="text-white text-[10px]" />
                            </button>
                          </div>
                        ))}
                        {photoPreviews.length < 5 && (
                          <label className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:border-teal-300 transition-colors">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={handlePhotoSelect}
                            />
                            <IonIcon icon={cameraOutline} className="text-lg text-slate-400" />
                            <span className="text-[9px] text-slate-400 mt-0.5">Add</span>
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Product Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Product Name</label>
                      <Field
                        name="name"
                        placeholder="e.g. Bridal Mehendi Package"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 transition-colors"
                      />
                      <ErrorMessage name="name" component="p" className="text-[10px] text-red-500 mt-1" />
                    </div>

                    {/* Price */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Price ({values.currency === "INR" ? "₹" : "$"})
                      </label>
                      <Field
                        name="price"
                        type="number"
                        placeholder="e.g. 2500"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 transition-colors"
                      />
                      <ErrorMessage name="price" component="p" className="text-[10px] text-red-500 mt-1" />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description</label>
                      <Field
                        as="textarea"
                        name="description"
                        rows={3}
                        placeholder="What's included, duration, special features..."
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 transition-colors resize-none"
                      />
                    </div>

                    {/* Currency */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">Currency</label>
                      <div className="flex gap-2">
                        {(["INR", "USD"] as const).map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setFieldValue("currency", c)}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                              values.currency === c
                                ? "bg-teal-500 text-white border-teal-500"
                                : "bg-white text-slate-600 border-slate-200"
                            }`}
                          >
                            {c === "INR" ? "₹ INR" : "$ USD"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Submit */}
                    <div className="pt-2 pb-4">
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
                          "Add Product"
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
      </AnimatePresence>

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
