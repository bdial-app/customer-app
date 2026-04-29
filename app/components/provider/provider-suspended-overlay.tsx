"use client";
import { motion } from "framer-motion";
import { IonIcon } from "@ionic/react";
import { banOutline, mailOutline, storefrontOutline } from "ionicons/icons";
import { useAppContext } from "@/app/context/AppContext";

const SUPPORT_EMAIL = "support@tijarahconnect.com";

const ProviderSuspendedOverlay = () => {
  const { setUserMode } = useAppContext();

  const handleContactSupport = () => {
    const subject = encodeURIComponent("Provider Suspension Review Request");
    const body = encodeURIComponent(
      "Hello Support Team,\n\nI would like to request a review of my provider account suspension.\n\nPlease let me know the reason and next steps.\n\nThank you."
    );
    window.open(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`, "_self");
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-sm flex items-center justify-center p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm py-4"
      >
        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
            <IonIcon icon={banOutline} className="text-4xl text-red-500" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-center text-xl font-bold text-slate-900 mb-2">
          Account Suspended
        </h2>

        {/* Description */}
        <p className="text-center text-sm text-slate-500 leading-relaxed mb-6">
          Your provider profile has been suspended by our moderation team. You
          cannot access your provider dashboard or manage your listings while
          suspended.
        </p>

        {/* Info card */}
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-4">
          <h4 className="text-xs font-bold text-red-800 mb-1.5">
            What does this mean?
          </h4>
          <ul className="text-[11px] text-red-700/80 space-y-1 leading-relaxed">
            <li>• Your provider profile is hidden from all listings</li>
            <li>• Customers cannot view or contact your business</li>
            <li>• Your products and offers are not visible</li>
          </ul>
        </div>

        {/* How to get reinstated */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-6">
          <h4 className="text-xs font-bold text-slate-800 mb-1">
            How to get reinstated?
          </h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Contact our support team to understand the reason and request a review.
          </p>
        </div>

        {/* Contact Support Button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleContactSupport}
          className="w-full flex items-center justify-center gap-2.5 bg-teal-600 text-white rounded-2xl px-4 py-3.5 mb-3 font-semibold text-sm shadow-sm active:bg-teal-700 transition-colors"
        >
          <IonIcon icon={mailOutline} className="text-lg shrink-0" />
          Contact Support
        </motion.button>

        {/* Back to Customer View Button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setUserMode("customer")}
          className="w-full flex items-center justify-center gap-2.5 bg-white border border-slate-200 text-slate-700 rounded-2xl px-4 py-3.5 font-semibold text-sm active:bg-slate-50 transition-colors"
        >
          <IonIcon icon={storefrontOutline} className="text-lg shrink-0 text-slate-500" />
          Switch to Customer View
        </motion.button>

        {/* Subtle note */}
        <p className="text-center text-[10px] text-slate-400 mt-5">
          If you believe this is a mistake, please reach out and we&apos;ll review your case as soon as possible.
        </p>
      </motion.div>
    </div>
  );
};

export default ProviderSuspendedOverlay;

