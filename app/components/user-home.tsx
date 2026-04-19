import { Block, List, ListInput, Sheet } from "konsta/react";
import { ROUTE_PATH } from "@/utils/contants";
import ServicesList from "./service-list";
import SectionHeader from "./section-header";
import ProviderList from "./provider-list";
import { IonIcon } from "@ionic/react";
import { filter, search } from "ionicons/icons";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AllServicesContent from "./all-services-content";

const UserHome = () => {
  const router = useRouter();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const providers: any = [
    {
      id: 1,
      name: "Ahmed's Tailoring Shop",
      service: "Clothing",
      rating: 4.8,
      reviews: 127,
      price: "1000-5000",
      location: "Downtown, 2.5 km",
      phone: "+91 98765 43210",
      description:
        "Expert tailor specializing in traditional and modern clothing designs. Over 10 years of experience.",
      image:
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400",
      verified: true,
    },
    {
      id: 2,
      name: "Fashion House",
      service: "Clothing",
      rating: 4.5,
      reviews: 89,
      price: "1500-3000",
      location: "City Center, 3.2 km",
      phone: "+91 98765 43211",
      description:
        "Premium clothing services with custom designs and alterations.",
      image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400",
      verified: true,
      womenLed: true,
    },
    {
      id: 3,
      name: "Stitch Perfect",
      service: "Clothing",
      rating: 4.6,
      reviews: 203,
      price: "1000-2000",
      location: "West End, 1.8 km",
      phone: "+91 98765 43212",
      description:
        "Professional stitching and alteration services for all types of garments.",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
      verified: false,
    },
    {
      id: 4,
      name: "Royal Tailors",
      service: "Clothing",
      rating: 4.9,
      reviews: 156,
      price: "500-5000",
      location: "Old Town, 4.1 km",
      phone: "+91 98765 43213",
      description:
        "Luxury tailoring services for special occasions and traditional wear.",
      image:
        "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400",
      verified: true,
      womenLed: true,
    },
    {
      id: 5,
      name: "Zara Boutique",
      service: "Clothing",
      rating: 4.7,
      reviews: 312,
      price: "2000-8000",
      location: "MG Road, 1.2 km",
      phone: "+91 98765 43214",
      description:
        "Trendy women's fashion boutique offering bespoke designs and ready-to-wear collections.",
      image:
        "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=400",
      verified: true,
      womenLed: true,
    },
    {
      id: 6,
      name: "Classic Cuts",
      service: "Clothing",
      rating: 4.3,
      reviews: 74,
      price: "800-2500",
      location: "Suburbs, 5.0 km",
      phone: "+91 98765 43215",
      description: "Affordable alterations and stitching for everyday wear.",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
      verified: false,
    },
  ];

  return (
    <>
      <List strongIos insetIos className="mt-4! relative">
        <div
          className="absolute inset-0 bg-transparent z-10 cursor-pointer"
          onClick={() => setIsSheetOpen(true)}
        ></div>
        <ListInput
          type="text"
          placeholder="Search services or providers..."
          media={<IonIcon icon={search} />}
        />
        <button className="absolute top-3 right-4 text-slate-600">
          <IonIcon icon={filter} />
        </button>
      </List>

      <ServicesList />

      <Block strong inset outline className="!p-0 !mb-2 bg-yellow-100">
        <SectionHeader
          title="Get Ridha Tailors"
          subtitle="Discover amazing services!"
          navigateTo={ROUTE_PATH.ALL_SERVICES}
          navigateToText="See All"
        />
        <ProviderList providerList={providers} sliderMode />
      </Block>

      <SectionHeader
        title="Get AC Repairing quickly!"
        subtitle="Discover amazing services!"
        navigateTo={ROUTE_PATH.ALL_SERVICES}
        navigateToText="See All"
      />
      <ProviderList providerList={providers} sliderMode />

      <Block strong inset outline className="!p-0 !mb-2">
        <SectionHeader
          title="Get Ridha Tailors"
          subtitle="Discover amazing services!"
          navigateTo={ROUTE_PATH.ALL_SERVICES}
          navigateToText="See All"
        />
        <ProviderList providerList={providers} sliderMode />
      </Block>

      <Sheet
        className="pb-safe h-[90%]"
        opened={isSheetOpen}
        onBackdropClick={() => setIsSheetOpen(false)}
      >
        <div className="flex flex-col h-full bg-slate-50">
          <Toolbar
            title="Search Services"
            onClick={() => setIsSheetOpen(false)}
          />
          <div className="flex-1 overflow-y-auto">
            <AllServicesContent isSheet />
          </div>
        </div>
      </Sheet>
    </>
  );
};

const Toolbar = ({
  title,
  onClick,
}: {
  title: string;
  onClick: () => void;
}) => (
  <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
    <div className="text-lg font-bold text-slate-800">{title}</div>
    <button
      onClick={onClick}
      className="text-blue-500 font-semibold active:opacity-50 transition-opacity"
    >
      Done
    </button>
  </div>
);

export default UserHome;
