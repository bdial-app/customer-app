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
} from "ionicons/icons";

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

  const toggleRole = () => {
    setProfile((prev) => ({
      ...prev,
      role: prev.role === "customer" ? "provider" : "customer",
    }));
  };

  return (
    <>
      <Block>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <IonIcon icon={personOutline} className="text-3xl" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{profile.name}</h1>
            <p className="text-slate-500 text-sm font-medium">
              {profile.mobile_number}
            </p>
          </div>
        </div>
      </Block>
      <Block
        strong
        inset
        outline
        className="flex gap-4 justify-between items-center"
      >
        <div className="min-w-[240px]">
          <div className="text-slate-900">Provider mode</div>
          <div className="text-xs text-slate-500 font-medium">
            {profile.role === "provider"
              ? "You act as a provider"
              : "You act as a customer"}
          </div>
        </div>
        <Toggle
          component="label"
          checked={profile.role === "provider"}
          onChange={toggleRole}
          className="konsta-color-primary"
        />
      </Block>

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
