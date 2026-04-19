import React, { useState } from "react";
import { useAppSelector } from "@/hooks/useAppStore";
import AddressBarNavigation from "./address-bar-navigation";
import {
  Block,
  BlockTitle,
  List,
  ListInput,
  ListItem,
  Navbar,
  Page,
  Searchbar,
  Sheet,
} from "konsta/react";
import { IonIcon } from "@ionic/react";

import {
  add,
  arrowBack,
  home,
  laptopOutline,
  navigateCircleOutline,
  search,
} from "ionicons/icons";
import { useRouter } from "next/navigation";

const GeoLocation = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleClear = () => {
    setSearchQuery("");
  };

  const handleInput = (e: any) => {
    setSearchQuery(e.target.value);
  };

  const user = useAppSelector((state) => state.auth.user as any);

  const handleAddAddress = () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    router.push("/add-location");
  };

  const mockLocations = [
    { title: "Camp, Pune", area: "Maharashtra, India" },
    { title: "MG Road, Pune", area: "Maharashtra, India" },
    { title: "Koregaon Park, Pune", area: "Maharashtra, India" },
    { title: "Bohri Ali, Pune", area: "Maharashtra, India" },
    { title: "Viman Nagar, Pune", area: "Maharashtra, India" },
    { title: "Kalyani Nagar, Pune", area: "Maharashtra, India" },
    { title: "Hadapsar, Pune", area: "Maharashtra, India" },
    { title: "Magarpatta, Pune", area: "Maharashtra, India" },
    { title: "Kothrud, Pune", area: "Maharashtra, India" },
    { title: "Bavdhan, Pune", area: "Maharashtra, India" },
    { title: "Baner, Pune", area: "Maharashtra, India" },
    { title: "Balewadi High Street, Pune", area: "Maharashtra, India" },
    { title: "Hinjewadi Phase 1, Pune", area: "Maharashtra, India" },
    { title: "Hinjewadi Phase 2, Pune", area: "Maharashtra, India" },
    { title: "Wakad, Pune", area: "Maharashtra, India" },
    { title: "Pimple Saudagar, Pune", area: "Maharashtra, India" },
    { title: "Aundh, Pune", area: "Maharashtra, India" },
    { title: "Shivaji Nagar, Pune", area: "Maharashtra, India" },
    { title: "FC Road, Pune", area: "Maharashtra, India" },
    { title: "Deccan Gymkhana, Pune", area: "Maharashtra, India" },
    { title: "Swargate, Pune", area: "Maharashtra, India" },
    { title: "Bibwewadi, Pune", area: "Maharashtra, India" },
    { title: "Kondhwa, Pune", area: "Maharashtra, India" },
  ];

  return (
    <>
      <Block onClick={() => setOpen(true)}>
        <AddressBarNavigation
          title="Azam Campus"
          address="Gulistan-e-Jauhar, Camp"
        />
      </Block>
      <Sheet opened={open} onBackdropClick={() => setOpen(false)}>
        <Page
          className={`relative !rounded-3xl transition-all duration-300 ${
            isFocused ? "!h-[100dvh]" : "h-auto"
          }`}
        >
          <Navbar
            title="Select Location"
            left={<IonIcon icon={arrowBack} />}
            leftClassName="w-11"
            subnavbarClassName="mt-4"
            subnavbar={
              <Searchbar
                onInput={handleInput}
                value={searchQuery}
                onClear={handleClear}
                onFocus={() => setIsFocused(true)}
                onBlur={() => {
                  setTimeout(() => setIsFocused(false), 200);
                }}
                disableButton
                placeholder={"Search for area, street name..."}
                onDisable={() => {
                  setIsFocused(false);
                  setSearchQuery("");
                }}
              />
            }
          />
          <Block></Block>

          {!isFocused ? (
            <>
              <List strong inset>
                <ListItem
                  media={
                    <IonIcon className="w-8 h-8" icon={navigateCircleOutline} />
                  }
                  link
                  title="Use Current Location"
                />
                <ListItem
                  media={<IonIcon className="w-8 h-8" icon={add} />}
                  link
                  title="Add new address"
                  onClick={handleAddAddress}
                />
              </List>
              <BlockTitle>Saved Location</BlockTitle>
              <List strong inset>
                <ListItem
                  media={<IonIcon className="w-6 h-6" icon={home} />}
                  link
                  title="Home"
                  text="Yerwada, Pune"
                />
                <ListItem
                  media={<IonIcon className="w-6 h-6" icon={laptopOutline} />}
                  link
                  title="Office"
                  text="Vishrantwadi, Pune"
                />
              </List>
            </>
          ) : searchQuery === "" ? (
            <>
              <BlockTitle>Recent Locations</BlockTitle>
              <List strong inset>
                <ListItem
                  link
                  title="Yerwada, Pune"
                  text="Maharashtra, India"
                />
                <ListItem
                  link
                  title="Koregaon Park, Pune"
                  text="Maharashtra, India"
                />
              </List>
            </>
          ) : (
            <>
              <BlockTitle>Search Results</BlockTitle>
              {(() => {
                const results = mockLocations.filter((loc) =>
                  loc.title.toLowerCase().includes(searchQuery.toLowerCase()),
                );

                if (results.length > 0) {
                  return (
                    <List strong inset>
                      {results.map((loc, idx) => (
                        <ListItem
                          key={idx}
                          link
                          title={loc.title}
                          text={loc.area}
                        />
                      ))}
                    </List>
                  );
                } else {
                  return (
                    <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500 gap-2">
                      <IonIcon
                        icon={search}
                        className="text-4xl text-slate-300 mb-2"
                      />
                      <div className="text-lg font-semibold text-slate-800">
                        No results found
                      </div>
                      <div className="text-sm">
                        We couldn't find anything matching "{searchQuery}"
                      </div>
                    </div>
                  );
                }
              })()}
            </>
          )}
        </Page>
      </Sheet>
    </>
  );
};

export default GeoLocation;
