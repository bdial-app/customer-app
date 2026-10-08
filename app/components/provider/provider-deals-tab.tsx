"use client";
import { useState, type ReactNode } from "react";
import { IonIcon } from "@ionic/react";
import {
  addOutline,
  trashOutline,
  pricetagOutline,
  lockClosedOutline,
  diamondOutline,
  alertCircleOutline,
  informationCircleOutline,
} from "ionicons/icons";
import { Formik, Form, Field, type FormikErrors, type FormikTouched } from "formik";
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
import {
  useDealCreationInfo,
  useMonetizationConfig,
} from "@/hooks/useMonetizationConfig";
import { usePayment } from "@/hooks/usePayment";
import { checkContent } from "@/utils/content-sanitizer";
import { useNotification } from "@/app/context/NotificationContext";
import { isAxiosError } from "axios";
import {
  ManagePage,
  SectionHeader,
  Card,
  EmptyState,
  PrimaryButton,
  StickyActionBar,
  Segmented,
  ManageSheet,
  FieldBlock,
  inputCls,
  textareaCls,
} from "./manage/kit";
import {
  OfferTicket,
  UsageMeter,
  CouponStub,
  isOfferActive,
  isOfferExpired,
  isOfferUpcoming,
  formatDate,
} from "./manage/offers-ticket";
import { BoostNudge } from "./manage/boost";

/** The API's `message` from a failed request, if it sent one. */
function apiErrorMessage(err: unknown): string | undefined {
  return isAxiosError<{ message?: string }>(err) ? err.response?.data?.message : undefined;
}

// Coerce empty form strings to undefined so optional number fields validate cleanly.
const emptyToUndef = (_: unknown, orig: unknown) =>
  orig === "" || orig == null ? undefined : Number(orig);

const offerSchema = Yup.object({
  title: Yup.string().trim().required("Title is required").min(3, "At least 3 characters").max(150, "Max 150 characters"),
  description: Yup.string().trim().max(500, "Max 500 characters").nullable(),
  discountType: Yup.string().oneOf(["percentage", "flat"]).required(),
  discountValue: Yup.number()
    .transform(emptyToUndef)
    .typeError("Enter a valid number")
    .required("Discount value is required")
    .positive("Must be greater than 0")
    .when("discountType", {
      is: "percentage",
      then: (s) => s.max(100, "Percentage can't exceed 100%"),
    }),
  minOrderAmount: Yup.number().transform(emptyToUndef).typeError("Enter a valid number").min(0, "Can't be negative").nullable(),
  maxDiscount: Yup.number().transform(emptyToUndef).typeError("Enter a valid number").positive("Must be greater than 0").nullable(),
  startsAt: Yup.string().required("Start date is required"),
  endsAt: Yup.string()
    .required("End date is required")
    .test("after-start", "End date must be after the start date", function (value) {
      const { startsAt } = this.parent;
      if (!value || !startsAt) return true;
      return new Date(value) > new Date(startsAt);
    }),
  usageLimit: Yup.number().transform(emptyToUndef).typeError("Enter a whole number").integer("Must be a whole number").positive("Must be greater than 0").nullable(),
});

type OfferForm = {
  title: string;
  description: string;
  discountType: "percentage" | "flat";
  discountValue: string;
  minOrderAmount: string;
  maxDiscount: string;
  startsAt: string;
  endsAt: string;
  usageLimit: string;
};

type Filter = "current" | "ended";

/** YYYY-MM-DD in the device's time zone (toISOString is UTC: before 5:30 am IST it gave yesterday). */
const localDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const ProviderDealsTab = () => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<ProviderOfferFull | null>(null);
  // Remounts the form each time the sheet opens so it starts from fresh values.
  const [formSession, setFormSession] = useState(0);
  const [filter, setFilter] = useState<Filter>("current");
  // Pay-on-publish: a successful payment in the current create session. Lets a
  // retry after a failed save skip re-charging, and only resets once an offer
  // is actually created — so closing the form before publishing never charges.
  const [paidThisSession, setPaidThisSession] = useState(false);
  const [dealPaying, setDealPaying] = useState(false);

  const { data: offers = [], isLoading } = useMyOffers();
  const { data: limits } = useOfferLimits();
  const { data: dealInfo } = useDealCreationInfo();
  const { data: monetizationConfig } = useMonetizationConfig();
  const { notify } = useNotification();
  const createMutation = useCreateOffer();
  const updateMutation = useUpdateOffer();
  const deleteMutation = useDeleteOffer();
  const { purchaseDealCreation } = usePayment();

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const monetizationEnabled =
    monetizationConfig?.flags.dealsMonetizationEnabled ?? false;
  // -1 means unlimited live offers.
  const canCreateActive = limits
    ? limits.maxActiveDeals === -1 || limits.activeDeals < limits.maxActiveDeals
    : true;

  // At the hard total-offer cap, no payment can create a new offer — the provider
  // must upgrade or free a slot (the backend rejects creation). Never charge here.
  const atHardCap =
    !!limits && limits.maxTotalDeals !== -1 && limits.totalDeals >= limits.maxTotalDeals;

  // A brand-new offer needs payment when monetization is on, the provider is out
  // of free quota, isn't a Pro subscriber, and is still under the hard cap.
  const needsDealPayment =
    monetizationEnabled &&
    !!dealInfo &&
    dealInfo.freeRemaining <= 0 &&
    !dealInfo.isProSubscriber &&
    !atHardCap;

  const dealFee = dealInfo?.isGrowthSubscriber
    ? monetizationConfig?.dealPricing.discountedPrice
    : monetizationConfig?.dealPricing.price;

  // Always open the form directly — the fee (if any) is charged on Publish, not
  // before. This way closing the form without publishing never charges.
  const handleAdd = () => {
    setEditing(null);
    setFormSession((n) => n + 1);
    setSheetOpen(true);
  };

  const handleEdit = (offer: ProviderOfferFull) => {
    setEditing(offer);
    setFormSession((n) => n + 1);
    setSheetOpen(true);
  };

  // Quick "Delete" on a card: same confirmation + mutation as inside the sheet.
  const handleAskDelete = (offer: ProviderOfferFull) => {
    setEditing(offer);
    setDeleteOpen(true);
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

  const closeSheet = () => !isSaving && setSheetOpen(false);

  const activeOffers = offers.filter(isOfferActive);
  const upcomingOffers = offers.filter(isOfferUpcoming);
  const expiredOffers = offers.filter(isOfferExpired);
  // Switched off by the owner/admin but not yet ended — shown as "Paused".
  const pausedOffers = offers.filter(
    (o) => !isOfferActive(o) && !isOfferUpcoming(o) && !isOfferExpired(o),
  );
  const currentOffers = [...activeOffers, ...upcomingOffers, ...pausedOffers];
  const shown = filter === "current" ? currentOffers : expiredOffers;

  // Display-only numbers for the plan card.
  const activeUsed = limits?.activeDeals ?? 0;
  const activeMax = limits?.maxActiveDeals ?? 0;
  const totalUsed = limits?.totalDeals ?? 0;
  const totalMax = limits?.maxTotalDeals ?? 0;
  const limitWarn =
    !!limits && ((limits.requiresPayment && monetizationEnabled) || !canCreateActive);

  const header = (
    <>
      <SectionHeader
        title="Offers"
        subtitle="Offers show on your page and in the app's Deals section — a simple way to win new customers."
      />
    </>
  );

  if (isLoading) {
    return (
      <ManagePage>
        {header}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-[112px] bg-white dark:bg-slate-900 rounded-2xl ring-1 ring-slate-200/70 dark:ring-slate-800 animate-pulse"
          />
        ))}
      </ManagePage>
    );
  }

  return (
    <ManagePage>
      {header}

      {/* Plan usage */}
      {limits && (
        <Card className={limitWarn ? "!ring-amber-300/80 dark:!ring-amber-700/70" : ""}>
          <div className="flex items-center gap-3">
            <span
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                limitWarn
                  ? "bg-amber-50 dark:bg-amber-900/40"
                  : "bg-gradient-to-br from-amber-50 to-rose-50 dark:from-amber-900/30 dark:to-rose-900/30"
              }`}
            >
              <IonIcon
                icon={limitWarn ? lockClosedOutline : pricetagOutline}
                className={`text-[19px] ${limitWarn ? "text-amber-600 dark:text-amber-300" : "text-orange-500 dark:text-orange-300"}`}
              />
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[14px] font-bold text-slate-900 dark:text-white">Your offer slots</p>
                {dealInfo && !monetizationEnabled && (
                  <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    Free tier
                  </span>
                )}
              </div>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                {activeMax === -1
                  ? "No limit on how many offers can be live."
                  : `Up to ${activeMax} offer${activeMax === 1 ? "" : "s"} can be live at the same time.`}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-3.5">
            <UsageMeter label="Live now" used={activeUsed} max={activeMax} tone="warm" />
            <UsageMeter label="Created" used={totalUsed} max={totalMax} tone="brand" />
          </div>

          {/* Monetization enabled + limit reached: show buy CTA */}
          {limits.requiresPayment && monetizationEnabled && (
            <button
              type="button"
              onClick={handleAdd}
              className="mt-4 w-full h-11 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-[13.5px] font-bold flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/25"
            >
              <IonIcon icon={diamondOutline} className="text-[16px]" />
              {dealInfo?.freeRemaining === 0
                ? `Create Offer ₹${monetizationConfig?.dealPricing.price ?? 149}`
                : "Upgrade to Add More Offers"}
            </button>
          )}
          {/* Monetization disabled but total limit reached */}
          {!monetizationEnabled && limits.totalDeals >= limits.maxTotalDeals && (
            <Notice tone="amber">
              You&apos;ve reached the maximum of <b>{limits.maxTotalDeals} offers</b>. Delete an expired or paused
              offer to free up a slot.
            </Notice>
          )}
          {/* Active limit reached (regardless of monetization) */}
          {!canCreateActive && limits.totalDeals < limits.maxTotalDeals && (
            <Notice tone="rose">
              All <b>{limits.maxActiveDeals} live slots</b> are in use. Delete a live offer, or wait for one to end,
              before another can go live.
            </Notice>
          )}
        </Card>
      )}

      {offers.length === 0 ? (
        <EmptyState
          icon={pricetagOutline}
          title="No offers yet"
          body="Create your first offer — like “10% off this week” — and it will show on your page and in Deals."
          action={
            <PrimaryButton icon={addOutline} onClick={handleAdd}>
              Create your first offer
            </PrimaryButton>
          }
        />
      ) : (
        <>
          <Segmented<Filter>
            value={filter}
            onChange={setFilter}
            options={[
              { value: "current", label: `Live & upcoming (${currentOffers.length})` },
              { value: "ended", label: `Ended (${expiredOffers.length})` },
            ]}
          />

          {shown.length === 0 ? (
            <Card className="!text-center !py-7">
              <p className="text-[14px] font-bold text-slate-800 dark:text-white">
                {filter === "current" ? "Nothing live right now" : "No ended offers"}
              </p>
              <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1 max-w-[260px] mx-auto leading-relaxed">
                {filter === "current"
                  ? "Create a new offer to start bringing in customers again."
                  : "Offers move here automatically after their end date."}
              </p>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {shown.map((offer, i) => (
                <OfferTicket
                  key={offer.id}
                  offer={offer}
                  index={i}
                  onEdit={handleEdit}
                  onDelete={handleAskDelete}
                />
              ))}
            </div>
          )}

          {currentOffers.length > 0 && (
            <div className="mt-4">
              <BoostNudge
                id="offers"
                title="Get more people to see your offer"
                body="An offer only works if people see it. Boost shows your business first to customers nearby."
              />
            </div>
          )}

          <StickyActionBar>
            <PrimaryButton icon={addOutline} onClick={handleAdd} full>
              Create an offer
            </PrimaryButton>
          </StickyActionBar>
        </>
      )}

      {/* Create / edit sheet */}
      <Formik<OfferForm>
        key={formSession}
        initialValues={{
          title: editing?.title ?? "",
          description: editing?.description ?? "",
          discountType: editing?.discountType ?? "percentage",
          discountValue: editing?.discountValue?.toString() ?? "",
          minOrderAmount: editing?.minOrderAmount?.toString() ?? "",
          maxDiscount: editing?.maxDiscount?.toString() ?? "",
          startsAt: localDay(editing ? new Date(editing.startsAt) : new Date()),
          endsAt: editing ? localDay(new Date(editing.endsAt)) : "",
          usageLimit: editing?.usageLimit?.toString() ?? "",
        }}
        validationSchema={offerSchema}
        onSubmit={async (values) => {
          // Content sanitization
          const titleCheck = checkContent(values.title);
          const descCheck = checkContent(values.description || "");
          if (titleCheck.flagged || descCheck.flagged) {
            notify({
              title: "Inappropriate content",
              subtitle: "Please revise your offer title or description.",
              variant: "error",
            });
            return;
          }

          // Pay-on-publish: only charge when actually publishing a new
          // offer, and only once per session — so closing the form
          // before publishing never charges, and a failed save after
          // doesn't double-charge.
          if (!editing && needsDealPayment && !paidThisSession) {
            try {
              setDealPaying(true);
              await purchaseDealCreation();
              setPaidThisSession(true);
            } catch (err: unknown) {
              notify({
                title: "Payment required",
                subtitle:
                  (err instanceof Error && err.message) ||
                  "Payment was cancelled. No charge was made.",
                variant: "error",
              });
              return; // keep form open; nothing created, no charge kept
            } finally {
              setDealPaying(false);
            }
          }

          const payload = {
            title: values.title.trim(),
            description: values.description?.trim() || undefined,
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
          // Offer created — consume the paid session so the next new
          // offer is charged again as expected.
          setPaidThisSession(false);
          setSheetOpen(false);
          setEditing(null);
        }}
      >
        {({ values, errors, touched, setFieldValue, submitForm }) => {
          const err = (k: keyof OfferForm) => fieldError(errors, touched, k);
          const pct = values.discountType === "percentage";
          return (
            <ManageSheet
              open={sheetOpen}
              onClose={closeSheet}
              title={editing ? "Edit offer" : "New offer"}
              subtitle={editing ? "Changes show to customers right away." : "Takes about a minute."}
              footer={
                <div className="flex flex-col gap-2">
                  {(createMutation.isError || updateMutation.isError) && (
                    <p className="text-[12px] font-medium text-rose-500 text-center">
                      {apiErrorMessage(createMutation.error || updateMutation.error) ||
                        "Something went wrong. Please try again."}
                    </p>
                  )}
                  <div className="flex gap-2.5">
                    {editing && (
                      <button
                        type="button"
                        onClick={() => setDeleteOpen(true)}
                        aria-label="Delete offer"
                        className="w-12 h-12 shrink-0 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 ring-1 ring-rose-100 dark:ring-rose-900/60 flex items-center justify-center"
                      >
                        <IonIcon icon={trashOutline} className="text-[19px]" />
                      </button>
                    )}
                    <PrimaryButton
                      full
                      onClick={submitForm}
                      loading={isSaving || dealPaying}
                      className="flex-1"
                    >
                      {dealPaying
                        ? "Processing payment…"
                        : isSaving
                        ? editing
                          ? "Saving…"
                          : "Publishing…"
                        : editing
                        ? "Save changes"
                        : needsDealPayment && !paidThisSession
                        ? `Pay ₹${dealFee ?? ""} & Publish`
                        : "Publish offer"}
                    </PrimaryButton>
                  </div>
                </div>
              }
            >
              <Form className="flex flex-col gap-5" noValidate>
                {/* Live preview of the coupon customers will see */}
                <div className="flex items-stretch rounded-2xl overflow-hidden ring-1 ring-slate-200/70 dark:ring-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <CouponStub status="live" type={values.discountType} value={values.discountValue} compact />
                  <div className="flex-1 min-w-0 px-3.5 py-3 flex flex-col justify-center border-l-2 border-dashed border-slate-200 dark:border-slate-700">
                    <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Preview
                    </p>
                    <p className="text-[14px] font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 mt-0.5">
                      {values.title.trim() || "Your offer title"}
                    </p>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {values.endsAt ? `Valid till ${formatDate(values.endsAt)}` : "Pick an end date below"}
                    </p>
                  </div>
                </div>

                {/* One-time fee notice (pay-on-publish) */}
                {!editing && needsDealPayment && (
                  <Notice tone="amber" icon={diamondOutline} title={`One-time fee: ₹${dealFee ?? ""}`} flush>
                    You&apos;ve used your free offers. You&apos;re only charged when you publish — close this form
                    anytime before publishing and you won&apos;t be charged.
                  </Notice>
                )}

                {/* Active deals limit warning */}
                {!editing && !canCreateActive && (
                  <Notice tone="rose" title="Live limit reached" flush>
                    You already have {limits?.maxActiveDeals ?? 3} live offers. Your new offer will be created but
                    only goes live when another ends or is switched off.
                  </Notice>
                )}

                <FieldBlock label="Offer title" hint="Short and clear works best, e.g. “20% off all services”." error={err("title")}>
                  <Field id="title" name="title" placeholder="e.g. 20% off all services" className={inputCls} />
                </FieldBlock>

                <FieldBlock label="Type of discount">
                  <Segmented<"percentage" | "flat">
                    value={values.discountType}
                    onChange={(v) => setFieldValue("discountType", v)}
                    options={[
                      { value: "percentage", label: "Percent off (%)" },
                      { value: "flat", label: "Amount off (₹)" },
                    ]}
                  />
                </FieldBlock>

                <FieldBlock
                  label={pct ? "How much off?" : "How many rupees off?"}
                  hint={pct ? "Enter a number from 1 to 100." : "The amount taken off the bill."}
                  error={err("discountValue")}
                >
                  <Affix prefix={pct ? undefined : "₹"} suffix={pct ? "%" : undefined}>
                    <Field
                      id="discountValue"
                      name="discountValue"
                      type="number"
                      inputMode="decimal"
                      placeholder={pct ? "e.g. 20" : "e.g. 100"}
                      className={`${inputCls} ${pct ? "pr-9" : "pl-8"}`}
                    />
                  </Affix>
                </FieldBlock>

                {/* Dates — gap keeps the two native date controls apart on iOS */}
                <div className="grid grid-cols-2 gap-3">
                  <FieldBlock label="Starts on" error={err("startsAt")}>
                    <Field id="startsAt" name="startsAt" type="date" className={dateCls} />
                  </FieldBlock>
                  <FieldBlock label="Ends on" error={err("endsAt")}>
                    <Field id="endsAt" name="endsAt" type="date" className={dateCls} />
                  </FieldBlock>
                </div>

                <FieldBlock
                  label="Details"
                  optional
                  hint="Any conditions customers should know, e.g. “Weekends only”."
                  error={err("description")}
                >
                  <Field
                    id="description"
                    name="description"
                    as="textarea"
                    rows={3}
                    placeholder="e.g. Valid on weekends only, for orders above ₹500…"
                    className={textareaCls}
                  />
                </FieldBlock>

                {/* Extra rules */}
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-200/70 dark:ring-slate-800 p-4 flex flex-col gap-4">
                  <div className="flex items-start gap-2">
                    <IonIcon icon={informationCircleOutline} className="text-[16px] text-slate-400 mt-px shrink-0" />
                    <p className="text-[12.5px] text-slate-500 dark:text-slate-400 leading-snug">
                      <b className="text-slate-700 dark:text-slate-200">Extra rules · optional.</b> Leave these empty
                      if the offer has no conditions.
                    </p>
                  </div>
                  <div className={`grid gap-3 ${pct ? "grid-cols-2" : "grid-cols-1"}`}>
                    <FieldBlock label="Minimum bill" error={err("minOrderAmount")}>
                      <Affix prefix="₹">
                        <Field
                          id="minOrderAmount"
                          name="minOrderAmount"
                          type="number"
                          inputMode="decimal"
                          placeholder="500"
                          className={`${inputCls} pl-8 bg-white dark:bg-slate-900`}
                        />
                      </Affix>
                    </FieldBlock>
                    {pct && (
                      <FieldBlock label="Max discount" error={err("maxDiscount")}>
                        <Affix prefix="₹">
                          <Field
                            id="maxDiscount"
                            name="maxDiscount"
                            type="number"
                            inputMode="decimal"
                            placeholder="200"
                            className={`${inputCls} pl-8 bg-white dark:bg-slate-900`}
                          />
                        </Affix>
                      </FieldBlock>
                    )}
                  </div>
                  <FieldBlock
                    label="How many times can it be used?"
                    hint={
                      editing && editing.usageCount > 0
                        ? `Used ${editing.usageCount} time${editing.usageCount === 1 ? "" : "s"} so far. Leave empty for no limit.`
                        : "Leave empty for no limit."
                    }
                    error={err("usageLimit")}
                  >
                    <Field
                      id="usageLimit"
                      name="usageLimit"
                      type="number"
                      inputMode="decimal"
                      placeholder="e.g. 50"
                      className={`${inputCls} bg-white dark:bg-slate-900`}
                    />
                  </FieldBlock>
                </div>
              </Form>
            </ManageSheet>
          );
        }}
      </Formik>

      {/* Delete Confirmation Dialog */}
      <AppDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Offer"
        description="Are you sure you want to delete this offer? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmColor="red"
        isLoading={deleteMutation.isPending}
        loadingLabel="Deleting..."
        onConfirm={() => editing && handleDelete(editing.id)}
      />
    </ManagePage>
  );
};

export default ProviderDealsTab;

// ─── Small pieces ───────────────────────────────────────────────────────

// min-w-0 + max-w-full keep native date inputs from forcing the field wider
// than its grid cell (which caused horizontal scroll & overlap on iOS).
const dateCls = `${inputCls} min-w-0 max-w-full box-border appearance-none px-3 text-[13.5px]`;

function fieldError(
  errors: FormikErrors<OfferForm>,
  touched: FormikTouched<OfferForm>,
  k: keyof OfferForm,
) {
  return touched[k] && errors[k] ? errors[k] : undefined;
}

/** An input with a fixed "₹" in front or "%" behind it. */
function Affix({
  prefix,
  suffix,
  children,
}: {
  prefix?: string;
  suffix?: string;
  children: ReactNode;
}) {
  return (
    <div className="relative min-w-0">
      {prefix && (
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] font-semibold text-slate-400 dark:text-slate-500 pointer-events-none">
          {prefix}
        </span>
      )}
      {children}
      {suffix && (
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[14px] font-semibold text-slate-400 dark:text-slate-500 pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  );
}

function Notice({
  tone,
  icon = alertCircleOutline,
  title,
  flush,
  children,
}: {
  tone: "amber" | "rose";
  icon?: string;
  title?: string;
  flush?: boolean;
  children: ReactNode;
}) {
  const t =
    tone === "amber"
      ? {
          box: "bg-amber-50 dark:bg-amber-900/25 ring-amber-200/80 dark:ring-amber-800/60",
          icon: "text-amber-500 dark:text-amber-400",
          title: "text-amber-900 dark:text-amber-200",
          body: "text-amber-800/90 dark:text-amber-200/80",
        }
      : {
          box: "bg-rose-50 dark:bg-rose-950/40 ring-rose-200/80 dark:ring-rose-900/60",
          icon: "text-rose-500 dark:text-rose-400",
          title: "text-rose-800 dark:text-rose-200",
          body: "text-rose-700/90 dark:text-rose-200/80",
        };
  return (
    <div className={`${flush ? "" : "mt-3.5"} flex items-start gap-2.5 p-3 rounded-xl ring-1 ${t.box}`}>
      <IonIcon icon={icon} className={`text-[17px] mt-px shrink-0 ${t.icon}`} />
      <div className="min-w-0">
        {title && <p className={`text-[13px] font-bold ${t.title}`}>{title}</p>}
        <p className={`text-[12.5px] leading-relaxed ${t.body} ${title ? "mt-0.5" : ""}`}>{children}</p>
      </div>
    </div>
  );
}
