"use client"
import { Block, Navbar, Searchbar, Button, Card, Page, List, ListItem } from "konsta/react";
import { useState } from "react";
import { IonIcon } from "@ionic/react";
import { arrowBack } from "ionicons/icons";
import ProviderList from "../components/provider-list";
import { useRouter } from 'next/navigation';

export default function AllServicesPage() {
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState("");

 const providers: any = [
    {
      id: 1,
      name: "Ahmed's Tailoring Shop",
      service: "Clothing",
      rating: 4.8,
      reviews: 127,
      price: "₹500-2000",
      location: "Downtown, 2.5 km",
      phone: "+91 98765 43210",
      description: "Expert tailor specializing in traditional and modern clothing designs. Over 10 years of experience.",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400",
      verified: true
    },
    {
      id: 2,
      name: "Fashion House",
      service: "Clothing",
      rating: 4.5,
      reviews: 89,
      price: "₹800-3000",
      location: "City Center, 3.2 km",
      phone: "+91 98765 43211",
      description: "Premium clothing services with custom designs and alterations.",
      image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400",
      verified: true
    },
    {
      id: 3,
      name: "Stitch Perfect",
      service: "Clothing",
      rating: 4.6,
      reviews: 203,
      price: "₹600-2500",
      location: "West End, 1.8 km",
      phone: "+91 98765 43212",
      description: "Professional stitching and alteration services for all types of garments.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
      verified: false
    },
    {
      id: 4,
      name: "Royal Tailors",
      service: "Clothing",
      rating: 4.9,
      reviews: 156,
      price: "₹1000-5000",
      location: "Old Town, 4.1 km",
      phone: "+91 98765 43213",
      description: "Luxury tailoring services for special occasions and traditional wear.",
      image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400",
      verified: true
    }
  ];

  return (
    <Page style={{
      background: 'radial-gradient(at 0% 10%, #f0eff4, #f0ecff)',
    }}>
      <Navbar
      centerTitle={false} 
        title="All Services"
        titleClassName="ml-2"
        innerClassName="justify-start"
        leftClassName="w-11"
        left={
          <a onClick={() => router.back()}>
            <IonIcon icon={arrowBack} />
          </a>
        }
      />

      <Block className="mt-4">
        <Searchbar
          placeholder="Search services..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          clearButton
        />
      </Block>

      <Block>
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            {providers.length} services found
          </p>
        </div>
      </Block>

      {/* <List strongIos outlineIos className="mt-4">
        {filteredServices.map((service) => (
          <Link key={service.id} href={ROUTE_PATH.SERVICE_PROVIDERS}>
            <ListItem
              className="material:border-b material:border-b-slate-300"
              link
              title={service.title}
              after="View"
              subtitle={service.subtitle}
              text={service.description}
              media={
                <img
                  className="ios:rounded-lg material:rounded-lg ios:w-20 material:w-20 h-20"
                  src={service.image}
                  width="80"
                  alt={service.title}
                />
              }
            />
          </Link>
        ))}
      </List> */}
      <ProviderList providerList={providers} />

      {providers.length === 0 && (
        <Block className="text-center py-8">
          <p className="text-gray-500">No services found matching your search.</p>
          <Button clear onClick={() => setSearchQuery("")}>
            Clear Search
          </Button>
        </Block>
      )}
    </Page>
  );
}
