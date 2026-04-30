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
  lockClosedOutline,
  diamondOutline,
  alertCircleOutline,
} from "ionicons/icons";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { AppDialog } from "../app-dialog";
import {
  useMyOffers,
  useCreateOffer,
  useUpdateOffer,
  useDeleteOffer,
  useOfferLimits,
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
  const [paymentPrompt, setPaymentPrompt] = useState(false);

  const { data: offers = [], isLoading } = useMyOffers();
  const { data: limits } = useOfferLimits();
  const createMutation = useCreateOffer();
  const updateMutation = useUpdateOffer();
  const deleteMutation = useDeleteOffer();

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const canCreateDeal = !limits?.requiresPayment && (limits ? limits.totalDeals < limits.maxTotalDeals : true);
  const canCreateActive = limits ? limits.activeDeals < limits.maxActiveDeals : true;

  const handleAdd = () => {
    if (limits?.requiresPayment) {
      setPaymentPrompt(true);
      return;
    }
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
            className="h-24 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="relative min-h-[60vh]">
      {/* Limits Banner */}
      {limits && (
        <div className="px-4 mb-3">
          <div className={`rounded-2xl p-3.5 border ${
            limits.requiresPayment
              ? "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700"
              : "bg-slate-50 dark:bg-slate-700 border-slate-100 dark:border-slate-600"
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                limits.requiresPayment ? "bg-amber-100 dark:bg-amber-900/50" : "bg-white dark:bg-slate-800"
              }`}>
                <IonIcon
                  icon={limits.requiresPayment ? lockClosedOutline : pricetagOutline}
                  className={`text-base ${limits.requiresPayment ? "text-amber-600" : "text-slate-500"}`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {limits.totalDeals}/{limits.maxTotalDeals}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">deals</span>
                  </div>
                  <div className="w-px h-3 bg-slate-200" />
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {limits.activeDeals}/{limits.maxActiveDeals}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">active</span>
                  </div>
                </div>
                {/* Progress bars */}
                <div className="flex gap-2">
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        limits.totalDeals >= limits.maxTotalDeals ? "bg-amber-500" : "bg-teal-500"
                      }`}
                      style={{ width: `${(limits.totalDeals / limits.maxTotalDeals) * 100}%` }}
                    />
                  </div>
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        limits.activeDeals >= limits.maxActiveDeals ? "bg-red-400" : "bg-emerald-500"
                      }`}
                      style={{ width: `${(limits.activeDeals / limits.maxActiveDeals) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            {limits.requiresPayment && (
              <button
                onClick={() => setPaymentPrompt(true)}
                className="mt-3 w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <IonIcon icon={diamondOutline} className="text-sm" />
                Upgrade to Add More Deals
              </button>
            )}
            {!limits.requiresPayment && !canCreateActive && (
              <p className="mt-2 text-[10px] text-red-500 flex items-center gap-1">
                <IonIcon icon={alertCircleOutline} className="text-xs" />
                Max 3 active deals reached. Deactivate one or wait for it to expire.
              </p>
            )}
          </div>
        </div>
      )}

      {offers.length === 0 ? (
        <div className="px-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-100 dark:border-slate-700 text-center">
            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <IonIcon icon={pricetagOutline} className="text-3xl text-amber-400" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-1">
              No deals yet
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
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
                <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
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
                <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
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
                <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
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
              className="w-full max-w-md bg-white dark:bg-slate-800 rounded-t-3xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white dark:bg-slate-800 z-10 border-b border-slate-100 dark:border-slate-700 px-5 py-4 flex items-center justify-between rounded-t-3xl">
                <h3 className="text-base font-bold text-slate-800 dark:text-white">
                  {editing ? "Edit Deal" : "New Deal"}
                </h3>
                <button
                  onClick={() => !isSaving && setSheetOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center"
                >
                  <IonIcon icon={closeOutline} className="text-lg text-slate-500 dark:text-slate-400" />
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
                    {/* Active deals limit warning */}
                    {!editing && !canCreateActive && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5">
                        <IonIcon icon={alertCircleOutline} className="text-red-500 text-base mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-red-700">Active limit reached</p>
                          <p className="text-[10px] text-red-500 mt-0.5">
                            You already have 3 active deals. Your new deal will be created but
                            it will only go live when another deal expires or is deactivated.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Title */}
                    <DealFormField name="title" label="Deal Title" placeholder="e.g. 20% off all services" />

                    {/* Description */}
                    <DealFormField name="description" label="Description" placeholder="Optional details about this deal" />

                    {/* Discount Type Toggle */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Discount Type</label>
                      <div className="flex bg-slate-100 dark:bg-slate-700 rounded-xl p-1 gap-1">
                        {(["percentage", "flat"] as const).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setFieldValue("discountType", type)}
                            className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                              values.discountType === type
                                ? "bg-white dark:bg-slate-600 text-teal-700 dark:text-teal-300 shadow-sm"
                                : "text-slate-500 dark:text-slate-400"
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

                      {(createMutation.isError || updateMutation.isError) && (
                        <p className="text-xs text-red-500 text-center mt-1">
                          {((createMutation.error || updateMutation.error) as any)?.response?.data?.message ||
                            "Something went wrong. Please try again."}
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

      {/* Payment / Upgrade Prompt */}
      <AnimatePresence>
        {paymentPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-6"
            onClick={() => setPaymentPrompt(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-sm w-full text-center shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <IonIcon icon={diamondOutline} className="text-3xl text-white" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                Upgrade Your Plan
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                You&apos;ve reached the free limit of{" "}
                <span className="font-bold text-slate-700">5 deals</span>.
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-6 leading-relaxed">
                Upgrade to our Pro plan to create unlimited deals, unlock advanced
                analytics, and get featured placement.
              </p>
              <div className="space-y-2.5">
                <button
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                  onClick={() => setPaymentPrompt(false)}
                >
                  <IonIcon icon={diamondOutline} className="text-base" />
                  Coming Soon
                </button>
                <button
                  onClick={() => setPaymentPrompt(false)}
                  className="w-full py-3 text-sm text-slate-500 font-medium"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
      className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 active:bg-slate-50 dark:active:bg-slate-700 transition-colors"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              active ? "bg-amber-50 dark:bg-amber-900/30" : "bg-slate-50 dark:bg-slate-700"
            }`}
          >
            <IonIcon
              icon={active ? flashOutline : pricetagOutline}
              className={`text-lg ${active ? "text-amber-500" : "text-slate-400"}`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                {offer.title}
              </p>
              <span
                className={`shrink-0 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase ${statusBadge.bg} ${statusBadge.text}`}
              >
                {statusBadge.label}
              </span>
            </div>
            {offer.description && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {offer.description}
              </p>
            )}
          </div>
        </div>
        <div className="shrink-0 ml-2">
          <span className="text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/30 px-2 py-1 rounded-lg">
            {discountLabel}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3 text-[10px] text-slate-400 dark:text-slate-500">
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
    <label htmlFor={name} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
      {label}
    </label>
    <Field
      id={name}
      name={name}
      type={type}
      placeholder={placeholder}
      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 transition-colors"
    />
    <ErrorMessage name={name} component="p" className="text-[10px] text-red-500 mt-1" />
  </div>
);
