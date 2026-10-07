"use client";
import { useState, useRef, useEffect } from "react";
import { IonIcon } from "@ionic/react";
import {
  addOutline,
  trashOutline,
  cubeOutline,
  eyeOutline,
  shareSocialOutline,
  star,
  alertCircleOutline,
  informationCircleOutline,
  checkmarkOutline,
} from "ionicons/icons";
import Link from "next/link";
import { ROUTE_PATH } from "@/utils/contants";
import { useShareCatalogue } from "@/hooks/useShare";
import { Formik, Form, Field } from "formik";
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
import {
  ManagePage,
  SectionHeader,
  HowItWorks,
  EmptyState,
  PrimaryButton,
  SecondaryButton,
  StickyActionBar,
  Segmented,
  GroupLabel,
  Card,
  ManageSheet,
  FieldBlock,
  inputCls,
  textareaCls,
  Pill,
} from "./manage/kit";
import { UnifiedCategoryPicker } from "./manage/catalogue-category-picker";
import { optimizeImages, UploadFileError } from "@/utils/compress-image";
import { BoostNudge } from "./manage/boost";
import {
  CatalogueItemCard,
  TypeChoice,
  PhotoPicker,
  InstantToggle,
  MAX_HERO,
  MAX_PHOTOS,
} from "./manage/catalogue-parts";

interface ProviderProductsTabProps {
  products: ProviderDetailsProduct[];
  providerId: string | null;
  /** Open the add sheet straight away with this type preset (e.g. from a dashboard shortcut). Re-fires when nonce changes. */
  autoAdd?: { type: "product" | "service"; nonce: number } | null;
  onAutoAddConsumed?: () => void;
}

/** A product being edited; the API also returns its search keywords. */
type EditableProduct = ProviderDetailsProduct & { keywords?: string[] };

type Filter = "all" | "product" | "service" | "hidden";

const productSchema = Yup.object({
  name: Yup.string().required("Product name is required").max(150),
  price: Yup.string().nullable(),
  description: Yup.string().max(2000).nullable(),
  currency: Yup.string().oneOf(["INR", "USD"]).default("INR"),
  productType: Yup.string().oneOf(["product", "service"]).default("product"),
  categoryId: Yup.string().nullable(),
  subcategoryId: Yup.string().nullable(),
  keywords: Yup.string().nullable(),
});

const ProviderProductsTab = ({
  products,
  providerId,
  autoAdd,
  onAutoAddConsumed,
}: ProviderProductsTabProps) => {
  // Your whole catalogue as one link (built only when you tap Share).
  const { share: shareCatalogue, busy: sharingCatalogue } = useShareCatalogue(providerId ?? undefined, {
    asOwner: true,
    prefetch: false,
  });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<EditableProduct | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [catNames, setCatNames] = useState({ category: "", subcategory: "", parent: "" });
  const [photoError, setPhotoError] = useState<string | null>(null);
  // Remounts the form on every open so it always starts fresh.
  const [formKey, setFormKey] = useState(0);
  const [contentFlagged, setContentFlagged] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  // Type a brand-new item starts as (only differs when opened via autoAdd).
  const [presetType, setPresetType] = useState<"product" | "service">("product");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const isSaving = createMutation.isPending || updateMutation.isPending || isUploading;

  const handleAdd = (type: "product" | "service" = "product") => {
    setEditing(null);
    setPresetType(type);
    setPhotoFiles([]);
    setPhotoPreviews([]);
    setPhotoError(null);
    setContentFlagged(false);
    setCatNames({ category: "", subcategory: "", parent: "" });
    setFormKey((k) => k + 1);
    setSheetOpen(true);
  };

  const handleEdit = (p: ProviderDetailsProduct) => {
    setEditing(p);
    setPhotoFiles([]);
    // Load existing photos from photoUrls (or fallback to photoUrl)
    const existing = p.photoUrls?.length ? [...p.photoUrls] : p.photoUrl ? [p.photoUrl] : [];
    setPhotoPreviews(existing);
    setPhotoError(null);
    setContentFlagged(false);
    setCatNames({ category: "", subcategory: "", parent: "" });
    setFormKey((k) => k + 1);
    setSheetOpen(true);
  };

  // Shortcut from elsewhere (dashboard): jump straight into the add form.
  const autoAddNonce = autoAdd?.nonce;
  const handledNonce = useRef<number | null>(null);
  useEffect(() => {
    if (autoAdd && providerId && handledNonce.current !== autoAdd.nonce) {
      handledNonce.current = autoAdd.nonce;
      handleAdd(autoAdd.type);
      onAutoAddConsumed?.();
    }
    // Fire once per nonce; the other values are read at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAddNonce, providerId]);

  const closeSheet = () => {
    if (!isSaving) setSheetOpen(false);
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
  const heroFull = heroCount >= MAX_HERO;

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (files.length === 0) return;
    setPhotoError(null);

    const slotsLeft = MAX_PHOTOS - photoPreviews.length;
    if (slotsLeft <= 0) {
      setPhotoError("Maximum 5 photos allowed.");
      return;
    }
    const toAdd = files.slice(0, slotsLeft);

    // Shrink each photo now, so the preview is exactly what will be uploaded.
    let compressed: File[];
    try {
      compressed = await optimizeImages(toAdd, "product");
    } catch (err) {
      setPhotoError(err instanceof UploadFileError ? err.message : "Couldn't add that photo. Please try another.");
      return;
    }
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
  const counts: Record<Filter, number> = {
    all: products.length,
    product: products.filter((p) => p.productType !== "service").length,
    service: products.filter((p) => p.productType === "service").length,
    hidden: products.length - activeCount,
  };
  const visible = products.filter((p) =>
    filter === "all" ? true
      : filter === "hidden" ? !p.isActive
        : filter === "service" ? p.productType === "service"
          : p.productType !== "service",
  );
  // The list refreshes after a quick change; read star/visibility from it.
  const live = editing ? products.find((p) => p.id === editing.id) ?? editing : null;
  const canPreview = !!providerId && activeCount > 0;

  const filterLabel = (label: string, n: number) => (
    <span>
      {label}
      <span className="ml-1 opacity-50 tabular-nums">{n}</span>
    </span>
  );

  const emptyFilterText: Record<Filter, string> = {
    all: "",
    product: "No products yet — everything here is a service.",
    service: "No services yet — everything here is a product.",
    hidden: "Nothing is hidden. Customers can see all your items.",
  };

  // First-timer guide: above the list, or below the empty-state button.
  const guide = (
    <HowItWorks
      id="catalogue"
      title="How your catalogue works"
      steps={[
        <>Tap <b>Add product or service</b> and give it a clear name.</>,
        <>Add a few good photos and a price — or leave the price empty to show &ldquo;Price on request&rdquo;.</>,
        <>Tap <b>Star it</b> on your best {MAX_HERO} items — they show first on your page.</>,
        <>Use <b>Hide</b> to take something off your page without deleting it.</>,
      ]}
    />
  );

  return (
    <ManagePage>
      <SectionHeader
        title="Your catalogue"
        subtitle="What customers can buy or book from you"
      />

      {canPreview && (
        <div className="grid grid-cols-2 gap-2 -mt-1">
          <Link
            href={`${ROUTE_PATH.SHOP}?id=${providerId}`}
            className="h-11 inline-flex items-center justify-center gap-1.5 rounded-xl font-bold text-[13px] bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 ring-1 ring-slate-200 dark:ring-slate-700 active:scale-[0.97] transition-transform"
          >
            <IonIcon icon={eyeOutline} className="text-[16px]" />
            See as customer
          </Link>
          <SecondaryButton
            icon={shareSocialOutline}
            onClick={() => void shareCatalogue()}
            loading={sharingCatalogue}
            className="!h-11 !text-[13px]"
          >
            Share catalogue
          </SecondaryButton>
        </div>
      )}

      {!providerId && (
        <Card className="!p-3.5 flex items-start gap-2.5 !bg-amber-50 dark:!bg-amber-950/40 !ring-amber-200 dark:!ring-amber-900/60">
          <IonIcon icon={informationCircleOutline} className="text-[18px] text-amber-600 dark:text-amber-300 shrink-0 mt-px" />
          <p className="text-[13px] text-amber-900 dark:text-amber-100 leading-snug">
            Set up your business profile first, then you can add products and services here.
          </p>
        </Card>
      )}

      {products.length > 0 && guide}

      {products.length > 0 ? (
        <>
          {products.length >= 3 && (
            <Segmented<Filter>
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: filterLabel("All", counts.all) },
                { value: "product", label: filterLabel("Products", counts.product) },
                { value: "service", label: filterLabel("Services", counts.service) },
                { value: "hidden", label: filterLabel("Hidden", counts.hidden) },
              ]}
            />
          )}

          <GroupLabel
            action={
              <span className="inline-flex items-center gap-1 text-[11.5px] font-bold text-amber-600 dark:text-amber-300">
                <IonIcon icon={star} className="text-[12px]" />
                {heroCount} of {MAX_HERO} starred
              </span>
            }
          >
            {activeCount} showing{counts.hidden > 0 ? ` · ${counts.hidden} hidden` : ""}
          </GroupLabel>

          {visible.length > 0 ? (
            <div className="flex flex-col gap-3">
              {visible.map((p, i) => (
                <CatalogueItemCard
                  key={p.id}
                  product={p}
                  index={i}
                  heroFull={heroFull}
                  busy={updateMutation.isPending}
                  onEdit={() => handleEdit(p)}
                  onToggleHero={() => handleToggleHero(p)}
                  onToggleActive={() => handleToggleActive(p)}
                />
              ))}
            </div>
          ) : (
            <Card className="text-center !py-8">
              <p className="text-[13.5px] text-slate-500 dark:text-slate-400">{emptyFilterText[filter]}</p>
              <button type="button" onClick={() => setFilter("all")} className="mt-2 h-10 px-3 text-[13px] font-bold text-indigo-600 dark:text-indigo-300">
                Show all items
              </button>
            </Card>
          )}

          {activeCount >= 2 && (
            <div className="mt-4">
              <BoostNudge
                id="catalogue"
                title={`Put your ${activeCount} items in front of more people`}
                body="Boost shows your business first when customers nearby search for what you sell."
              />
            </div>
          )}

          {providerId && (
            <StickyActionBar>
              <PrimaryButton icon={addOutline} full onClick={() => handleAdd()}>
                Add product or service
              </PrimaryButton>
            </StickyActionBar>
          )}
        </>
      ) : (
        <EmptyState
          icon={cubeOutline}
          title="Nothing in your catalogue yet"
          body="Add what you sell or the services you offer, so customers know what they can get from you."
          action={
            <PrimaryButton icon={addOutline} onClick={() => handleAdd()} disabled={!providerId}>
              Add your first item
            </PrimaryButton>
          }
        />
      )}
      {products.length === 0 && guide}

      {/* Add/Edit sheet. Keyed so each open starts with a fresh form. */}
      <Formik
        key={formKey}
        initialValues={{
          name: editing?.name || "",
          description: editing?.description || "",
          price: editing?.price != null ? String(editing.price) : "",
          currency: editing?.currency || "INR",
          productType: editing?.productType || presetType,
          categoryId: editing?.categoryId || "",
          subcategoryId: editing?.subcategoryId || "",
          keywords: editing?.keywords?.join(", ") || "",
        }}
        validationSchema={productSchema}
        enableReinitialize
        onSubmit={async (values) => {
          // Content sanitization
          const nameCheck = checkContent(values.name);
          const descCheck = checkContent(values.description || "");
          if (nameCheck.flagged || descCheck.flagged) {
            setContentFlagged(true);
            return;
          }
          setContentFlagged(false);

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
            categoryId: values.categoryId || undefined,
            subcategoryId: values.subcategoryId || undefined,
            photoUrl: photoUrls[0] || undefined,
            photoUrls,
            keywords: values.keywords
              ? values.keywords.split(",").map((k: string) => k.trim().toLowerCase()).filter(Boolean)
              : undefined,
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
        {({ values, setFieldValue, isValid, dirty, errors, touched, submitForm }) => {
          const isService = values.productType === "service";
          const hasPrice = values.price != null && String(values.price).trim() !== "";
          const symbol = values.currency === "INR" ? "₹" : "$";
          const keywordChips = (values.keywords || "").split(",").map((k) => k.trim()).filter(Boolean);
          const saveDisabled = !isValid || (!dirty && photoFiles.length === 0 && !editing) || isSaving;

          return (
            <ManageSheet
              open={sheetOpen}
              onClose={closeSheet}
              title={editing ? (editing.productType === "service" ? "Edit service" : "Edit product") : "Add to your catalogue"}
              subtitle={editing ? "Changes show on your page after you save" : "Customers will see this on your page"}
              headerRight={
                editing ? (
                  <button
                    type="button"
                    onClick={() => setDeleteOpen(true)}
                    aria-label="Delete this item"
                    className="w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center shrink-0"
                  >
                    <IonIcon icon={trashOutline} className="text-[17px] text-rose-500" />
                  </button>
                ) : undefined
              }
              footer={
                <div className="flex flex-col gap-2">
                  {contentFlagged && (
                    <p className="text-[12px] font-medium text-rose-500 text-center flex items-center justify-center gap-1">
                      <IonIcon icon={alertCircleOutline} className="text-[14px]" />
                      Please remove inappropriate words from the name or description.
                    </p>
                  )}
                  {(createMutation.isError || updateMutation.isError) && (
                    <p className="text-[12px] font-medium text-rose-500 text-center">Something went wrong. Please try again.</p>
                  )}
                  <PrimaryButton
                    full
                    icon={editing ? checkmarkOutline : addOutline}
                    loading={isSaving}
                    disabled={saveDisabled}
                    onClick={() => void submitForm()}
                  >
                    {isSaving
                      ? isUploading ? "Uploading photos…" : editing ? "Saving…" : "Adding…"
                      : editing ? "Save changes"
                        : isService ? "Add service" : "Add product"}
                  </PrimaryButton>
                </div>
              }
            >
              <Form className="flex flex-col gap-5">
                <FieldBlock label="What is it?">
                  <TypeChoice value={values.productType} onChange={(t) => setFieldValue("productType", t)} />
                </FieldBlock>

                <FieldBlock
                  label={`Photos · ${photoPreviews.length}/${MAX_PHOTOS}`}
                  hint={photoPreviews.length > 0 ? "The first photo is the cover customers see." : undefined}
                >
                  <PhotoPicker
                    previews={photoPreviews}
                    error={photoError}
                    inputRef={fileInputRef}
                    onSelect={handlePhotoSelect}
                    onRemove={removePhoto}
                  />
                </FieldBlock>

                <FieldBlock label={isService ? "Service name" : "Product name"} error={touched.name && errors.name ? errors.name : undefined}>
                  <Field name="name" placeholder="e.g. Custom Rida, Bridal Mehendi, AC Repair" className={inputCls} />
                </FieldBlock>

                <FieldBlock
                  label="Price"
                  optional
                  hint={hasPrice ? undefined : "Leave empty if it varies — customers will see “Price on request”."}
                >
                  <div className="flex gap-2">
                    <div className="relative flex-1 min-w-0">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] font-bold text-slate-400 dark:text-slate-500 pointer-events-none">{symbol}</span>
                      <Field name="price" type="number" inputMode="decimal" placeholder="e.g. 1500" className={`${inputCls} !pl-8`} />
                    </div>
                    <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700 shrink-0" role="radiogroup" aria-label="Currency">
                      {(["INR", "USD"] as const).map((c) => (
                        <button
                          key={c}
                          type="button"
                          role="radio"
                          aria-checked={values.currency === c}
                          disabled={!hasPrice}
                          onClick={() => setFieldValue("currency", c)}
                          className={`w-12 rounded-lg text-[13px] font-bold transition-colors disabled:opacity-40 ${
                            values.currency === c
                              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                              : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {c === "INR" ? "₹" : "$"}
                        </button>
                      ))}
                    </div>
                  </div>
                </FieldBlock>

                <FieldBlock label="Description" optional hint="What’s included, how long it takes, materials used…">
                  <Field
                    as="textarea"
                    name="description"
                    rows={4}
                    placeholder="Tell customers what they get"
                    className={textareaCls}
                  />
                </FieldBlock>

                <FieldBlock label="Category" optional hint="Helps customers find you when they browse.">
                  <UnifiedCategoryPicker
                    categoryId={values.categoryId || ""}
                    subcategoryId={values.subcategoryId || ""}
                    selectedCategoryName={catNames.category}
                    selectedSubcategoryName={catNames.subcategory}
                    selectedParentName={catNames.parent}
                    onSelect={(catId, subId, catName, subName, parentName) => {
                      setFieldValue("categoryId", catId || "");
                      setFieldValue("subcategoryId", subId || "");
                      setCatNames({
                        category: catName || "",
                        subcategory: subName || "",
                        parent: parentName || "",
                      });
                    }}
                  />
                </FieldBlock>

                <FieldBlock label="Search words" optional hint="Words people might search for. Separate them with commas.">
                  <Field name="keywords" placeholder="e.g. rida, abaya, custom stitching" className={inputCls} />
                  {keywordChips.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {keywordChips.map((k, i) => (
                        <Pill key={`${k}-${i}`} tone="indigo">{k}</Pill>
                      ))}
                    </div>
                  )}
                </FieldBlock>

                {live ? (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[12.5px] font-bold text-slate-700 dark:text-slate-200">
                      On your page <span className="font-medium text-slate-400 dark:text-slate-500">· saves instantly</span>
                    </p>
                    <div className="rounded-xl ring-1 ring-slate-200 dark:ring-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
                      <InstantToggle
                        icon={star}
                        tone="amber"
                        title="Star this item"
                        body={`Starred items show first · ${heroCount} of ${MAX_HERO} used`}
                        checked={live.isHero}
                        disabled={updateMutation.isPending || (!live.isHero && heroFull)}
                        onChange={() => handleToggleHero(live)}
                      />
                      <InstantToggle
                        icon={eyeOutline}
                        tone="emerald"
                        title="Show to customers"
                        body={live.isActive ? "Customers can see this item" : "Hidden — only you can see it"}
                        checked={live.isActive}
                        disabled={updateMutation.isPending}
                        onChange={() => handleToggleActive(live)}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-[12px] text-slate-400 dark:text-slate-500 flex items-start gap-1.5">
                    <IonIcon icon={star} className="text-[13px] text-amber-400 shrink-0 mt-px" />
                    After saving, you can star it to show it first on your page.
                  </p>
                )}

                {/* Lets the keyboard's Go/Enter key submit like before. */}
                <button type="submit" hidden disabled={saveDisabled} />
              </Form>
            </ManageSheet>
          );
        }}
      </Formik>

      {/* Delete Confirmation */}
      <AppDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        icon={trashOutline}
        iconColor="text-red-500"
        iconBg="bg-red-50 dark:bg-red-950/50"
        title={editing ? `Delete “${editing.name}”?` : "Delete this item?"}
        description="It will be removed from your catalogue for good. To take it off your page for a while, use Hide instead."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => editing && handleDelete(editing.id)}
        confirmColor="red"
        isLoading={deleteMutation.isPending}
        loadingLabel="Deleting…"
      />
    </ManagePage>
  );
};

export default ProviderProductsTab;
