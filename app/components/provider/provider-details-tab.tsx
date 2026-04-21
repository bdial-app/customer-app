"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IonIcon } from "@ionic/react";
import {
  createOutline,
  callOutline,
  locationOutline,
  timeOutline,
  documentTextOutline,
  checkmarkOutline,
  closeOutline,
  storefrontOutline,
  mapOutline,
} from "ionicons/icons";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { List, Button, Sheet, Page, Navbar, Block } from "konsta/react";
import { FormikInput } from "../formik-input";
import { ProviderData } from "@/services/provider.service";
import { useUpdateProvider } from "@/hooks/useMyProvider";

interface ProviderDetailsTabProps {
  provider: ProviderData;
}

const detailsSchema = Yup.object({
  brandName: Yup.string().required("Brand name is required"),
  description: Yup.string().nullable(),
  contactNumber: Yup.string().required("Phone number is required"),
  address: Yup.string().nullable(),
  city: Yup.string().required("City is required"),
  area: Yup.string().nullable(),
  pincode: Yup.string().matches(/^\d{6}$/, "Must be 6 digits").nullable(),
  openTime: Yup.string().nullable(),
  closeTime: Yup.string().nullable(),
});

const InfoRow = ({
  icon,
  label,
  value,
  onTap,
}: {
  icon: string;
  label: string;
  value: string | null;
  onTap?: () => void;
}) => (
  <motion.div
    whileTap={onTap ? { scale: 0.98, backgroundColor: "#f8fafc" } : undefined}
    onClick={onTap}
    className="flex items-start gap-3 px-4 py-3.5 cursor-pointer"
  >
    <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center shrink-0 mt-0.5">
      <IonIcon icon={icon} className="text-teal-600 text-lg" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm text-slate-800 mt-0.5 leading-relaxed">
        {value || "Not set"}
      </p>
    </div>
  </motion.div>
);

const ProviderDetailsTab = ({ provider }: ProviderDetailsTabProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [detailSheet, setDetailSheet] = useState<{ title: string; content: string } | null>(null);
  const updateMutation = useUpdateProvider();

  const handleSave = async (values: any) => {
    try {
      await updateMutation.mutateAsync({
        id: provider.id,
        payload: {
          brandName: values.brandName,
          description: values.description || undefined,
          contactNumber: values.contactNumber,
          address: values.address || undefined,
          city: values.city,
          area: values.area || undefined,
          pincode: values.pincode || undefined,
          openTime: values.openTime || undefined,
          closeTime: values.closeTime || undefined,
        },
      });
      setIsEditing(false);
    } catch {
      // Error handled by mutation state
    }
  };

  const formatTime = (time: string | null) => {
    if (!time) return null;
    try {
      const [h, m] = time.split(":");
      const hour = parseInt(h);
      const ampm = hour >= 12 ? "PM" : "AM";
      const h12 = hour % 12 || 12;
      return `${h12}:${m} ${ampm}`;
    } catch {
      return time;
    }
  };

  const operatingHours =
    provider.openTime && provider.closeTime
      ? `${formatTime(provider.openTime)} — ${formatTime(provider.closeTime)}`
      : "Not set";

  const fullAddress = [provider.address, provider.area, provider.city, provider.pincode]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="animate-in fade-in duration-300">
      {/* View Mode */}
      <AnimatePresence mode="wait">
        {!isEditing ? (
          <motion.div
            key="view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Section header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <h3 className="text-sm font-bold text-slate-800">Business Details</h3>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-teal-50 active:bg-teal-100"
              >
                <IonIcon icon={createOutline} className="text-teal-600 text-sm" />
                <span className="text-xs font-semibold text-teal-600">Edit</span>
              </motion.button>
            </div>

            <div className="mx-4 bg-white rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-50">
              <InfoRow icon={storefrontOutline} label="Brand Name" value={provider.brandName} />
              <InfoRow
                icon={documentTextOutline}
                label="Description"
                value={provider.description ? (provider.description.length > 60 ? provider.description.slice(0, 60) + "..." : provider.description) : null}
                onTap={provider.description ? () => setDetailSheet({ title: "Description", content: provider.description! }) : undefined}
              />
              <InfoRow icon={callOutline} label="Contact" value={provider.contactNumber} />
              <InfoRow
                icon={locationOutline}
                label="Address"
                value={fullAddress || null}
                onTap={fullAddress ? () => setDetailSheet({ title: "Address", content: fullAddress }) : undefined}
              />
              <InfoRow icon={timeOutline} label="Operating Hours" value={operatingHours} />
            </div>
          </motion.div>
        ) : (
          /* Edit Mode */
          <motion.div
            key="edit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 pt-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800">Edit Details</h3>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsEditing(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
              >
                <IonIcon icon={closeOutline} className="text-slate-500" />
              </motion.button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <Formik
                initialValues={{
                  brandName: provider.brandName || "",
                  description: provider.description || "",
                  contactNumber: provider.contactNumber || "",
                  address: provider.address || "",
                  city: provider.city || "",
                  area: provider.area || "",
                  pincode: provider.pincode || "",
                  openTime: provider.openTime || "",
                  closeTime: provider.closeTime || "",
                }}
                validationSchema={detailsSchema}
                onSubmit={handleSave}
              >
                {({ isValid, dirty, isSubmitting }) => (
                  <Form>
                    <List strongIos insetIos className="!my-0">
                      <FormikInput
                        name="brandName"
                        label="Brand Name"
                        type="text"
                        placeholder="Your business name"
                        media={<IonIcon icon={storefrontOutline} />}
                      />
                      <FormikInput
                        name="description"
                        label="Description"
                        type="textarea"
                        placeholder="Tell customers about your business..."
                        inputClassName="!h-24 resize-none"
                        media={<IonIcon icon={documentTextOutline} />}
                      />
                      <FormikInput
                        name="contactNumber"
                        label="Contact"
                        type="tel"
                        placeholder="+91 98765 43210"
                        media={<IonIcon icon={callOutline} />}
                      />
                      <FormikInput
                        name="address"
                        label="Address"
                        type="text"
                        placeholder="Street address"
                        media={<IonIcon icon={locationOutline} />}
                      />
                      <FormikInput
                        name="city"
                        label="City"
                        type="text"
                        placeholder="City"
                        media={<IonIcon icon={mapOutline} />}
                      />
                      <FormikInput
                        name="area"
                        label="Area"
                        type="text"
                        placeholder="Area / Locality"
                      />
                      <FormikInput
                        name="pincode"
                        label="Pincode"
                        type="text"
                        placeholder="6-digit pincode"
                      />
                      <FormikInput
                        name="openTime"
                        label="Open Time"
                        type="time"
                        placeholder="09:00"
                        media={<IonIcon icon={timeOutline} />}
                      />
                      <FormikInput
                        name="closeTime"
                        label="Close Time"
                        type="time"
                        placeholder="18:00"
                        media={<IonIcon icon={timeOutline} />}
                      />
                    </List>

                    <div className="grid grid-cols-2 gap-3 p-4">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        disabled={!isValid || !dirty || isSubmitting}
                        className="py-3 rounded-xl bg-teal-500 text-white font-semibold text-sm disabled:opacity-50"
                      >
                        {isSubmitting ? "Saving..." : "Save"}
                      </motion.button>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Sheet */}
      <Sheet
        opened={!!detailSheet}
        onBackdropClick={() => setDetailSheet(null)}
        className="pb-safe rounded-t-3xl h-fit min-h-[400px] max-h-[80vh]"
      >
        <Page className="static bg-white">
          <Navbar
            title={detailSheet?.title || ""}
            left={
              <Button clear onClick={() => setDetailSheet(null)}>
                <IonIcon icon={closeOutline} className="w-5 h-5" />
              </Button>
            }
          />
          <Block className="overflow-y-auto mt-4 px-4 pb-8 space-y-4 text-slate-700 leading-relaxed whitespace-pre-wrap">
            {detailSheet?.content}
            {detailSheet?.title === "Address" && detailSheet?.content && (
              <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 shadow-sm relative h-48 w-full bg-slate-100">
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(detailSheet.content)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                />
              </div>
            )}
          </Block>
        </Page>
      </Sheet>
    </div>
  );
};

export default ProviderDetailsTab;
