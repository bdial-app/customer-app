"use client";
import { useState } from "react";
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
} from "ionicons/icons";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import {
  Sheet,
  Page,
  Navbar,
  List,
  Button,
  Block,
} from "konsta/react";
import { FormikInput } from "../formik-input";
import { ListingProduct } from "@/services/listing.service";
import { AppDialog } from "../app-dialog";

interface ProviderProductsTabProps {
  products: ListingProduct[];
}

const productSchema = Yup.object({
  name: Yup.string().required("Name is required"),
  price: Yup.string().required("Price is required"),
  description: Yup.string().nullable(),
});

const ProviderProductsTab = ({ products: initialProducts }: ProviderProductsTabProps) => {
  // TODO: Replace with API-backed state when Products CRUD endpoints exist
  const [products, setProducts] = useState(initialProducts);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<ListingProduct | null>(null);

  const handleAdd = () => {
    setEditing(null);
    setSheetOpen(true);
  };

  const handleEdit = (p: ListingProduct) => {
    setEditing(p);
    setSheetOpen(true);
  };

  const handleDelete = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setDeleteOpen(false);
    setSheetOpen(false);
  };

  return (
    <div className="animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h3 className="text-sm font-bold text-slate-800">
          Products & Services ({products.length})
        </h3>
      </div>

      {/* Product Grid */}
      {products.length > 0 ? (
        <div className="px-4 space-y-3">
          {products.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleEdit(p)}
              className="bg-white rounded-2xl border border-slate-100 overflow-hidden flex shadow-sm active:bg-slate-50"
            >
              {/* Photo */}
              <div className="w-24 h-24 shrink-0 bg-slate-100">
                {p.photoUrl ? (
                  <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <IonIcon icon={cubeOutline} className="text-2xl text-slate-300" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
                <p className="text-sm font-semibold text-slate-800 truncate">{p.name}</p>
                {p.description && (
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                    {p.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  {p.price !== null && (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                      <IonIcon icon={pricetagOutline} className="text-[10px]" />
                      {p.currency === "INR" ? "₹" : "$"}{p.price}
                    </span>
                  )}
                  {!p.isActive && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-medium">
                      Inactive
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center pr-3">
                <IonIcon icon={createOutline} className="text-slate-400 text-lg" />
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="px-4 py-12 text-center">
          <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <IonIcon icon={cubeOutline} className="text-4xl text-teal-400" />
          </div>
          <h4 className="text-base font-bold text-slate-800 mb-1">
            No products yet
          </h4>
          <p className="text-sm text-slate-500 max-w-[250px] mx-auto mb-5">
            Add your first product or service to showcase to customers
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleAdd}
            className="px-5 py-2.5 rounded-xl bg-teal-500 text-white text-sm font-semibold inline-flex items-center gap-1.5"
          >
            <IonIcon icon={addOutline} className="text-lg" />
            Add Product
          </motion.button>
        </div>
      )}

      {/* FAB */}
      {products.length > 0 && (
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
        onBackdropClick={() => setSheetOpen(false)}
        className="pb-safe rounded-t-3xl h-fit min-h-[80vh] max-h-[90vh]"
      >
        <Page className="flex flex-col">
          <Navbar
            title={editing ? "Edit Product" : "Add Product"}
            left={
              <Button clear onClick={() => setSheetOpen(false)}>
                <IonIcon icon={closeOutline} className="w-5 h-5" />
              </Button>
            }
            right={
              editing && (
                <Button clear onClick={() => setDeleteOpen(true)} className="text-red-500">
                  <IonIcon icon={trashOutline} className="w-5 h-5" />
                </Button>
              )
            }
          />
          <div className="overflow-y-auto pb-4">
            <Formik
              initialValues={{
                name: editing?.name || "",
                description: editing?.description || "",
                price: editing?.price != null ? String(editing.price) : "",
                photoUrl: editing?.photoUrl || "",
              }}
              validationSchema={productSchema}
              enableReinitialize
              onSubmit={(values) => {
                if (editing) {
                  setProducts((prev) =>
                    prev.map((p) =>
                      p.id === editing.id
                        ? { ...p, name: values.name, description: values.description, price: parseFloat(values.price) || 0, photoUrl: values.photoUrl }
                        : p,
                    ),
                  );
                } else {
                  const newProduct: ListingProduct = {
                    id: `local-${Date.now()}`,
                    listingId: "",
                    name: values.name,
                    description: values.description,
                    price: parseFloat(values.price) || 0,
                    currency: "INR",
                    photoUrl: values.photoUrl,
                    isActive: true,
                    displayOrder: products.length,
                  };
                  setProducts((prev) => [...prev, newProduct]);
                }
                setSheetOpen(false);
              }}
            >
              {({ values, setFieldValue, isValid, dirty }) => (
                <Form className="contents">
                  <label className="block mt-6 mb-4 text-center cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setFieldValue("photoUrl", URL.createObjectURL(file));
                      }}
                    />
                    <div className="w-52 h-52 mx-auto rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center relative transition-all active:scale-95">
                      {values.photoUrl ? (
                        <>
                          <img src={values.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <span className="text-white text-xs font-semibold px-3 py-1 border border-white/50 rounded-full">
                              Change
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <IonIcon icon={cameraOutline} className="text-3xl mb-1 text-teal-400" />
                          <span className="text-xs font-semibold text-slate-500">Upload Photo</span>
                        </>
                      )}
                    </div>
                  </label>
                  <List strongIos insetIos className="!mt-0">
                    <FormikInput name="name" label="Name" type="text" placeholder="Product or service name" />
                    <FormikInput name="price" label="Price (₹)" type="number" placeholder="e.g. 500" />
                    <FormikInput
                      name="description"
                      label="Description"
                      type="textarea"
                      placeholder="Brief description..."
                      inputClassName="!h-28 resize-none"
                    />
                  </List>
                  <Block className="mt-auto px-4">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      disabled={!isValid || (!dirty && !editing)}
                      className="w-full py-3.5 rounded-xl bg-teal-500 text-white font-semibold text-sm disabled:opacity-50"
                    >
                      {editing ? "Save Changes" : "Add Product"}
                    </motion.button>
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
