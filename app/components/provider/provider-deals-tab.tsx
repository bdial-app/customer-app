"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IonIcon } from "@ionic/react";
import {
  addOutline,
  trashOutline,
  closeOutline,
  pricetagOutline,
  calendarOutline,
  timeOutline,
  flashOutline,
} from "ionicons/icons";
import { Formik, Form, Field, ErrorMessage, useFormikContext } from "formik";
import * as Yup from "yup";
import { AppDialog } from "../app-dialog";
import {
  useMyOffers,
  useCreateOffer,
  useUpdateOffer,
  useDeleteOffer,
} from "@/hooks/useMyProvider";
import { ProviderOfferFull } from "@/services/provider.service";

const offerSchema = Yup.object({
  title: Yup.string().required("Title is required").max(150),
  description: Yup.string().max(500).nullable(),
  discountType: Yup.string().oneOf(["percentage", "flat"]).required(),
  discountValue: Yup.string().required("Discount value is required"),
  minOrderAmount: Yup.string().nullable(),
  maxDiscount: Yup.string().nullable(),
  startsAt: Yup.string().required("Start date is required"),
  endsAt: Yup.string().required("End date is required"),
  usageLimit: Yup.string().nullable(),
});

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const isOfferActive = (offer: ProviderOfferFull) => {
  const now = new Date();
  return (
    offer.isActive &&
    new Date(offer.startsAt) <= now &&
    new Date(offer.endsAt) > now
  );
};

const isOfferExpired = (offer: ProviderOfferFull) => {
  return new Date(offer.endsAt) <= new Date();
};

const isOfferUpcoming = (offer: ProviderOfferFull) => {
  return offer.isActive && new Date(offer.startsAt) > new Date();
};

const ProviderDealsTab = () => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<ProviderOfferFull | null>(null);

  const { data: offers = [], isLoading } = useMyOffers();
  const createMutation = useCreateOffer();
  const updateMutation = useUpdateOffer();
  const deleteMutation = useDeleteOffer();

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleAdd = () => {
    setEditing(null);
    setSheetOpen(true);
  };

  const handleEdit = (offer: ProviderOfferFull) => {
    setEditing(offer);
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

  const activeOffers = offers.filter(isOfferActive);
  const upcomingOffers = offers.filter(isOfferUpcoming);
  const expiredOffers = offers.filter(isOfferExpired);

  if (isLoading) {
    return (
      <div className="px-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 bg-white rounded-2xl border border-slate-100 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="relative min-h-[60vh]">
      {offers.length === 0 ? (
        <div className="px-4">
          <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <IonIcon icon={pricetagOutline} className="text-3xl text-amber-400" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">
              No deals yet
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Create your first deal to attract more customers
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleAdd}
              className="mx-auto flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold"
            >
              <IonIcon icon={addOutline} className="text-sm" />
              Create Deal
            </motion.button>
          </div>
        </div>
      ) : (
        <div className="px-4 space-y-4">
          {/* Active Deals */}
          {activeOffers.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Active ({activeOffers.length})
                </h4>
              </div>
              <div className="space-y-2">
                {activeOffers.map((offer, i) => (
                  <OfferCard key={offer.id} offer={offer} index={i} onEdit={handleEdit} />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Deals */}
          {upcomingOffers.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Upcoming ({upcomingOffers.length})
                </h4>
              </div>
              <div className="space-y-2">
                {upcomingOffers.map((offer, i) => (
                  <OfferCard key={offer.id} offer={offer} index={i} onEdit={handleEdit} />
                ))}
              </div>
            </div>
          )}

          {/* Expired Deals */}
          {expiredOffers.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-2 h-2 rounded-full bg-slate-300" />
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Expired ({expiredOffers.length})
                </h4>
              </div>
              <div className="space-y-2 opacity-60">
                {expiredOffers.map((offer, i) => (
                  <OfferCard key={offer.id} offer={offer} index={i} onEdit={handleEdit} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* FAB */}
      {offers.length > 0 && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleAdd}
          className="fixed bottom-28 right-5 z-30 w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-600/30"
        >
          <IonIcon icon={addOutline} className="text-2xl" />
        </motion.button>
      )}

      {/* Full-screen Form Modal */}
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
              {/* Modal Header */}
              <div className="sticky top-0 bg-white z-10 border-b border-slate-100 px-5 py-4 flex items-center justify-between rounded-t-3xl">
                <h3 className="text-base font-bold text-slate-800">
                  {editing ? "Edit Deal" : "New Deal"}
                </h3>
                <button
                  onClick={() => !isSaving && setSheetOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
                >
                  <IonIcon icon={closeOutline} className="text-lg text-slate-500" />
                </button>
              </div>

              <Formik
                initialValues={{
                  title: editing?.title ?? "",
                  description: editing?.description ?? "",
                  discountType: editing?.discountType ?? ("percentage" as "percentage" | "flat"),
                  discountValue: editing?.discountValue?.toString() ?? "",
                  minOrderAmount: editing?.minOrderAmount?.toString() ?? "",
                  maxDiscount: editing?.maxDiscount?.toString() ?? "",
                  startsAt: editing
                    ? new Date(editing.startsAt).toISOString().slice(0, 10)
                    : new Date().toISOString().slice(0, 10),
                  endsAt: editing
                    ? new Date(editing.endsAt).toISOString().slice(0, 10)
                    : "",
                  usageLimit: editing?.usageLimit?.toString() ?? "",
                }}
                validationSchema={offerSchema}
                onSubmit={async (values) => {
                  const payload = {
                    title: values.title,
                    description: values.description || undefined,
                    discountType: values.discountType,
                    discountValue: parseFloat(values.discountValue),
                    minOrderAmount: values.minOrderAmount
                      ? parseFloat(values.minOrderAmount)
                      : undefined,
                    maxDiscount: values.maxDiscount
                      ? parseFloat(values.maxDiscount)
                      : undefined,
                    startsAt: new Date(values.startsAt).toISOString(),
                    endsAt: new Date(values.endsAt).toISOString(),
                    usageLimit: values.usageLimit
                      ? parseInt(values.usageLimit, 10)
                      : undefined,
                  };

                  if (editing) {
                    await updateMutation.mutateAsync({
                      offerId: editing.id,
                      payload,
                    });
                  } else {
                    await createMutation.mutateAsync(payload);
                  }
                  setSheetOpen(false);
                  setEditing(null);
                }}
              >
                {({ values, setFieldValue }) => (
                  <Form className="p-5 space-y-5">
                    {/* Title */}
                    <DealFormField name="title" label="Deal Title" placeholder="e.g. 20% off all services" />

                    {/* Description */}
                    <DealFormField name="description" label="Description" placeholder="Optional details about this deal" />

                    {/* Discount Type Toggle */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">Discount Type</label>
                      <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                        {(["percentage", "flat"] as const).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setFieldValue("discountType", type)}
                            className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                              values.discountType === type
                                ? "bg-white text-teal-700 shadow-sm"
                                : "text-slate-500"
                            }`}
                          >
                            {type === "percentage" ? "Percentage (%)" : "Flat Amount (₹)"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Discount Value */}
                    <DealFormField
                      name="discountValue"
                      label={values.discountType === "percentage" ? "Discount Percentage" : "Discount Amount (₹)"}
                      placeholder={values.discountType === "percentage" ? "e.g. 20" : "e.g. 100"}
                      type="number"
                    />

                    {/* Min Order + Max Discount Row */}
                    <div className="grid grid-cols-2 gap-3">
                      <DealFormField name="minOrderAmount" label="Min Order (₹)" placeholder="Optional" type="number" />
                      {values.discountType === "percentage" ? (
                        <DealFormField name="maxDiscount" label="Max Discount (₹)" placeholder="Optional cap" type="number" />
                      ) : (
                        <div />
                      )}
                    </div>

                    {/* Dates Row */}
                    <div className="grid grid-cols-2 gap-3">
                      <DealFormField name="startsAt" label="Start Date" type="date" />
                      <DealFormField name="endsAt" label="End Date" type="date" />
                    </div>

                    {/* Usage Limit */}
                    <DealFormField name="usageLimit" label="Usage Limit" placeholder="Unlimited if blank" type="number" />

                    {/* Actions */}
                    <div className="space-y-2 pt-2 pb-4">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full py-3.5 bg-teal-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isSaving ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          editing ? "Update Deal" : "Create Deal"
                        )}
                      </button>

                      {editing && (
                        <button
                          type="button"
                          onClick={() => setDeleteOpen(true)}
                          className="w-full py-3 bg-red-50 text-red-600 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"
                        >
                          <IonIcon icon={trashOutline} className="text-sm" />
                          Delete Deal
                        </button>
                      )}
                    </div>
                  </Form>
                )}
              </Formik>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AppDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Deal"
        description="Are you sure you want to delete this deal? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmColor="red"
        isLoading={deleteMutation.isPending}
        loadingLabel="Deleting..."
        onConfirm={() => editing && handleDelete(editing.id)}
      />
    </div>
  );
};

// ─── Offer Card ─────────────────────────────────────────────────────

const OfferCard = ({
  offer,
  index,
  onEdit,
}: {
  offer: ProviderOfferFull;
  index: number;
  onEdit: (offer: ProviderOfferFull) => void;
}) => {
  const active = isOfferActive(offer);
  const expired = isOfferExpired(offer);
  const upcoming = isOfferUpcoming(offer);

  const discountLabel =
    offer.discountType === "percentage"
      ? `${Number(offer.discountValue)}% OFF`
      : `₹${Number(offer.discountValue)} OFF`;

  const statusBadge = active
    ? { label: "Active", bg: "bg-emerald-50", text: "text-emerald-700" }
    : upcoming
    ? { label: "Upcoming", bg: "bg-blue-50", text: "text-blue-700" }
    : { label: "Expired", bg: "bg-slate-100", text: "text-slate-500" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={() => onEdit(offer)}
      className="bg-white rounded-2xl p-4 border border-slate-100 active:bg-slate-50 transition-colors"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              active ? "bg-amber-50" : "bg-slate-50"
            }`}
          >
            <IonIcon
              icon={active ? flashOutline : pricetagOutline}
              className={`text-lg ${active ? "text-amber-500" : "text-slate-400"}`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-slate-800 truncate">
                {offer.title}
              </p>
              <span
                className={`shrink-0 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase ${statusBadge.bg} ${statusBadge.text}`}
              >
                {statusBadge.label}
              </span>
            </div>
            {offer.description && (
              <p className="text-[10px] text-slate-500 truncate mt-0.5">
                {offer.description}
              </p>
            )}
          </div>
        </div>
        <div className="shrink-0 ml-2">
          <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded-lg">
            {discountLabel}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3 text-[10px] text-slate-400">
        <div className="flex items-center gap-1">
          <IonIcon icon={calendarOutline} className="text-xs" />
          {formatDate(offer.startsAt)} – {formatDate(offer.endsAt)}
        </div>
        {offer.usageLimit && (
          <div className="flex items-center gap-1">
            <IonIcon icon={timeOutline} className="text-xs" />
            {offer.usageCount}/{offer.usageLimit} used
          </div>
        )}
        {offer.minOrderAmount && (
          <span>Min ₹{Number(offer.minOrderAmount)}</span>
        )}
      </div>
    </motion.div>
  );
};

export default ProviderDealsTab;

// ─── Form Field Component ───────────────────────────────────────────

const DealFormField = ({
  name,
  label,
  placeholder,
  type = "text",
}: {
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
}) => (
  <div>
    <label htmlFor={name} className="block text-xs font-semibold text-slate-700 mb-1.5">
      {label}
    </label>
    <Field
      id={name}
      name={name}
      type={type}
      placeholder={placeholder}
      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 transition-colors"
    />
    <ErrorMessage name={name} component="p" className="text-[10px] text-red-500 mt-1" />
  </div>
);
