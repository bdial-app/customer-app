"use client";
import { useState, useEffect, useCallback, memo } from "react";
import { createPortal } from "react-dom";
import {
  Toggle,
} from "konsta/react";
import { IonIcon } from "@ionic/react";
import {
  personOutline,
  callOutline,
  maleOutline,
  businessOutline,
  locationOutline,
  mapOutline,
  createOutline,
  saveOutline,
  closeOutline,
  starOutline,
  checkmarkCircleOutline,
  timeOutline,
  alertCircleOutline,
  repeatOutline,
  chevronForward,
  shieldCheckmarkOutline,
  documentTextOutline,
  informationCircleOutline,
  helpCircleOutline,
  mailOutline,
  logOutOutline,
  trashOutline,
  moonOutline,
  sunnyOutline,
  notificationsOutline,
  lockClosedOutline,
  heartOutline,
  shareOutline,
  bugOutline,
  arrowBack,
  pauseCircleOutline,
  downloadOutline,
  eyeOffOutline,
  eyeOutline,
  powerOutline,
} from "ionicons/icons";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "../context/AppContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { LanguageSelector, LanguageMenuButton } from "./language-selector";
import { type Locale } from "@/i18n/config";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/hooks/useAppStore";
import {
  setProfile as setReduxProfile,
  clearUser,
} from "@/store/slices/authSlice";
import { useUpdateUser } from "@/hooks/useUser";
import { useNotification } from "../context/NotificationContext";
import { Preloader } from "konsta/react";
import { useDispatch } from "react-redux";
import {
  getMyProviderStatus,
  disableMyProvider,
  enableMyProvider,
} from "@/services/provider.service";
import { AppDialog } from "./app-dialog";
import {
  deleteMyAccount,
  pauseMyAccount,
  exportMyData,
} from "@/services/user.service";
import {
  submitBugReport,
  BUG_CATEGORY_LABELS,
  type BugCategory,
} from "@/services/bug-report.service";
import NotificationSettings from "./notification-center/NotificationSettings";
import { useAuthGate } from "@/hooks/useAuthGate";
import { removeItemSync } from "@/utils/storage";

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0";

// ─── Reusable Menu Row ──────────────────────────────────────────────
const MenuRow = ({
  icon,
  iconColor = "text-slate-500",
  iconBg = "bg-slate-100",
  label,
  sublabel,
  trailing,
  danger,
  onClick,
}: {
  icon: string;
  iconColor?: string;
  iconBg?: string;
  label: string;
  sublabel?: string;
  trailing?: React.ReactNode;
  danger?: boolean;
  onClick?: () => void;
}) => (
  <motion.div
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="flex items-center gap-3 px-4 py-3 cursor-pointer active:bg-slate-50 dark:active:bg-slate-700 transition-colors"
  >
    <div
      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg} dark:bg-slate-700`}
    >
      <IonIcon icon={icon} className={`text-lg ${iconColor}`} />
    </div>
    <div className="flex-1 min-w-0">
      <span
        className={`text-sm font-medium ${
          danger ? "text-red-500" : "text-slate-800 dark:text-white"
        }`}
      >
        {label}
      </span>
      {sublabel && (
        <p className="text-[11px] text-slate-400 mt-0.5">{sublabel}</p>
      )}
    </div>
    {trailing ?? (
      <IonIcon icon={chevronForward} className="text-slate-300 text-sm" />
    )}
  </motion.div>
);

// ─── Section Wrapper ────────────────────────────────────────────────
const MenuSection = ({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) => (
  <div className="mb-2">
    {title && (
      <div className="px-4 pt-4 pb-1">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          {title}
        </span>
      </div>
    )}
    <div className="mx-4 bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 divide-y divide-slate-50 dark:divide-slate-700">
      {children}
    </div>
  </div>
);

// ─── Full-Screen Slide Page ─────────────────────────────────────────
const SlidePage = ({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed inset-0 z-[100] bg-white dark:bg-slate-900 overflow-y-auto overscroll-contain"
          style={{ paddingBottom: "var(--sab, env(safe-area-inset-bottom))" }}
        >
          <div
            className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800"
            style={{ paddingTop: "max(var(--sat,0px), 8px)" }}
          >
            <div className="flex items-center justify-between px-4 py-3">
              <button
                onClick={onClose}
                className="text-blue-500 font-semibold text-sm active:opacity-50 flex items-center gap-1"
              >
                <IonIcon icon={arrowBack} className="text-lg" />
                Back
              </button>
              <h2 className="text-base font-bold text-slate-800 dark:text-white">
                {title}
              </h2>
              <div className="w-12" />
            </div>
          </div>
          <div className="px-5 py-5">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

// ─── Main Profile Content ───────────────────────────────────────────
const ProfileContent = memo(() => {
  const {
    providerStatus,
    userMode,
    setProviderStatus,
    setProviderInfo,
    setUserMode,
    toggleMode,
    resetProviderState,
  } = useAppContext();
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user as any);
  const updateUserMutation = useUpdateUser();
  const { notify } = useNotification();
  const { isDark, toggleTheme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [logoutActionSheetOpen, setLogoutActionSheetOpen] = useState(false);
  const [deleteSheetOpen, setDeleteSheetOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pauseSheetOpen, setPauseSheetOpen] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [disableProviderSheetOpen, setDisableProviderSheetOpen] =
    useState(false);
  const [isDisablingProvider, setIsDisablingProvider] = useState(false);

  // Slide-page states
  const [activePage, setActivePage] = useState<
    | "about"
    | "terms"
    | "help"
    | "language"
    | "notificationSettings"
    | "contactUs"
    | "reportBug"
    | null
  >(null);

  const [profile, setProfile] = useState<any>(user || {});

  // Inline name editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(profile.name || "");

  // Sync state if user changes externally
  if (user && user.id !== profile.id) {
    setProfile(user);
  }

  // Fetch real provider status on mount
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    getMyProviderStatus()
      .then((result) => {
        if (!cancelled) {
          setProviderStatus(result.providerStatus as any);
          if (result.provider) {
            setProviderInfo({
              id: result.provider.id,
              brandName: result.provider.brandName,
            });
          }
          if (result.preferredMode) {
            setUserMode(result.preferredMode);
          }
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user?.id, setProviderStatus, setProviderInfo, setUserMode]);

  const dispatch = useDispatch();

  const handleSaveName = async () => {
    const trimmed = editedName.trim();
    if (!trimmed || trimmed.length < 3) {
      notify({
        title: "Invalid Name",
        subtitle: "Name must be at least 3 characters.",
        variant: "error",
      });
      return;
    }
    if (trimmed.length > 100) {
      notify({
        title: "Invalid Name",
        subtitle: "Name must be under 100 characters.",
        variant: "error",
      });
      return;
    }
    if (!/[a-zA-Z]/.test(trimmed)) {
      notify({
        title: "Invalid Name",
        subtitle: "Name must contain at least one letter.",
        variant: "error",
      });
      return;
    }
    if (trimmed === profile.name) {
      setIsEditingName(false);
      return;
    }
    try {
      await updateUserMutation.mutateAsync({ name: trimmed });
      dispatch(setReduxProfile({ ...user, name: trimmed }));
      setProfile({ ...user, name: trimmed });
      notify({
        title: "Name Updated",
        subtitle: "Your name was successfully updated.",
        variant: "success",
      });
      setIsEditingName(false);
    } catch (err: any) {
      notify({
        title: "Update Failed",
        subtitle: err?.response?.data?.message || "Something went wrong.",
        variant: "error",
      });
    }
  };

  const handleApply = () => {
    router.push("/provider-onboarding");
  };

  const handleLogout = () => {
    removeItemSync("user");
    removeItemSync("token");
    dispatch(clearUser());
    resetProviderState();
    setLogoutActionSheetOpen(false);
    router.push("/");
    notify({
      title: "Logged out",
      subtitle: "You have been successfully logged out.",
      variant: "success",
    });
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteMyAccount();
      removeItemSync("user");
      removeItemSync("token");
      dispatch(clearUser());
      resetProviderState();
      setDeleteSheetOpen(false);
      router.push("/");
      notify({
        title: "Account Deleted",
        subtitle: "Your account has been archived. We're sorry to see you go.",
        variant: "success",
      });
    } catch {
      notify({
        title: "Error",
        subtitle: "Failed to delete account. Please try again.",
        variant: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePauseAccount = async () => {
    setIsPausing(true);
    try {
      await pauseMyAccount();
      removeItemSync("user");
      removeItemSync("token");
      dispatch(clearUser());
      resetProviderState();
      setPauseSheetOpen(false);
      router.push("/");
      notify({
        title: "Account Paused",
        subtitle: "Your account is paused. Log in anytime to reactivate.",
        variant: "success",
      });
    } catch {
      notify({
        title: "Error",
        subtitle: "Failed to pause account. Please try again.",
        variant: "error",
      });
    } finally {
      setIsPausing(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const data = await exportMyData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `my-data-export-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      notify({
        title: "Data Exported",
        subtitle: "Your data has been downloaded.",
        variant: "success",
      });
    } catch {
      notify({
        title: "Error",
        subtitle: "Failed to export data. Please try again.",
        variant: "error",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSimulateApproval = () => {
    setProviderStatus("approved");
  };

  const handleDisableProvider = async () => {
    setIsDisablingProvider(true);
    try {
      await disableMyProvider();
      setProviderStatus("disabled");
      setUserMode("customer");
      setDisableProviderSheetOpen(false);
      notify({
        title: "Provider Disabled",
        subtitle:
          "Your provider profile is hidden from all listings. You can re-enable it anytime.",
        variant: "success",
      });
    } catch {
      notify({
        title: "Error",
        subtitle: "Failed to disable provider. Please try again.",
        variant: "error",
      });
    } finally {
      setIsDisablingProvider(false);
    }
  };

  const handleEnableProvider = async () => {
    setIsDisablingProvider(true);
    try {
      const result = await enableMyProvider();
      setProviderStatus("approved");
      notify({
        title: "Provider Enabled",
        subtitle: "Your provider profile is now visible again.",
        variant: "success",
      });
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        "Failed to enable provider. Please try again.";
      notify({
        title: "Cannot Re-enable Yet",
        subtitle: message,
        variant: "error",
      });
    } finally {
      setIsDisablingProvider(false);
    }
  };

  // ─── Avatar + Header ──────────────────────────────────────────
  const initials = profile.name
    ? profile.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "BC";

  const { requireAuth } = useAuthGate();
  const guestAction = useCallback(() => requireAuth(), [requireAuth]);

  // ─── Guest Profile View ───────────────────────────────────────
  // Instead of early return, we render guest content conditionally
  // so that all SlidePage components at the bottom are shared.

  return (
    <div className="pb-20">
      {!user ? (
        <>
          {/* Guest Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mx-4 mt-4 mb-3 bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm text-center"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center mx-auto mb-3">
              <IonIcon
                icon={personOutline}
                className="text-2xl text-slate-400 dark:text-slate-500"
              />
            </div>
            <h2 className="text-base font-bold text-slate-800 dark:text-white">
              Guest User
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Sign in to access your profile
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={guestAction}
              className="mt-3 px-6 py-2.5 bg-amber-500 text-white font-bold text-sm rounded-xl active:bg-amber-600"
            >
              Sign In / Sign Up
            </motion.button>
          </motion.div>

          {/* Account Section — all gated */}
          <MenuSection title="Account">
            <MenuRow
              icon={locationOutline}
              iconColor="text-green-500"
              iconBg="bg-green-50"
              label="Saved Addresses"
              sublabel="Home, office, and more"
              onClick={guestAction}
            />
            <MenuRow
              icon={heartOutline}
              iconColor="text-pink-500"
              iconBg="bg-pink-50"
              label="Saved Providers"
              sublabel="Your favourites"
              onClick={guestAction}
            />
          </MenuSection>

          {/* Preferences — theme & language work without login */}
          <MenuSection title="Preferences">
            <MenuRow
              icon={notificationsOutline}
              iconColor="text-amber-500"
              iconBg="bg-amber-50"
              label="Notifications"
              sublabel="Push & in-app alerts"
              onClick={guestAction}
            />
            <MenuRow
              icon={isDark ? sunnyOutline : moonOutline}
              iconColor={isDark ? "text-amber-400" : "text-indigo-500"}
              iconBg={isDark ? "bg-amber-50" : "bg-indigo-50"}
              label="Dark Mode"
              sublabel={isDark ? "On" : "Off"}
              trailing={
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTheme();
                  }}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-300 cursor-pointer ${
                    isDark ? "bg-amber-500" : "bg-slate-200"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                      isDark ? "translate-x-[22px]" : "translate-x-0.5"
                    }`}
                  />
                </div>
              }
              onClick={toggleTheme}
            />
            {/* <LanguageMenuButton onClick={() => setActivePage("language")} /> */}
          </MenuSection>

          {/* Support */}
          <MenuSection title="Support">
            <MenuRow
              icon={helpCircleOutline}
              iconColor="text-indigo-500"
              iconBg="bg-indigo-50"
              label="Help & FAQ"
              onClick={() => setActivePage("help")}
            />
            <MenuRow
              icon={mailOutline}
              iconColor="text-cyan-500"
              iconBg="bg-cyan-50"
              label="Contact Us"
              sublabel="support@tijarahapp.in"
              onClick={() => setActivePage("contactUs")}
            />
            <MenuRow
              icon={bugOutline}
              iconColor="text-orange-500"
              iconBg="bg-orange-50"
              label="Report a Bug"
              onClick={() => requireAuth()}
            />
          </MenuSection>

          {/* Legal */}
          <MenuSection title="Legal">
            <MenuRow
              icon={informationCircleOutline}
              iconColor="text-blue-500"
              iconBg="bg-blue-50"
              label="About Us"
              onClick={() => setActivePage("about")}
            />
            <MenuRow
              icon={documentTextOutline}
              iconColor="text-slate-500"
              iconBg="bg-slate-100"
              label="Terms & Conditions"
              onClick={() => setActivePage("terms")}
            />
            <MenuRow
              icon={shieldCheckmarkOutline}
              iconColor="text-green-500"
              iconBg="bg-green-50"
              label="Privacy Policy"
              onClick={() => router.push("/privacy-policy")}
            />
          </MenuSection>

          {/* App Version */}
          <div className="text-center py-6">
            <p className="text-[11px] text-slate-300 font-medium">
              Tijarah v{APP_VERSION}
            </p>
            <p className="text-[10px] text-slate-300 mt-0.5">
              Made with ♥ in India
            </p>
          </div>
        </>
      ) : (
        <>
          {/* Profile Header Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mx-4 mt-4 mb-3 bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-sm">
                <span className="text-lg font-bold text-white">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      autoFocus
                      maxLength={50}
                      className="text-base font-bold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 outline-none focus:border-amber-400 w-full"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveName();
                        if (e.key === "Escape") {
                          setEditedName(profile.name || "");
                          setIsEditingName(false);
                        }
                      }}
                    />
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={handleSaveName}
                      disabled={updateUserMutation.isPending}
                      className="w-8 h-8 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center shrink-0"
                    >
                      <IonIcon
                        icon={saveOutline}
                        className="text-green-600 text-base"
                      />
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setEditedName(profile.name || "");
                        setIsEditingName(false);
                      }}
                      className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0"
                    >
                      <IonIcon
                        icon={closeOutline}
                        className="text-slate-500 text-base"
                      />
                    </motion.button>
                  </div>
                ) : (
                  <h2 className="text-base font-bold text-slate-800 dark:text-white truncate">
                    {profile.name || "User"}
                  </h2>
                )}
                <p className="text-xs text-slate-500 truncate">
                  {profile.mobileNumber
                    ? `+91 ${profile.mobileNumber}`
                    : "No phone"}
                </p>
                {profile.city && (
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {profile.area ? `${profile.area}, ` : ""}
                    {profile.city}
                  </p>
                )}
              </div>
              {!isEditingName && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setEditedName(profile.name || "");
                    setIsEditingName(true);
                  }}
                  className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center"
                >
                  <IonIcon
                    icon={createOutline}
                    className="text-amber-600 text-lg"
                  />
                </motion.button>
              )}
            </div>
          </motion.div>

          {/* Provider Status Cards */}
          {(providerStatus === "approved" ||
            providerStatus === "pending" ||
            providerStatus === "in_review" ||
            providerStatus === "suspended") && (
            <div className="mx-4 mb-3">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 flex gap-4 justify-between items-center">
                <div>
                  <div className="text-sm font-bold text-slate-800 dark:text-white">
                    Provider Mode
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {userMode === "provider"
                      ? "Managing your business"
                      : "Switch to manage your business"}
                  </div>
                </div>
                <Toggle
                  component="label"
                  checked={userMode === "provider"}
                  onChange={toggleMode}
                  className="konsta-color-primary"
                />
              </div>
            </div>
          )}

          {providerStatus === "not_applied" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-4 mb-3"
            >
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 p-4">
                <div className="relative z-10">
                  <h3 className="text-white font-bold text-sm">
                    Become a Provider
                  </h3>
                  <p className="text-white/70 text-xs mt-0.5 mb-3">
                    Start offering your services on Tijarah
                  </p>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleApply}
                    className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl text-white text-xs font-bold border border-white/30"
                  >
                    Apply Now →
                  </motion.button>
                </div>
                <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
                <div className="absolute -right-2 -bottom-6 w-20 h-20 rounded-full bg-white/5" />
              </div>
            </motion.div>
          )}

          {providerStatus === "pending" && userMode === "customer" && (
            <div className="mx-4 mb-3">
              <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-800/30 rounded-xl">
                    <IonIcon
                      icon={timeOutline}
                      className="text-xl text-amber-600"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-amber-900 dark:text-amber-300">
                      Verification Pending
                    </div>
                    <div className="text-amber-700 dark:text-amber-400 text-xs mt-0.5">
                      Under review. You can still manage your business.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {providerStatus === "rejected" && (
            <div className="mx-4 mb-3">
              <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-800/30 rounded-xl">
                    <IonIcon
                      icon={alertCircleOutline}
                      className="text-xl text-red-600"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-red-900 dark:text-red-300">
                      Application Rejected
                    </div>
                    <div className="text-red-700 dark:text-red-400 text-xs mt-0.5">
                      Please review your documents and try again.
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setProviderStatus("not_applied")}
                      className="mt-2 text-xs font-bold text-red-600 underline"
                    >
                      Retry Application
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Provider Business Card - shown when in provider mode */}

          {/* Provider Suspended Card */}
          {providerStatus === "suspended" && (
            <div className="mx-4 mb-3">
              <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-800/30 rounded-xl">
                    <IonIcon
                      icon={alertCircleOutline}
                      className="text-xl text-red-500"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-red-900 dark:text-red-300">
                      Provider Suspended
                    </div>
                    <div className="text-red-700 dark:text-red-400 text-xs mt-0.5">
                      Your provider profile has been suspended by our moderation
                      team. Please contact support to request a review.
                    </div>
                    <a
                      href="mailto:support@tijarahconnect.com?subject=Provider%20Suspension%20Review%20Request"
                      className="inline-block mt-3 px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-xl"
                    >
                      Contact Support
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Provider Disabled Card */}
          {providerStatus === "disabled" && (
            <div className="mx-4 mb-3">
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl">
                    <IonIcon
                      icon={eyeOffOutline}
                      className="text-xl text-slate-500"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-slate-800 dark:text-white">
                      Provider Disabled
                    </div>
                    <div className="text-slate-500 text-xs mt-0.5">
                      Your provider profile is hidden from all listings.
                      Re-enable it anytime.
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleEnableProvider}
                      disabled={isDisablingProvider}
                      className="mt-3 px-4 py-2 bg-teal-500 text-white text-xs font-bold rounded-xl disabled:opacity-50"
                    >
                      {isDisablingProvider
                        ? "Enabling..."
                        : "Re-enable Provider"}
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Provider Deleted Card */}
          {providerStatus === "deleted" && (
            <div className="mx-4 mb-3">
              <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-800/30 rounded-xl">
                    <IonIcon
                      icon={trashOutline}
                      className="text-xl text-red-500"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-red-900 dark:text-red-300">
                      Provider Deleted
                    </div>
                    <div className="text-red-700 dark:text-red-400 text-xs mt-0.5">
                      Your provider profile has been removed. You can apply
                      again as a new provider.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Provider Management Section (only in provider view) ── */}
          {userMode === "provider" &&
            (providerStatus === "approved" ||
              providerStatus === "disabled") && (
              <MenuSection title="Provider Management">
                {providerStatus === "disabled" ? (
                  <MenuRow
                    icon={eyeOutline}
                    iconColor="text-teal-500"
                    iconBg="bg-teal-50"
                    label="Re-enable Provider"
                    sublabel="Make your profile visible again"
                    onClick={handleEnableProvider}
                    trailing={
                      isDisablingProvider ? (
                        <Preloader className="w-5 h-5" />
                      ) : (
                        <IonIcon
                          icon={chevronForward}
                          className="text-slate-300 text-sm"
                        />
                      )
                    }
                  />
                ) : (
                  <MenuRow
                    icon={eyeOffOutline}
                    iconColor="text-amber-500"
                    iconBg="bg-amber-50"
                    label="Disable Provider"
                    sublabel="Hide your profile from listings"
                    onClick={() => setDisableProviderSheetOpen(true)}
                  />
                )}
              </MenuSection>
            )}

          {/* ── Account Section ──────────────────────────────────── */}
          <MenuSection title="Account">
            <MenuRow
              icon={locationOutline}
              iconColor="text-green-500"
              iconBg="bg-green-50"
              label="Saved Addresses"
              sublabel="Home, office, and more"
              onClick={() => router.push("/add-location")}
            />
            {/* <MenuRow
              icon={heartOutline}
              iconColor="text-pink-500"
              iconBg="bg-pink-50"
              label="Saved Providers"
              sublabel="Your favourites"
            /> */}
          </MenuSection>

          {/* ── Preferences Section ──────────────────────────────── */}
          <MenuSection title="Preferences">
            <MenuRow
              icon={notificationsOutline}
              iconColor="text-amber-500"
              iconBg="bg-amber-50"
              label="Notifications"
              sublabel="Push & in-app alerts"
              onClick={() => setActivePage("notificationSettings")}
            />
            <MenuRow
              icon={isDark ? sunnyOutline : moonOutline}
              iconColor={isDark ? "text-amber-400" : "text-indigo-500"}
              iconBg={isDark ? "bg-amber-50" : "bg-indigo-50"}
              label="Dark Mode"
              sublabel={isDark ? "On" : "Off"}
              trailing={
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTheme();
                  }}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-300 cursor-pointer ${
                    isDark ? "bg-amber-500" : "bg-slate-200"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                      isDark ? "translate-x-[22px]" : "translate-x-0.5"
                    }`}
                  />
                </div>
              }
              onClick={toggleTheme}
            />
            {/* <LanguageMenuButton onClick={() => setActivePage("language")} /> */}
          </MenuSection>

          {/* ── Support Section ──────────────────────────────────── */}
          <MenuSection title="Support">
            <MenuRow
              icon={helpCircleOutline}
              iconColor="text-indigo-500"
              iconBg="bg-indigo-50"
              label="Help & FAQ"
              onClick={() => setActivePage("help")}
            />
            <MenuRow
              icon={mailOutline}
              iconColor="text-cyan-500"
              iconBg="bg-cyan-50"
              label="Contact Us"
              sublabel="support@tijarahapp.in"
              onClick={() => setActivePage("contactUs")}
            />
            <MenuRow
              icon={bugOutline}
              iconColor="text-orange-500"
              iconBg="bg-orange-50"
              label="Report a Bug"
              onClick={() => setActivePage("reportBug")}
            />
          </MenuSection>

          {/* ── Legal Section ────────────────────────────────────── */}
          <MenuSection title="Legal">
            <MenuRow
              icon={informationCircleOutline}
              iconColor="text-blue-500"
              iconBg="bg-blue-50"
              label="About Us"
              onClick={() => setActivePage("about")}
            />
            <MenuRow
              icon={documentTextOutline}
              iconColor="text-slate-500"
              iconBg="bg-slate-100"
              label="Terms & Conditions"
              onClick={() => setActivePage("terms")}
            />
            <MenuRow
              icon={shieldCheckmarkOutline}
              iconColor="text-green-500"
              iconBg="bg-green-50"
              label="Privacy Policy"
              onClick={() => router.push("/privacy-policy")}
            />
          </MenuSection>

          {/* ── Data & Privacy Section ───────────────────────────── */}
          <MenuSection title="Data & Privacy">
            <MenuRow
              icon={downloadOutline}
              iconColor="text-indigo-500"
              iconBg="bg-indigo-50"
              label="Download My Data"
              sublabel="Export all your data as JSON"
              onClick={handleExportData}
              trailing={
                isExporting ? (
                  <Preloader className="w-5 h-5" />
                ) : (
                  <IonIcon
                    icon={chevronForward}
                    className="text-slate-300 text-sm"
                  />
                )
              }
            />
          </MenuSection>

          {/* ── Danger Zone ──────────────────────────────────────── */}
          <MenuSection title="">
            <MenuRow
              icon={logOutOutline}
              iconColor="text-orange-500"
              iconBg="bg-orange-50"
              label="Log Out"
              onClick={() => setLogoutActionSheetOpen(true)}
              trailing={null}
            />
            <MenuRow
              icon={pauseCircleOutline}
              iconColor="text-amber-500"
              iconBg="bg-amber-50"
              label="Pause Account"
              sublabel="Temporarily freeze your account"
              onClick={() => setPauseSheetOpen(true)}
              trailing={null}
            />
            <MenuRow
              icon={trashOutline}
              iconColor="text-red-500"
              iconBg="bg-red-50"
              label="Delete Account"
              sublabel="Permanently remove your data"
              danger
              onClick={() => setDeleteSheetOpen(true)}
              trailing={null}
            />
          </MenuSection>

          {/* App Version */}
          <div className="text-center py-6">
            <p className="text-[11px] text-slate-300 font-medium">
              Tijarah v{APP_VERSION}
            </p>
            <p className="text-[10px] text-slate-300 mt-0.5">
              Made with ♥ in India
            </p>
          </div>
        </>
      )}

      {/* ── Slide Pages (shared between guest and logged-in) ── */}

      {/* Language Page */}
      <SlidePage
        open={activePage === "language"}
        onClose={() => setActivePage(null)}
        title="Language"
      >
        <LanguageSelector
          onLanguageChange={(newLocale: Locale) => {
            // Save to backend
            updateUserMutation.mutate({ preferredLanguage: newLocale } as any, {
              onSuccess: () => {
                notify({
                  title: "Language Updated",
                  subtitle: "Your language preference has been saved.",
                  variant: "success",
                });
              },
            });
          }}
        />
      </SlidePage>

      {/* Notification Settings */}
      <NotificationSettings
        open={activePage === "notificationSettings"}
        onClose={() => setActivePage(null)}
      />

      {/* About Us Page */}
      <SlidePage
        open={activePage === "about"}
        onClose={() => setActivePage(null)}
        title="About Us"
      >
        <div className="space-y-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {/* Hero */}
          <div className="text-center pb-2">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-200/40 dark:shadow-amber-900/30">
              <span className="text-3xl font-black text-white tracking-tight">T</span>
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white">
              Tijarah
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">BohriConnect</p>
            <p className="text-[11px] text-slate-400 mt-1">Version {APP_VERSION}</p>
          </div>

          {/* Tagline */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/15 dark:to-orange-900/15 border border-amber-200/60 dark:border-amber-800/30 rounded-2xl px-4 py-3.5 text-center">
            <p className="text-[13px] font-semibold text-amber-800 dark:text-amber-300 italic leading-relaxed">
              Making the Dawoodi Bohra community&apos;s entrepreneurial spirit visible, connected, and celebrated.
            </p>
          </div>

          {/* Our Story */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Our Story</h4>
            <p className="text-[13px]">
              The Dawoodi Bohra community has always been a community of traders, creators, and entrepreneurs. For centuries, commerce has been woven into our identity &mdash; guided by values of honesty, hard work, and mutual support.
            </p>
            <p className="text-[13px] mt-2">
              But finding Bohra businesses meant relying on WhatsApp forwards, word-of-mouth chains, and personal phone directories. There was no single place to search, browse, and connect with Bohra businesses in your city.
            </p>
            <p className="text-[13px] mt-2 font-medium text-slate-700 dark:text-slate-200">
              Tijarah was built to change that.
            </p>
          </div>

          {/* What We Do */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">What Tijarah Does</h4>
            <p className="text-[13px] mb-3">
              Tijarah is a community directory app &mdash; a connector between community members who need something and the Bohra business owners who provide it.
            </p>
            <div className="space-y-2">
              {[
                "Browse Bohra-owned businesses across categories: food, rida & fashion, home services, retail, tutoring, events & more",
                "View detailed business profiles with photos, descriptions, contact details & operating hours",
                "Connect directly via a single tap — call or WhatsApp instantly",
                "Read community reviews from fellow Bohra users",
                "Discover verified businesses with confirmed community membership",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span className="text-[13px]">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Values */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Our Values</h4>
            <div className="grid grid-cols-1 gap-2.5">
              {[
                { icon: "🤝", title: "Trust Above All", desc: "Every feature is filtered through one question: does this make the community trust us more?" },
                { icon: "🕌", title: "Community First", desc: "Built specifically for the Bohra community, shaped by its culture, values, and way of doing business." },
                { icon: "✨", title: "Simplicity", desc: "Simple enough for anyone in the community to use — no training or tutorials needed." },
                { icon: "🔒", title: "Privacy & Respect", desc: "We collect only what is necessary and protect what we hold with the utmost care." },
                { icon: "💛", title: "Free for Community", desc: "Basic listings and discovery will always be free. Built for the community, not to extract value from it." },
              ].map((v, i) => (
                <div key={i} className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3.5 py-3">
                  <span className="text-lg mt-0.5">{v.icon}</span>
                  <div>
                    <p className="text-[13px] font-bold text-slate-800 dark:text-white">{v.title}</p>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* How It Works */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">How It Works</h4>
            <div className="space-y-2.5">
              <div className="bg-blue-50 dark:bg-blue-900/15 border border-blue-100 dark:border-blue-800/30 rounded-xl px-3.5 py-3">
                <p className="text-[12px] font-bold text-blue-700 dark:text-blue-300">For Community Members</p>
                <p className="text-[12px] text-blue-600/80 dark:text-blue-400/80 mt-0.5">Browse or search for what you need and connect directly with a Bohra-owned business in one tap. No account required to explore.</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/15 border border-green-100 dark:border-green-800/30 rounded-xl px-3.5 py-3">
                <p className="text-[12px] font-bold text-green-700 dark:text-green-300">For Business Owners</p>
                <p className="text-[12px] text-green-600/80 dark:text-green-400/80 mt-0.5">Create a free listing in minutes — or let us do it for you. Optionally get a &apos;Verified&apos; badge by confirming your community membership.</p>
              </div>
            </div>
          </div>

          {/* Where We Are */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Where We Are</h4>
            <p className="text-[13px]">
              Launched in <strong>Pune</strong> in 2026 — home to one of Maharashtra&apos;s most active Bohra communities.
            </p>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1.5">
              Next: Mumbai · Surat · Hyderabad · Nagpur · Indore
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Get in Touch</h4>
            <div className="space-y-2.5">
              <a
                href="mailto:support@tijarahapp.in"
                className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 rounded-2xl px-4 py-3 active:bg-blue-100 dark:active:bg-blue-900/30 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center shrink-0">
                  <IonIcon icon={mailOutline} className="text-white text-base" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Email Support</p>
                  <p className="text-[13px] font-semibold text-blue-600 dark:text-blue-400">support@tijarahapp.in</p>
                </div>
              </a>

              <a
                href="https://wa.me/919834174885"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/40 rounded-2xl px-4 py-3 active:bg-green-100 dark:active:bg-green-900/30 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.616l4.534-1.468A11.956 11.956 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.24 0-4.312-.727-5.994-1.96l-.42-.307-2.69.87.894-2.637-.336-.435A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">WhatsApp</p>
                  <p className="text-[13px] font-semibold text-green-600 dark:text-green-400">+91 98341 74885</p>
                </div>
              </a>

              <a
                href="tel:+919834174885"
                className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40 rounded-2xl px-4 py-3 active:bg-amber-100 dark:active:bg-amber-900/30 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
                  <IonIcon icon={callOutline} className="text-white text-base" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Call Us</p>
                  <p className="text-[13px] font-semibold text-amber-600 dark:text-amber-400">+91 98341 74885</p>
                </div>
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-2 space-y-1">
            <p className="text-[11px] text-slate-400">
              Tijarah (BohriConnect) · Pune, Maharashtra, India
            </p>
            <p className="text-[11px] text-slate-400">
              © {new Date().getFullYear()} Tijarah. All rights reserved.
            </p>
          </div>
        </div>
      </SlidePage>

      {/* Terms & Conditions Page */}
      <SlidePage
        open={activePage === "terms"}
        onClose={() => setActivePage(null)}
        title="Terms & Conditions"
      >
        <div className="space-y-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl px-4 py-3">
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
              Effective Date: 1 May 2026 · Last Updated: April 2026
            </p>
          </div>

          <p>
            Welcome to Tijarah (BohriConnect). These Terms govern your use of
            the Tijarah app and all related services. By using Tijarah, you
            confirm you have read, understood, and agreed to these Terms.
          </p>

          <h4 className="font-bold text-slate-800 dark:text-white">
            1. About Tijarah — What We Are and Are Not
          </h4>
          <p>
            Tijarah is a community-driven business discovery platform. We
            provide a digital space where Bohra-owned businesses can be listed
            and discovered.
          </p>
          <div className="bg-slate-50 dark:bg-slate-800 border-l-4 border-amber-400 px-4 py-3 rounded-r-xl">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              IMPORTANT
            </p>
            <p className="text-xs mt-1 text-slate-600 dark:text-slate-400">
              Tijarah is an intermediary platform only. We do not own, operate,
              or control any listed business. We do not handle payments,
              bookings, or any transaction. Any arrangement between a User and a
              Business Owner is strictly between those two parties. Tijarah
              accepts no liability arising from it.
            </p>
          </div>

          <h4 className="font-bold text-slate-800 dark:text-white">
            2. Eligibility
          </h4>
          <p>
            You may use Tijarah if you are at least 13 years of age and capable
            of entering a legally binding agreement. Users between 13–18 should
            have a parent or guardian review these Terms.
          </p>

          <h4 className="font-bold text-slate-800 dark:text-white">
            3. User Accounts
          </h4>
          <p>
            You must provide accurate registration information, keep credentials
            secure, and notify us of any unauthorised access. You are
            responsible for all activity through your account.
          </p>

          <h4 className="font-bold text-slate-800 dark:text-white">
            4. Business Listings
          </h4>
          <p>
            By submitting a listing, you confirm all information is accurate and
            the business is genuinely owned by a member of the Dawoodi Bohra
            community. The following are not permitted and will be removed
            without notice:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>Businesses not owned by a Bohra community member</li>
            <li>Listings for illegal goods or services</li>
            <li>Duplicate, misleading, or fraudulent listings</li>
            <li>Content violating third-party intellectual property rights</li>
          </ul>

          <h4 className="font-bold text-slate-800 dark:text-white">
            5. Verified Badge
          </h4>
          <p>
            The 'Verified' badge indicates Tijarah reviewed an identity or
            community document. It does <strong>not</strong> guarantee quality,
            reliability, or safety of the business. Users must conduct their own
            due diligence.
          </p>

          <h4 className="font-bold text-slate-800 dark:text-white">
            6. User Conduct
          </h4>
          <p>
            You agree not to post false or offensive content, impersonate
            others, spam, scrape data, upload malware, or use the platform for
            any unlawful purpose. We may suspend accounts that violate these
            rules without prior notice.
          </p>

          <h4 className="font-bold text-slate-800 dark:text-white">
            7. Reviews & Community Content
          </h4>
          <p>
            Reviews must be honest and based on genuine first-hand experience.
            Reviews in exchange for payment, discounts, or gifts are prohibited.
            You retain ownership of your content and grant Tijarah a
            non-exclusive licence to display it within the Platform.
          </p>

          <h4 className="font-bold text-slate-800 dark:text-white">
            8. Reporting & Blocking
          </h4>
          <p>
            You may report or block any business or user. Submitting a report
            does not guarantee removal — Tijarah reviews each case individually
            and takes action where a clear violation is identified.
          </p>

          <h4 className="font-bold text-slate-800 dark:text-white">
            9. Disclaimer of Warranties
          </h4>
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              The Platform is provided on an "AS IS" basis without warranties of
              any kind. Tijarah makes no warranty that the Platform will be
              uninterrupted, error-free, or that any listing is accurate or
              reliable.
            </p>
          </div>

          <h4 className="font-bold text-slate-800 dark:text-white">
            10. Limitation of Liability
          </h4>
          <p className="text-xs">
            To the fullest extent permitted by law, Tijarah shall not be liable
            for any loss arising from reliance on listings, any transaction
            between users and businesses, or any indirect or consequential
            damages. Our maximum aggregate liability is zero for users who have
            not paid anything.
          </p>

          <h4 className="font-bold text-slate-800 dark:text-white">
            11. Governing Law
          </h4>
          <p>
            These Terms are governed by the laws of India. Disputes shall be
            subject to the exclusive jurisdiction of the courts in Pune,
            Maharashtra.
          </p>

          <h4 className="font-bold text-slate-800 dark:text-white">
            12. Contact
          </h4>
          <p>
            Legal enquiries:{" "}
            <span className="text-blue-600 font-medium">support@tijarahapp.in</span>
          </p>

          <p className="text-xs text-slate-400 pt-2 text-center">
            © 2026 Tijarah (BohriConnect). All rights reserved. · v2.0 · May
            2026
          </p>
        </div>
      </SlidePage>

      {/* Help & FAQ Page */}
      <SlidePage
        open={activePage === "help"}
        onClose={() => setActivePage(null)}
        title="Help & FAQ"
      >
        <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p className="text-xs text-slate-400 pb-1">
            Can&apos;t find your answer? Contact us at{" "}
            <span className="text-blue-500 font-medium">
              support@tijarahapp.in
            </span>
          </p>

          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pt-1">
            General
          </p>
          <FAQItem
            q="What is Tijarah (BohriConnect)?"
            a="Tijarah is a free community app built for the Dawoodi Bohra community. It helps you discover Bohra-owned businesses across categories like home-cooked food, rida and fashion, tutors, repair services, catering, and retail — all in one searchable, trusted place."
          />
          <FAQItem
            q="What does 'Tijarah' mean?"
            a="Tijarah (تجارة) is an Arabic word meaning 'trade' or 'commerce'. It reflects the app's mission: to honour and support the entrepreneurial tradition at the heart of the Bohra community."
          />
          <FAQItem
            q="Is Tijarah only for Dawoodi Bohras?"
            a="All businesses listed are owned or operated by Dawoodi Bohra community members. However, anyone is welcome to browse and use the app — Bohra or not."
          />
          <FAQItem
            q="Which cities is Tijarah available in?"
            a="Tijarah launched in Pune, Maharashtra. We are actively expanding to Mumbai, Surat, Hyderabad, Nagpur, and Indore. Follow us on Instagram or join our WhatsApp Channel for launch announcements."
          />
          <FAQItem
            q="Is Tijarah free to use?"
            a="Yes — completely. Tijarah is free for both users and business owners. There are no listing fees, subscription charges, or transaction commissions."
          />

          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pt-2">
            For Users
          </p>
          <FAQItem
            q="How do I find a business?"
            a="Browse by category, search by business name or type, or use the 'Nearby' feature. You can filter by category, area, and verified status."
          />
          <FAQItem
            q="How do I contact a business?"
            a="Every business profile includes an in-app Chat and/or Call button. You can message or call directly through the Tijarah app — no need to share your personal phone number."
          />
          <FAQItem
            q="Does Tijarah handle orders or payments?"
            a="No. Tijarah is a discovery and connection platform only. All orders, payments, and arrangements are made directly between you and the business."
          />
          <FAQItem
            q="What does the 'Verified' badge mean?"
            a="Businesses marked Verified have voluntarily submitted a government-issued ID (Aadhaar / PAN) and/or an Ejmaat Card, reviewed by the Tijarah team. It confirms identity — it does not guarantee service quality."
          />
          <FAQItem
            q="Can I post a review?"
            a="Yes. After using a business, you can leave a star rating and written review on their profile. Reviews must be honest, specific, and respectful."
          />
          <FAQItem
            q="How do I report a business or content?"
            a="Tap the 'Report' button on any business profile or listing. Our team reviews all reports and will take appropriate action where a violation is identified."
          />

          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pt-2">
            For Business Owners
          </p>
          <FAQItem
            q="How do I list my business on Tijarah?"
            a="Tap 'Add Business' in the app and follow the steps. Or send us a WhatsApp message or email — we'll set up your listing for you, free of charge."
          />
          <FAQItem
            q="How do I get the 'Verified' badge?"
            a="Contact us at support@tijarahapp.in and we'll guide you through submitting a document (Aadhaar, PAN, or Ejmaat Card). Verification is optional — your listing works fully without it."
          />
          <FAQItem
            q="My business was already listed. Why?"
            a="Tijarah may create listings from publicly available information. If you are the owner, you can claim your listing by contacting us — we'll update every detail to reflect exactly how you want to be represented."
          />
          <FAQItem
            q="Can I update or remove my listing?"
            a="Yes, at any time. Contact us or manage your listing directly in the app. Changes are processed within 2–3 business days."
          />

          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pt-2">
            Privacy & Data
          </p>
          <FAQItem
            q="What personal data does Tijarah collect?"
            a="We collect your name (optional), phone number, email (optional), location (if you grant permission), and app usage data. Business owners may optionally provide identity documents for verification. We never collect payment details or biometric data."
          />
          <FAQItem
            q="Can I delete my account and all my data?"
            a="Yes. Contact us at support@tijarahapp.in to request full account and data deletion. We process requests within 30 days."
          />
          <FAQItem
            q="Does Tijarah sell my data?"
            a="No. Tijarah does not sell, rent, or trade your personal data to any third party, ever."
          />

          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pt-2">
            Technical
          </p>
          <FAQItem
            q="How do I turn off notifications?"
            a="Go to Settings > Notifications > Tijarah on your device and toggle off. You can also manage preferences inside the Tijarah app under Settings."
          />
          <FAQItem
            q="How do I turn off location access?"
            a="Go to Settings > Privacy > Location Services > Tijarah and set to 'Never'. The app still works for browsing — nearby discovery will not be available."
          />
          <FAQItem
            q="I found a bug. What do I do?"
            a="Use the 'Report a Bug' option in your profile to send us details. Include your device type and what happened — we'll investigate and follow up as quickly as possible."
          />

          <div className="pt-4 text-center border-t border-slate-100 dark:border-slate-700 mt-2">
            <p className="text-xs text-slate-400">Still need help?</p>
            <p className="text-sm font-semibold text-blue-500 mt-1">
              support@tijarahapp.in
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              WhatsApp: +91 98341 74885
            </p>
          </div>
        </div>
      </SlidePage>

      {/* Contact Us Page */}
      <ContactUsSlide
        open={activePage === "contactUs"}
        onClose={() => setActivePage(null)}
      />

      {/* Report a Bug Page */}
      <ReportBugSlide
        open={activePage === "reportBug"}
        onClose={() => setActivePage(null)}
      />

      {/* ── Dialogs ─────────────────────────────────────── */}
      <AppDialog
        open={logoutActionSheetOpen}
        onClose={() => setLogoutActionSheetOpen(false)}
        icon={logOutOutline}
        iconColor="text-red-500"
        iconBg="bg-red-50"
        title="Log Out?"
        description="Are you sure you want to log out of your account?"
        confirmLabel="Log Out"
        cancelLabel="Cancel"
        onConfirm={handleLogout}
        confirmColor="red"
      />

      <AppDialog
        open={deleteSheetOpen}
        onClose={() => setDeleteSheetOpen(false)}
        icon={trashOutline}
        iconColor="text-red-500"
        iconBg="bg-red-50"
        title="Delete Account?"
        description="This action is permanent and cannot be undone. All your data, bookings, saved locations, and preferences will be permanently deleted."
        confirmLabel="Yes, Delete My Account"
        cancelLabel="Cancel"
        onConfirm={handleDeleteAccount}
        confirmColor="red"
        isLoading={isDeleting}
        loadingLabel="Deleting..."
      />

      <AppDialog
        open={pauseSheetOpen}
        onClose={() => setPauseSheetOpen(false)}
        icon={pauseCircleOutline}
        iconColor="text-amber-500"
        iconBg="bg-amber-50"
        title="Pause Account?"
        description="Your profile won't be visible, you won't receive messages, and your provider listing (if any) will be hidden. You can reactivate anytime by logging in again."
        confirmLabel="Yes, Pause My Account"
        cancelLabel="Cancel"
        onConfirm={handlePauseAccount}
        confirmColor="red"
        isLoading={isPausing}
        loadingLabel="Pausing..."
      />

      <AppDialog
        open={disableProviderSheetOpen}
        onClose={() => setDisableProviderSheetOpen(false)}
        icon={eyeOffOutline}
        iconColor="text-amber-500"
        iconBg="bg-amber-50"
        title="Disable Provider?"
        description="Your provider profile will be hidden from all listings and search results. Once disabled, you must wait a minimum of 2 days before you can re-enable it. This is to prevent profile spamming and ensure platform quality."
        confirmLabel="Yes, Disable Provider"
        cancelLabel="Cancel"
        onConfirm={handleDisableProvider}
        confirmColor="red"
        isLoading={isDisablingProvider}
        loadingLabel="Disabling..."
      />
    </div>
  );
});

// ─── Contact Us Slide ───────────────────────────────────────────────
const ContactUsSlide = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => (
  <SlidePage open={open} onClose={onClose} title="Contact Us">
    <div className="space-y-5 text-sm text-slate-600 dark:text-slate-300">
      {/* Hero */}
      <div className="text-center pb-2">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center mx-auto mb-3 shadow-sm">
          <IonIcon icon={mailOutline} className="text-2xl text-white" />
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-white">
          Get in Touch
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          We typically respond within 7 business days
        </p>
      </div>

      {/* Contact Cards */}
      <div className="space-y-3">
        <a
          href="mailto:support@tijarahapp.in"
          className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 rounded-2xl px-4 py-3.5 active:bg-blue-100 dark:active:bg-blue-900/30 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shrink-0">
            <IonIcon icon={mailOutline} className="text-white text-lg" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              General Support
            </p>
            <p className="text-sm font-semibold text-blue-600">
              support@tijarahapp.in
            </p>
          </div>
          <IonIcon icon={chevronForward} className="text-slate-300" />
        </a>

        <a
          href="https://wa.me/919834174885"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40 rounded-2xl px-4 py-3.5 active:bg-emerald-100 dark:active:bg-emerald-900/30 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.616l4.534-1.468A11.956 11.956 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.24 0-4.312-.727-5.994-1.96l-.42-.307-2.69.87.894-2.637-.336-.435A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              WhatsApp Support
            </p>
            <p className="text-sm font-semibold text-emerald-600">
              +91 98341 74885
            </p>
          </div>
          <IonIcon icon={chevronForward} className="text-slate-300" />
        </a>

        <a
          href="tel:+919834174885"
          className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40 rounded-2xl px-4 py-3.5 active:bg-amber-100 dark:active:bg-amber-900/30 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
            <IonIcon icon={callOutline} className="text-white text-lg" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Call Us
            </p>
            <p className="text-sm font-semibold text-amber-600">
              +91 98341 74885
            </p>
          </div>
          <IonIcon icon={chevronForward} className="text-slate-300" />
        </a>

        <a
          href="mailto:support@tijarahapp.in"
          className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/40 rounded-2xl px-4 py-3.5 active:bg-green-100 dark:active:bg-green-900/30 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center shrink-0">
            <IonIcon
              icon={shieldCheckmarkOutline}
              className="text-white text-lg"
            />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Privacy & Data Requests
            </p>
            <p className="text-sm font-semibold text-green-600">
              support@tijarahapp.in
            </p>
          </div>
          <IonIcon icon={chevronForward} className="text-slate-300" />
        </a>

        <a
          href="mailto:support@tijarahapp.in"
          className="flex items-center gap-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/40 rounded-2xl px-4 py-3.5 active:bg-purple-100 dark:active:bg-purple-900/30 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center shrink-0">
            <IonIcon
              icon={documentTextOutline}
              className="text-white text-lg"
            />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Legal & Terms
            </p>
            <p className="text-sm font-semibold text-purple-600">
              support@tijarahapp.in
            </p>
          </div>
          <IonIcon icon={chevronForward} className="text-slate-300" />
        </a>
      </div>

      {/* Location */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-4 space-y-1">
        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
          Registered Address
        </p>
        <p className="text-xs text-slate-500">Tijarah (BohriConnect)</p>
        <p className="text-xs text-slate-500">Pune, Maharashtra, India</p>
      </div>

      <p className="text-xs text-slate-400 text-center pt-1">
        © 2026 Tijarah (BohriConnect). All rights reserved.
      </p>
    </div>
  </SlidePage>
);

// ─── Report a Bug Slide ─────────────────────────────────────────────
const ReportBugSlide = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const { notify } = useNotification();
  const [category, setCategory] = useState<BugCategory>("other");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (description.trim().length < 10) return;
    setIsSubmitting(true);
    try {
      await submitBugReport({
        category,
        description: description.trim(),
        stepsToReproduce: steps.trim() || undefined,
        deviceInfo:
          typeof navigator !== "undefined"
            ? `${navigator.userAgent.slice(0, 150)}`
            : undefined,
      });
      setSubmitted(true);
      setDescription("");
      setSteps("");
      setCategory("other");
    } catch (err: any) {
      notify({
        title: "Submission Failed",
        subtitle: err?.response?.data?.message || "Please try again.",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    onClose();
  };

  return (
    <SlidePage open={open} onClose={handleClose} title="Report a Bug">
      {submitted ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
            <IonIcon
              icon={checkmarkCircleOutline}
              className="text-4xl text-green-500"
            />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
            Report Submitted!
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
            Thank you for helping improve Tijarah. We've received your bug
            report and will investigate it.
          </p>
          <button
            onClick={handleClose}
            className="mt-6 px-6 py-2.5 bg-amber-500 text-white font-bold text-sm rounded-xl active:bg-amber-600"
          >
            Done
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Found something broken? Tell us what happened and we'll fix it as
            quickly as possible.
          </p>

          {/* Category */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Bug Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(BUG_CATEGORY_LABELS) as BugCategory[]).map(
                (key) => (
                  <button
                    key={key}
                    onClick={() => setCategory(key)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-colors text-left ${
                      category === key
                        ? "bg-orange-500 text-white border-orange-500"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 active:bg-slate-100 dark:active:bg-slate-700"
                    }`}
                  >
                    {BUG_CATEGORY_LABELS[key]}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Describe the Bug <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What went wrong? What did you expect to happen?"
              rows={4}
              maxLength={1000}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-3 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:border-amber-400 resize-none"
            />
            <p className="text-[10px] text-slate-400 text-right mt-0.5">
              {description.length}/1000
            </p>
          </div>

          {/* Steps */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Steps to Reproduce{" "}
              <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              placeholder="1. Open the app&#10;2. Tap on...&#10;3. Bug appears"
              rows={3}
              maxLength={500}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-3 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:border-amber-400 resize-none"
            />
          </div>

          <p className="text-[11px] text-slate-400">
            Your device info will be included automatically to help us debug.
          </p>

          <button
            onClick={handleSubmit}
            disabled={description.trim().length < 10 || isSubmitting}
            className="w-full py-3.5 rounded-xl bg-orange-500 text-white font-bold text-sm active:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {isSubmitting ? "Submitting..." : "Submit Bug Report"}
          </button>
        </div>
      )}
    </SlidePage>
  );
};

// ─── FAQ Accordion Item ─────────────────────────────────────────────
const FAQItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left active:bg-slate-50 dark:active:bg-slate-700"
      >
        <span className="text-sm font-semibold text-slate-800 dark:text-white pr-2">
          {q}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-slate-400 shrink-0"
        >
          ▾
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="px-4 pb-3 text-sm text-slate-500 dark:text-slate-400">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

ProfileContent.displayName = "ProfileContent";

export default ProfileContent;
