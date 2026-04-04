"use client";
import { useState } from "react";
import {
  Page,
  Navbar,
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
} from "ionicons/icons";
import { useAppContext } from "../context/AppContext";
import { useRouter } from "next/navigation";

interface UserProfile {
  mobile_number: string;
  name: string;
  gender: "male" | "female" | "other";
  role: "customer" | "provider";
  city: string;
  area: string;
  pincode: string;
}

const ProfileContent = () => {
  const { providerStatus, userMode, setProviderStatus, toggleMode } =
    useAppContext();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    mobile_number: "+91 8975048440",
    name: "Arbaj Ansari",
    gender: "male",
    role: "customer",
    city: "Pune",
    area: "Yerawada",
    pincode: "411006",
  });
  const [tempProfile, setTempProfile] = useState<UserProfile>(profile);

  const handleUpdate = () => {
    setIsEditing(true);
    setTempProfile({ ...profile });
  };

  const handleSave = () => {
    setProfile({ ...tempProfile });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleApply = () => {
    router.push("/provider-onboarding");
  };

  const handleSimulateApproval = () => {
    setProviderStatus("approved");
  };

  return (
    <>
      {providerStatus === "approved" && (
        <Block
          strong
          inset
          outline
          className="flex gap-4 justify-between items-center bg-white"
        >
          <div className="min-w-[240px]">
            <div className="text-slate-900 font-semibold">Provider mode</div>
            <div className="text-xs text-slate-500 font-medium">
              {userMode === "provider"
                ? "You are currently managing your business"
                : "Switch to manage your listings and services"}
            </div>
          </div>
          <Toggle
            component="label"
            checked={userMode === "provider"}
            onChange={toggleMode}
            className="konsta-color-primary"
          />
        </Block>
      )}

      {providerStatus === "not_applied" && (
        <Block
          strong
          inset
          outline
          className="bg-linear-to-br from-slate-200 to-purple-200 border-0 flex gap-4 p-0!"
        >
          <img src="/" className="w-32" />
          <div className="w-52 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div>
                <div className="font-bold text-lg">Become a Provider</div>
                <div className="text-xs">
                  Start offering your services on Bohri Connect
                </div>
              </div>
            </div>
            <Button small rounded className="w-fit px-4" onClick={handleApply}>
              Apply Now
            </Button>
          </div>
        </Block>
      )}

      {providerStatus === "pending" && (
        <Block strong inset outline className="bg-amber-50 border-amber-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
              <IonIcon icon={timeOutline} className="text-2xl" />
            </div>
            <div>
              <div className="font-bold text-amber-900">
                Verification Pending
              </div>
              <div className="text-amber-700 text-xs text-pretty">
                Your application is currently being reviewed by our team. This
                usually takes 24-48 hours.
              </div>
            </div>
          </div>
          <Button
            clear
            small
            className="text-amber-600 font-semibold"
            onClick={handleSimulateApproval}
          >
            (Simulation) Fast Track Approval
          </Button>
        </Block>
      )}

      {providerStatus === "rejected" && (
        <Block strong inset outline className="bg-red-50 border-red-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-red-100 rounded-lg text-red-600">
              <IonIcon icon={alertCircleOutline} className="text-2xl" />
            </div>
            <div>
              <div className="font-bold text-red-900">Application Rejected</div>
              <div className="text-red-700 text-xs">
                Please review your documents and try again.
              </div>
            </div>
          </div>
          <Button
            outline
            rounded
            className="text-red-600 border-red-600 font-bold"
            onClick={() => setProviderStatus("not_applied")}
          >
            Retry Application
          </Button>
        </Block>
      )}

      <BlockTitle className="flex items-center justify-between">
        <span>Personal Information</span>
        {!isEditing && (
          <Button clear small inline rounded onClick={handleUpdate}>
            Update Information
          </Button>
        )}
      </BlockTitle>

      <List strongIos insetIos>
        {isEditing ? (
          <>
            <ListInput
              label="Name"
              type="text"
              placeholder="Your name"
              value={tempProfile.name}
              onChange={(e) =>
                setTempProfile({ ...tempProfile, name: e.target.value })
              }
              media={<IonIcon icon={personOutline} />}
            />
            <ListInput
              label="Gender"
              type="select"
              dropdown
              value={tempProfile.gender}
              onChange={(e) =>
                setTempProfile({
                  ...tempProfile,
                  gender: e.target.value as any,
                })
              }
              media={<IonIcon icon={maleOutline} />}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </ListInput>
            <ListInput
              label="City"
              type="text"
              placeholder="City name"
              value={tempProfile.city}
              onChange={(e) =>
                setTempProfile({ ...tempProfile, city: e.target.value })
              }
              media={<IonIcon icon={businessOutline} />}
            />
            <ListInput
              label="Area"
              type="text"
              placeholder="Locality area"
              value={tempProfile.area}
              onChange={(e) =>
                setTempProfile({ ...tempProfile, area: e.target.value })
              }
              media={<IonIcon icon={locationOutline} />}
            />
            <ListInput
              label="Pincode"
              type="text"
              placeholder="Area pincode"
              value={tempProfile.pincode}
              onChange={(e) =>
                setTempProfile({ ...tempProfile, pincode: e.target.value })
              }
              media={<IonIcon icon={mapOutline} />}
            />
          </>
        ) : (
          <>
            <ListItem
              title="Name"
              titleWrapClassName="text-sm"
              after={<span className="text-slate-800">{profile.name}</span>}
              media={
                <IonIcon icon={personOutline} className="text-slate-400" />
              }
            />
            <ListItem
              titleWrapClassName="text-sm"
              title="Mobile"
              after={
                <span className="text-slate-800">{profile.mobile_number}</span>
              }
              media={<IonIcon icon={callOutline} className="text-slate-400" />}
            />
            <ListItem
              title="Gender"
              titleWrapClassName="text-sm"
              after={
                <span className="text-slate-800 capitalize">
                  {profile.gender}
                </span>
              }
              media={<IonIcon icon={maleOutline} className="text-slate-400" />}
            />
            <ListItem
              title="City"
              titleWrapClassName="text-sm"
              after={<span className="text-slate-800">{profile.city}</span>}
              media={
                <IonIcon icon={businessOutline} className="text-slate-400" />
              }
            />
            <ListItem
              title="Area"
              titleWrapClassName="text-sm"
              after={<span className="text-slate-800">{profile.area}</span>}
              media={
                <IonIcon icon={locationOutline} className="text-slate-400" />
              }
            />
            <ListItem
              title="Pincode"
              titleWrapClassName="text-sm"
              after={<span className="text-slate-800">{profile.pincode}</span>}
              media={<IonIcon icon={mapOutline} className="text-slate-400" />}
            />
          </>
        )}
      </List>

      {isEditing && (
        <Block className="grid grid-cols-2 gap-4">
          <Button
            outline
            rounded
            large
            onClick={handleCancel}
            className="font-bold border-2"
          >
            Cancel
          </Button>
          <Button rounded large onClick={handleSave} className="font-bold">
            Save Changes
          </Button>
        </Block>
      )}

      {!isEditing && (
        <Block>
          <Button
            outline
            rounded
            large
            className="font-bold text-red-500 border-red-500/20 bg-red-50/50 pt-2 pb-2"
          >
            Logout
          </Button>
        </Block>
      )}
    </>
  );
};

export default ProfileContent;
