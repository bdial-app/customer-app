"use client";
import { useState, useEffect } from "react";
import {
  List,
  ListItem,
  ListInput,
  Toggle,
  BlockTitle,
  Block,
  Button,
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
  notificationsOutline,
  lockClosedOutline,
  heartOutline,
  shareOutline,
  bugOutline,
} from "ionicons/icons";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "../context/AppContext";
import { useRouter } from "next/navigation";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { FormikInput } from "./formik-input";
import { useAppSelector, useAppDispatch } from "@/hooks/useAppStore";
import { setProfile as setReduxProfile, clearUser } from "@/store/slices/authSlice";
import { useUpdateUser } from "@/hooks/useUser";
import { useNotification } from "../context/NotificationContext";
import { Preloader } from "konsta/react";
import { useDispatch } from "react-redux";
import { getMyProviderStatus } from "@/services/provider.service";
import { AppDialog } from "./app-dialog";

interface UserProfile {
  mobileNumber: string;
  name: string;
  gender: "male" | "female" | "other";
  role: "customer" | "provider";
  city: string;
  area: string;
  pincode: string;
}

const validationSchema = Yup.object().shape({
  name: Yup.string()
    .min(3, "Must be at least 3 characters")
    .required("Required"),
  gender: Yup.string()
    .oneOf(["male", "female", "other"], "Invalid Gender")
    .required("Required"),
  city: Yup.string().required("Required"),
  area: Yup.string(),
  pincode: Yup.string()
    .matches(/^\d{6}$/, "Must be 6 digits")
    .required("Required"),
});

const APP_VERSION = "1.0.0";

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
    whileTap={{ scale: 0.98, backgroundColor: "#f8fafc" }}
    onClick={onClick}
    className="flex items-center gap-3 px-4 py-3 cursor-pointer active:bg-slate-50 transition-colors"
  >
    <div
      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}
    >
      <IonIcon icon={icon} className={`text-lg ${iconColor}`} />
    </div>
    <div className="flex-1 min-w-0">
      <span
        className={`text-sm font-medium ${danger ? "text-red-500" : "text-slate-800"}`}
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
    <div className="mx-4 bg-white rounded-2xl overflow-hidden border border-slate-100 divide-y divide-slate-50">
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
}) => (
  <AnimatePresence>
    {open && (
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed inset-0 z-[100] bg-white overflow-y-auto"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div
          className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-slate-100"
          style={{ paddingTop: "max(env(safe-area-inset-top), 8px)" }}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={onClose}
              className="text-blue-500 font-semibold text-sm active:opacity-50"
            >
              ← Back
            </button>
            <h2 className="text-base font-bold text-slate-800">{title}</h2>
            <div className="w-12" />
          </div>
        </div>
        <div className="px-5 py-5">{children}</div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ─── Main Profile Content ───────────────────────────────────────────
const ProfileContent = () => {
  const { providerStatus, userMode, setProviderStatus, setProviderInfo, toggleMode, resetProviderState } =
    useAppContext();
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user as any);
  const updateUserMutation = useUpdateUser();
  const { notify } = useNotification();
  const [isEditing, setIsEditing] = useState(false);
  const [logoutActionSheetOpen, setLogoutActionSheetOpen] = useState(false);
  const [deleteSheetOpen, setDeleteSheetOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Slide-page states
  const [activePage, setActivePage] = useState<
    "about" | "terms" | "privacy" | "help" | "editProfile" | null
  >(null);

  const [profile, setProfile] = useState<any>(user || {});

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
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user?.id, setProviderStatus, setProviderInfo]);

  const dispatch = useDispatch();

  const handleSave = async (values: any) => {
    try {
      await updateUserMutation.mutateAsync({
        name: values.name,
        gender: values.gender,
        city: values.city,
        area: values.area,
        pincode: values.pincode,
      });
      dispatch(setReduxProfile({ ...user, ...values }));
      setProfile({ ...user, ...values });
      notify({
        title: "Profile Updated",
        subtitle: "Your information was successfully updated.",
        variant: "success",
      });
      setActivePage(null);
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
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    dispatch(clearUser());
    resetProviderState();
    setLogoutActionSheetOpen(false);
    router.push("/auth/login");
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      // TODO: Call actual delete account API when available
      // await deleteMyAccount();
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      dispatch(clearUser());
      resetProviderState();
      setDeleteSheetOpen(false);
      router.push("/auth/login");
      notify({ title: "Account Deleted", subtitle: "Your account has been removed.", variant: "success" });
    } catch {
      notify({ title: "Error", subtitle: "Failed to delete account. Please try again.", variant: "error" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSimulateApproval = () => {
    setProviderStatus("approved");
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

  return (
    <>
      {/* Profile Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mx-4 mt-4 mb-3 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-lg font-bold text-white">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-slate-800 truncate">
              {profile.name || "User"}
            </h2>
            <p className="text-xs text-slate-500 truncate">
              {profile.mobileNumber || "No phone"}
            </p>
            {profile.city && (
              <p className="text-[11px] text-slate-400 mt-0.5">
                {profile.area ? `${profile.area}, ` : ""}
                {profile.city}
              </p>
            )}
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setActivePage("editProfile")}
            className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center"
          >
            <IonIcon icon={createOutline} className="text-amber-600 text-lg" />
          </motion.button>
        </div>
      </motion.div>

      {/* Provider Status Cards */}
      {(providerStatus === "approved" || providerStatus === "pending" || providerStatus === "in_review") && (
        <div className="mx-4 mb-3">
          <div className="bg-white rounded-2xl p-4 border border-slate-100 flex gap-4 justify-between items-center">
            <div>
              <div className="text-sm font-bold text-slate-800">Provider Mode</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {userMode === "provider"
                  ? "Managing your business"
                  : "Switch to manage listings"}
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
              <h3 className="text-white font-bold text-sm">Become a Provider</h3>
              <p className="text-white/70 text-xs mt-0.5 mb-3">
                Start offering your services on Bohri Connect
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
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 rounded-xl">
                <IonIcon icon={timeOutline} className="text-xl text-amber-600" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm text-amber-900">Verification Pending</div>
                <div className="text-amber-700 text-xs mt-0.5">
                  Under review. You can still manage your business.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {providerStatus === "rejected" && (
        <div className="mx-4 mb-3">
          <div className="rounded-2xl bg-red-50 border border-red-200 p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-xl">
                <IonIcon icon={alertCircleOutline} className="text-xl text-red-600" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm text-red-900">Application Rejected</div>
                <div className="text-red-700 text-xs mt-0.5">
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
      {(providerStatus === "approved" || providerStatus === "pending" || providerStatus === "in_review") && userMode === "provider" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mb-3"
        >
          <div className="bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl p-4 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
                <IonIcon icon={businessOutline} className="text-xl text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">
                  {profile.name || "Your Business"}
                </p>
                <p className="text-white/70 text-[11px]">Business Profile</p>
              </div>
            </div>
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  // Navigate back to home/dashboard tab to manage business
                }}
                className="flex-1 py-2 rounded-xl bg-white/20 text-white text-xs font-semibold text-center border border-white/20"
              >
                Manage Business
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={toggleMode}
                className="px-4 py-2 rounded-xl bg-white text-teal-600 text-xs font-bold"
              >
                Switch to Customer
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Account Section ──────────────────────────────────── */}
      <MenuSection title="Account">
        <MenuRow
          icon={personOutline}
          iconColor="text-blue-500"
          iconBg="bg-blue-50"
          label="Edit Profile"
          sublabel="Name, gender, location"
          onClick={() => setActivePage("editProfile")}
        />
        <MenuRow
          icon={locationOutline}
          iconColor="text-green-500"
          iconBg="bg-green-50"
          label="Saved Addresses"
          sublabel="Home, office, and more"
          onClick={() => router.push("/add-location")}
        />
        <MenuRow
          icon={heartOutline}
          iconColor="text-pink-500"
          iconBg="bg-pink-50"
          label="Saved Providers"
          sublabel="Your favourites"
        />
      </MenuSection>

      {/* ── Preferences Section ──────────────────────────────── */}
      <MenuSection title="Preferences">
        <MenuRow
          icon={notificationsOutline}
          iconColor="text-amber-500"
          iconBg="bg-amber-50"
          label="Notifications"
          sublabel="Push & in-app alerts"
          trailing={
            <Toggle
              component="label"
              checked={true}
              onChange={() => {}}
              className="konsta-color-primary"
            />
          }
        />
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
          sublabel="support@bohriconnect.com"
        />
        <MenuRow
          icon={bugOutline}
          iconColor="text-orange-500"
          iconBg="bg-orange-50"
          label="Report a Bug"
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
          onClick={() => setActivePage("privacy")}
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
          Bohri Connect v{APP_VERSION}
        </p>
        <p className="text-[10px] text-slate-300 mt-0.5">
          Made with ♥ in India
        </p>
      </div>

      {/* ── Slide Pages ──────────────────────────────────────── */}

      {/* Edit Profile Page */}
      <SlidePage
        open={activePage === "editProfile"}
        onClose={() => setActivePage(null)}
        title="Edit Profile"
      >
        <Formik
          enableReinitialize={true}
          initialValues={{
            name: profile.name || "",
            gender: profile.gender || "male",
            city: profile.city || "",
            area: profile.area || "",
            pincode: profile.pincode || "",
          }}
          validationSchema={validationSchema}
          onSubmit={handleSave}
        >
          {({ isValid, dirty }) => (
            <Form className="contents">
              <List strongIos insetIos>
                <FormikInput
                  name="name"
                  label="Name"
                  type="text"
                  placeholder="Your name"
                  media={<IonIcon icon={personOutline} />}
                />
                <FormikInput
                  name="gender"
                  label="Gender"
                  type="select"
                  media={<IonIcon icon={maleOutline} />}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </FormikInput>
                <FormikInput
                  name="city"
                  label="City"
                  type="text"
                  placeholder="City name"
                  media={<IonIcon icon={businessOutline} />}
                />
                <FormikInput
                  name="area"
                  label="Area"
                  type="text"
                  placeholder="Locality area"
                  media={<IonIcon icon={locationOutline} />}
                />
                <FormikInput
                  name="pincode"
                  label="Pincode"
                  type="text"
                  placeholder="Area pincode"
                  media={<IonIcon icon={mapOutline} />}
                  formatValue={(val) => val.replace(/\D/g, "").slice(0, 6)}
                />
              </List>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setActivePage(null)}
                  className="py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm active:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isValid || !dirty || updateUserMutation.isPending}
                  className="py-3 rounded-xl bg-amber-500 text-white font-bold text-sm active:bg-amber-600 disabled:opacity-50"
                >
                  {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </SlidePage>

      {/* About Us Page */}
      <SlidePage
        open={activePage === "about"}
        onClose={() => setActivePage(null)}
        title="About Us"
      >
        <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-3 shadow-sm">
              <span className="text-2xl font-bold text-white">BC</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800">Bohri Connect</h3>
            <p className="text-xs text-slate-400">Version {APP_VERSION}</p>
          </div>
          <p>
            Bohri Connect is a community-driven marketplace that connects
            customers with trusted local service providers. Our mission is to
            empower small businesses and make quality services accessible to
            everyone.
          </p>
          <p>
            Founded with the vision of strengthening community bonds, we provide
            a platform where skilled professionals can showcase their talents
            and customers can find reliable services — from tailoring and beauty
            to home repairs and catering.
          </p>
          <h4 className="font-bold text-slate-800 pt-2">Our Values</h4>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">●</span>
              <span><strong>Trust:</strong> Every provider is verified to ensure quality and safety.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">●</span>
              <span><strong>Community:</strong> Built by the community, for the community.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">●</span>
              <span><strong>Empowerment:</strong> Supporting women-led businesses and local entrepreneurs.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">●</span>
              <span><strong>Transparency:</strong> Clear pricing and honest reviews.</span>
            </li>
          </ul>
          <h4 className="font-bold text-slate-800 pt-2">Contact</h4>
          <p>
            Email: support@bohriconnect.com<br />
            Website: www.bohriconnect.com
          </p>
          <p className="text-xs text-slate-400 pt-4 text-center">
            © {new Date().getFullYear()} Bohri Connect. All rights reserved.
          </p>
        </div>
      </SlidePage>

      {/* Terms & Conditions Page */}
      <SlidePage
        open={activePage === "terms"}
        onClose={() => setActivePage(null)}
        title="Terms & Conditions"
      >
        <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
          <p className="text-xs text-slate-400">
            Last updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
          </p>

          <h4 className="font-bold text-slate-800">1. Acceptance of Terms</h4>
          <p>
            By accessing or using the Bohri Connect application ("App"), you
            agree to be bound by these Terms and Conditions. If you do not agree,
            please do not use the App.
          </p>

          <h4 className="font-bold text-slate-800">2. Description of Service</h4>
          <p>
            Bohri Connect is a marketplace platform connecting customers with
            local service providers. We facilitate the connection but do not
            directly provide any services listed on the platform.
          </p>

          <h4 className="font-bold text-slate-800">3. User Accounts</h4>
          <p>
            You must provide accurate information when creating an account. You
            are responsible for maintaining the security of your account
            credentials. You must be at least 18 years old to use the App.
          </p>

          <h4 className="font-bold text-slate-800">4. User Conduct</h4>
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Use the App for any unlawful purpose</li>
            <li>Harass, abuse, or harm other users or providers</li>
            <li>Post false or misleading information</li>
            <li>Attempt to gain unauthorized access to the App</li>
            <li>Use automated means to access the App without our permission</li>
          </ul>

          <h4 className="font-bold text-slate-800">5. Service Providers</h4>
          <p>
            Service providers are independent contractors. Bohri Connect does
            not guarantee the quality, safety, or legality of services offered.
            Users engage with providers at their own discretion.
          </p>

          <h4 className="font-bold text-slate-800">6. Reviews & Ratings</h4>
          <p>
            Reviews must be honest and based on genuine experiences. We reserve
            the right to remove reviews that violate our guidelines.
          </p>

          <h4 className="font-bold text-slate-800">7. Intellectual Property</h4>
          <p>
            All content, trademarks, and intellectual property on the App belong
            to Bohri Connect or its licensors. You may not reproduce, distribute,
            or create derivative works without our permission.
          </p>

          <h4 className="font-bold text-slate-800">8. Limitation of Liability</h4>
          <p>
            Bohri Connect is provided "as is" without warranties of any kind.
            We are not liable for any damages arising from your use of the App
            or any services obtained through the platform.
          </p>

          <h4 className="font-bold text-slate-800">9. Account Termination</h4>
          <p>
            We may suspend or terminate your account if you violate these terms.
            You may delete your account at any time through the App settings.
          </p>

          <h4 className="font-bold text-slate-800">10. Changes to Terms</h4>
          <p>
            We may update these terms at any time. Continued use of the App
            after changes constitutes acceptance of the new terms.
          </p>

          <h4 className="font-bold text-slate-800">11. Governing Law</h4>
          <p>
            These terms are governed by the laws of India. Any disputes shall be
            resolved in the courts of Pune, Maharashtra.
          </p>

          <h4 className="font-bold text-slate-800">12. Contact</h4>
          <p>
            For questions about these terms, contact us at
            legal@bohriconnect.com.
          </p>
        </div>
      </SlidePage>

      {/* Privacy Policy Page */}
      <SlidePage
        open={activePage === "privacy"}
        onClose={() => setActivePage(null)}
        title="Privacy Policy"
      >
        <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
          <p className="text-xs text-slate-400">
            Last updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
          </p>

          <h4 className="font-bold text-slate-800">1. Information We Collect</h4>
          <p>We collect the following types of information:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Personal Information:</strong> Name, phone number, gender, city, area, and pincode</li>
            <li><strong>Location Data:</strong> Your device location to show nearby service providers</li>
            <li><strong>Usage Data:</strong> App interactions, search queries, and browsing patterns</li>
            <li><strong>Device Information:</strong> Device type, OS version, and app version</li>
          </ul>

          <h4 className="font-bold text-slate-800">2. How We Use Your Information</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>To provide and improve our services</li>
            <li>To show relevant service providers near your location</li>
            <li>To send notifications about bookings and updates</li>
            <li>To ensure platform safety and prevent fraud</li>
            <li>To analyze usage patterns and improve user experience</li>
          </ul>

          <h4 className="font-bold text-slate-800">3. Data Sharing</h4>
          <p>
            We do not sell your personal data to third parties. We may share
            your information with:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Service providers you choose to engage with (name, location)</li>
            <li>Analytics services to improve our platform</li>
            <li>Legal authorities if required by law</li>
          </ul>

          <h4 className="font-bold text-slate-800">4. Data Storage & Security</h4>
          <p>
            Your data is stored securely using industry-standard encryption. We
            implement appropriate technical and organizational measures to
            protect your information.
          </p>

          <h4 className="font-bold text-slate-800">5. Your Rights</h4>
          <p>You have the right to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Access and download your personal data</li>
            <li>Correct inaccurate information</li>
            <li>Delete your account and associated data</li>
            <li>Opt out of marketing communications</li>
            <li>Withdraw consent for location tracking</li>
          </ul>

          <h4 className="font-bold text-slate-800">6. Cookies & Tracking</h4>
          <p>
            We use local storage and session data to maintain your preferences.
            We do not use third-party tracking cookies.
          </p>

          <h4 className="font-bold text-slate-800">7. Children's Privacy</h4>
          <p>
            Our App is not intended for children under 18. We do not knowingly
            collect information from children.
          </p>

          <h4 className="font-bold text-slate-800">8. Data Retention</h4>
          <p>
            We retain your data for as long as your account is active. Upon
            account deletion, your data is permanently removed within 30 days.
          </p>

          <h4 className="font-bold text-slate-800">9. Changes to This Policy</h4>
          <p>
            We may update this policy periodically. We will notify you of
            significant changes through the App.
          </p>

          <h4 className="font-bold text-slate-800">10. Contact Us</h4>
          <p>
            For privacy-related inquiries:<br />
            Email: privacy@bohriconnect.com<br />
            Address: Pune, Maharashtra, India
          </p>
        </div>
      </SlidePage>

      {/* Help & FAQ Page */}
      <SlidePage
        open={activePage === "help"}
        onClose={() => setActivePage(null)}
        title="Help & FAQ"
      >
        <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
          <FAQItem
            q="How do I book a service?"
            a="Browse categories or search for a service, tap on a provider to view their profile, and contact them directly through the app."
          />
          <FAQItem
            q="How do I become a service provider?"
            a="Go to your Profile → 'Become a Provider' and fill out the application form. Our team will review it within 24-48 hours."
          />
          <FAQItem
            q="Is my personal information safe?"
            a="Yes. We use industry-standard encryption and never sell your data to third parties. Read our Privacy Policy for more details."
          />
          <FAQItem
            q="How do I change my location?"
            a="Tap the location bar at the top of the home screen to search for a new area or use your current GPS location."
          />
          <FAQItem
            q="Can I delete my account?"
            a="Yes. Go to Profile → Delete Account. This action is permanent and all your data will be removed."
          />
          <FAQItem
            q="How do reviews work?"
            a="After using a service, you can leave a rating and review. All reviews are verified and must follow our community guidelines."
          />
          <FAQItem
            q="I'm having trouble with the app. What should I do?"
            a="Try force-closing and reopening the app. If the issue persists, contact us at support@bohriconnect.com."
          />
          <div className="pt-4 text-center">
            <p className="text-xs text-slate-400">
              Still need help? Reach us at
            </p>
            <p className="text-sm font-semibold text-blue-500 mt-1">
              support@bohriconnect.com
            </p>
          </div>
        </div>
      </SlidePage>

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
    </>
  );
};

// ─── FAQ Accordion Item ─────────────────────────────────────────────
const FAQItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left active:bg-slate-50"
      >
        <span className="text-sm font-semibold text-slate-800 pr-2">{q}</span>
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
            <p className="px-4 pb-3 text-sm text-slate-500">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileContent;
