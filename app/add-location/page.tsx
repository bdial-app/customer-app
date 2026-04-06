"use client";
import React, { useState } from "react";
import {
  Page,
  Navbar,
  Block,
  BlockTitle,
  List,
  ListInput,
  ListItem,
  Button,
  Searchbar,
  Chip,
} from "konsta/react";
import { IonIcon } from "@ionic/react";
import {
  arrowBack,
  locateOutline,
  pin,
  search,
  home,
  business,
  ellipsisHorizontal,
  ellipsisHorizontalCircleOutline,
} from "ionicons/icons";
import { useRouter } from "next/navigation";

const AddLocationPage = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [selectedType, setSelectedType] = useState("Home");

  const mockLocations = [
    { title: "Camp, Pune", area: "Maharashtra, India" },
    { title: "MG Road, Pune", area: "Maharashtra, India" },
    { title: "Koregaon Park, Pune", area: "Maharashtra, India" },
    { title: "Bohri Ali, Pune", area: "Maharashtra, India" },
    { title: "Viman Nagar, Pune", area: "Maharashtra, India" },
    { title: "Kalyani Nagar, Pune", area: "Maharashtra, India" },
    { title: "Hadapsar, Pune", area: "Maharashtra, India" },
    { title: "Magarpatta, Pune", area: "Maharashtra, India" },
  ];

  const handleBack = () => {
    router.back();
  };

  return (
    <Page className="flex flex-col h-full">
      <Navbar
        title={isFocused ? "Search Location" : "Add Address"}
        left={
          <button onClick={handleBack} className="link">
            <IonIcon icon={arrowBack} className="text-2xl" />
          </button>
        }
        leftClassName="w-11"
        className="!pb-4"
      />

      <div className="flex flex-col flex-1">
        {/* Hide Map and Form when searching */}
        {!isFocused && (
          <div className="flex-1 relative w-full h-80 bg-slate-200 overflow-hidden flex items-center justify-center transition-opacity duration-300">
            {/* Mock Map Background */}
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "radial-gradient(#94a3b8 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            ></div>

            {/* Centered Pin */}
            <div className="relative z-10 flex flex-col items-center">
              <IonIcon
                icon={pin}
                className="text-5xl text-red-500 drop-shadow-lg animate-bounce"
              />
              <div className="w-4 h-1 bg-black/20 rounded-full blur-[2px] mt-1"></div>
            </div>

            {/* Floating "Locate Me" Button */}
            <button className="absolute bottom-4 w-12 h-12 grid place-content-center right-4 bg-white p-3 rounded-full shadow-lg active:scale-95 transition-transform">
              <IonIcon
                icon={locateOutline}
                className="text-2xl text-blue-500"
              />
            </button>
          </div>
        )}

        <div>
          <BlockTitle className={!isFocused ? "mt-6" : "mt-2"}>
            {isFocused ? "Results" : "Location Details"}
          </BlockTitle>

          <Block>
            <Searchbar
              placeholder="Search for your building/area..."
              onInput={(e: any) => setSearchQuery(e.target.value)}
              value={searchQuery}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                setTimeout(() => {
                  if (!searchQuery) setIsFocused(false);
                }, 200);
              }}
              disableButton
              onDisable={() => {
                setIsFocused(false);
                setSearchQuery("");
              }}
            />
          </Block>

          {!isFocused ? (
            <div>
              <BlockTitle className="mt-6 uppercase text-xs font-bold tracking-widest text-slate-400">
                Save As
              </BlockTitle>
              <Block className="flex gap-2 flex-wrap !mt-2">
                <Chip
                  className={`transition-all duration-200 cursor-pointer ${
                    selectedType === "Home"
                      ? "bg-blue-500 text-white shadow-md shadow-blue-200"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                  media={
                    <IonIcon
                      icon={home}
                      className={`w-8 ${selectedType === "Home" ? "text-white" : "text-slate-400"}`}
                    />
                  }
                  onClick={() => setSelectedType("Home")}
                >
                  Home
                </Chip>
                <Chip
                  className={`transition-all duration-200 cursor-pointer ${
                    selectedType === "Office"
                      ? "bg-blue-500 text-white shadow-md shadow-blue-200"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                  media={
                    <IonIcon
                      icon={business}
                      className={`w-8 ${selectedType === "Office" ? "text-white" : "text-slate-400"}`}
                    />
                  }
                  onClick={() => setSelectedType("Office")}
                >
                  Office
                </Chip>
                <Chip
                  className={`transition-all duration-200 cursor-pointer ${
                    selectedType === "Other"
                      ? "bg-blue-500 text-white shadow-md shadow-blue-200"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                  media={
                    <IonIcon
                      icon={ellipsisHorizontalCircleOutline}
                      className={`w-8 ${selectedType === "Other" ? "text-white" : "text-slate-400"}`}
                    />
                  }
                  onClick={() => setSelectedType("Other")}
                >
                  Other
                </Chip>
              </Block>

              <Block className="mt-8">
                <Button large rounded onClick={handleBack}>
                  Save Address
                </Button>
              </Block>
            </div>
          ) : (
            <List strong inset className="mt-0">
              {mockLocations
                .filter((l) =>
                  l.title.toLowerCase().includes(searchQuery.toLowerCase()),
                )
                .map((loc, i) => (
                  <ListItem
                    key={i}
                    title={loc.title}
                    text={loc.area}
                    link
                    onClick={() => {
                      setSearchQuery(loc.title);
                      setIsFocused(false);
                    }}
                  />
                ))}
              {mockLocations.filter((l) =>
                l.title.toLowerCase().includes(searchQuery.toLowerCase()),
              ).length === 0 && (
                <div className="p-8 text-center text-slate-500">
                  No regions found for "{searchQuery}"
                </div>
              )}
            </List>
          )}
        </div>
      </div>
    </Page>
  );
};

export default AddLocationPage;
