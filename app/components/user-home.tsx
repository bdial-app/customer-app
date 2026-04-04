"use client";
import { List, ListInput } from "konsta/react";
import { ROUTE_PATH } from "@/utils/contants";
import ServicesList from "./service-list";
import SectionHeader from "./section-header";
import ProviderList from "./provider-list";
import { IonIcon } from "@ionic/react";
import { filter, search } from "ionicons/icons";
import { useRouter } from "next/navigation";

const UserHome = () => {
  const router = useRouter();

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
    },
  ];

  return (
    <>
      <List strongIos insetIos className="mt-4! relative">
        <ListInput
          onClick={() => router.push(ROUTE_PATH.ALL_SERVICES)}
          type="text"
          placeholder="Search services or providers..."
          media={<IonIcon icon={search} />}
        />
        <button className="absolute top-3 right-4 text-slate-600">
          <IonIcon icon={filter} />
        </button>
      </List>

      <ServicesList />
      <SectionHeader
        title="Featured Services"
        subtitle="Discover amazing services"
        navigateTo={ROUTE_PATH.ALL_SERVICES}
        navigateToText="See All"
      />

      <ProviderList providerList={providers} />
    </>
  );
};

export default UserHome;
