"use client";
import { useState } from "react";
import { motion } from "framer-motion";
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
} from "ionicons/icons";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { Sheet, Page, Navbar, List, Button, Block } from "konsta/react";
import { FormikInput } from "../formik-input";
import { ProviderDetailsProduct } from "@/services/provider.service";
import { AppDialog } from "../app-dialog";
import {
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "@/hooks/useProduct";

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
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleAdd = () => {
    setEditing(null);
    setPhotoPreview(null);
    setSheetOpen(true);
  };

  const handleEdit = (p: ProviderDetailsProduct) => {
    setEditing(p);
    setPhotoPreview(p.photoUrl);
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

      {/* Add/Edit Sheet */}
      <Sheet
        opened={sheetOpen}
        onBackdropClick={() => !isSaving && setSheetOpen(false)}
        className="pb-safe rounded-t-3xl !h-[88vh]"
      >
        <Page className="flex flex-col bg-white">
          <Navbar
            title={editing ? "Edit Product" : "New Product"}
            left={
              <Button
                clear
                onClick={() => !isSaving && setSheetOpen(false)}
              >
                <IonIcon icon={closeOutline} className="w-5 h-5" />
              </Button>
            }
            right={
              editing && (
                <Button
                  clear
                  onClick={() => setDeleteOpen(true)}
                  className="!text-red-500"
                >
                  <IonIcon icon={trashOutline} className="w-5 h-5" />
                </Button>
              )
            }
          />
          <div className="overflow-y-auto flex-1 pb-8">
            <Formik
              initialValues={{
                name: editing?.name || "",
                description: editing?.description || "",
                price: editing?.price != null ? String(editing.price) : "",
                currency: editing?.currency || "INR",
                photoUrl: editing?.photoUrl || "",
              }}
              validationSchema={productSchema}
              enableReinitialize
              onSubmit={(values) => {
                const payload = {
                  name: values.name,
                  description: values.description || undefined,
                  price: values.price ? parseFloat(values.price) : undefined,
                  currency: values.currency || "INR",
                  photoUrl: values.photoUrl || undefined,
                };
                if (editing) {
                  updateMutation.mutate(
                    { id: editing.id, ...payload },
                    {
                      onSuccess: () => {
                        setSheetOpen(false);
                        setEditing(null);
                      },
                    },
                  );
                } else if (providerId) {
                  createMutation.mutate(
                    { providerId, ...payload },
                    {
                      onSuccess: () => setSheetOpen(false),
                    },
                  );
                }
              }}
            >
              {({ values, setFieldValue, isValid, dirty }) => (
                <Form className="contents">
                  {/* Photo upload */}
                  <label className="block mt-5 mb-4 text-center cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = URL.createObjectURL(file);
                          setPhotoPreview(url);
                          setFieldValue("photoUrl", url);
                        }
                      }}
                    />
                    <div className="w-44 h-44 mx-auto rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center relative transition-all active:scale-[0.97]">
                      {photoPreview || values.photoUrl ? (
                        <>
                          <img
                            src={photoPreview || values.photoUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <span className="text-white text-xs font-semibold px-3 py-1 border border-white/50 rounded-full">
                              Change Photo
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center mb-2">
                            <IonIcon
                              icon={cameraOutline}
                              className="text-xl text-teal-500"
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-500">
                            Upload Photo
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            Recommended: 800×800px
                          </span>
                        </>
                      )}
                    </div>
                  </label>

                  {/* Fields */}
                  <div className="px-4 pb-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Product Details
                    </p>
                  </div>
                  <List strongIos insetIos className="!mt-0">
                    <FormikInput
                      name="name"
                      label="Name"
                      type="text"
                      placeholder="e.g. Bridal Mehendi Package"
                      media={<IonIcon icon={cubeOutline} />}
                    />
                    <FormikInput
                      name="price"
                      label="Price (₹)"
                      type="number"
                      placeholder="e.g. 2500"
                      media={<IonIcon icon={pricetagOutline} />}
                    />
                    <FormikInput
                      name="description"
                      label="Description"
                      type="textarea"
                      placeholder="What's included, duration, special features..."
                      inputClassName="!h-28 resize-none"
                    />
                  </List>

                  {/* Currency */}
                  <div className="px-4 pb-3">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Currency
                    </p>
                    <div className="flex gap-2">
                      {(["INR", "USD"] as const).map((c) => (
                        <motion.button
                          key={c}
                          type="button"
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setFieldValue("currency", c)}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                            values.currency === c
                              ? "bg-teal-500 text-white border-teal-500"
                              : "bg-white text-slate-600 border-slate-200"
                          }`}
                        >
                          {c === "INR" ? "₹ INR" : "$ USD"}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Submit */}
                  <Block className="px-4 pt-2">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      disabled={!isValid || (!dirty && !editing) || isSaving}
                      className="w-full py-3.5 rounded-xl bg-teal-500 text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          {editing ? "Saving..." : "Adding..."}
                        </>
                      ) : editing ? (
                        "Save Changes"
                      ) : (
                        "Add Product"
                      )}
                    </motion.button>
                    {(createMutation.isError || updateMutation.isError) && (
                      <p className="text-xs text-red-500 text-center mt-2">
                        Something went wrong. Please try again.
                      </p>
                    )}
                  </Block>
                </Form>
              )}
            </Formik>
          </div>
        </Page>
      </Sheet>

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
