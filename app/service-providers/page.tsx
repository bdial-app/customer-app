"use client"
import { Block, Navbar, Searchbar, Button, Card, Page, List, ListItem, Chip } from "konsta/react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROUTE_PATH } from "@/utils/contants";
import { IonIcon } from "@ionic/react";
import { arrowBack, star, call, location, chatbubble } from "ionicons/icons";

interface ServiceProvider {
  id: number;
  name: string;
  service: string;
  rating: number;
  reviews: number;
  price: string;
  location: string;
  phone: string;
  description: string;
  image: string;
  verified: boolean;
}

export default function ServiceProvidersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Categories for filtering
  const categories = ["All", "Verified", "Top Rated", "Nearby", "Budget Friendly", "Premium"];

  // Mock data - this would come from API based on service type
  const providers: ServiceProvider[] = [
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

  const filteredProviders = providers.filter(provider => {
    // First apply search filter
    const matchesSearch = provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         provider.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         provider.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    // Then apply category filter
    switch (selectedCategory) {
      case "Verified":
        return provider.verified;
      case "Top Rated":
        return provider.rating >= 4.7;
      case "Nearby":
        return provider.location.includes("1.") || provider.location.includes("2.");
      case "Budget Friendly":
        return provider.price.includes("500") || provider.price.includes("600") || provider.price.includes("800");
      case "Premium":
        return provider.price.includes("3000") || provider.price.includes("5000");
      default:
        return true; // "All" category
    }
  });

  const router = useRouter();

  return (
    <Page style={{
      background: 'radial-gradient(at 0% 10%, #f0eff4, #f0ecff)',
    }}>
      <Navbar
        centerTitle={false}
        title="Service Providers"
        titleClassName="ml-2"
        innerClassName="justify-start"
        leftClassName="w-11"
        left={
          <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-full active:scale-90 transition-transform">
            <IonIcon icon={arrowBack} className="w-5 h-5 text-gray-700" />
          </button>
        }
      />

      <Block className="mt-4">
        <Searchbar
          placeholder="Search providers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          clearButton
        />
      </Block>

      <Block className="mt-2 mx-0">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Chip
              key={category}
              outline={selectedCategory !== category}
              onClick={() => setSelectedCategory(category)}
              className="flex-shrink-0"
            >
              {category}
            </Chip>
          ))}
        </div>
      </Block>

      <Block className="my-0">
          <p className="text-sm text-gray-600">
            {filteredProviders.length} providers found
          </p>
      </Block>

      <List strongIos outlineIos className="mt-4">
        {filteredProviders.map((provider) => (
          <Link key={provider.id} href={ROUTE_PATH.PROVIDER_DETAILS}>
            <ListItem
              className="material:border-b material:border-b-slate-300"
              link
              title={
                <div className="flex items-center gap-2">
                  <span>{provider.name}</span>
                {/* {provider.verified && (
                  <span className="absolute- left-[-8em] top-4 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                    ✓ Verified
                  </span>
                )} */}
              </div>
            }
            subtitle={
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  <IonIcon icon={star} className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">{provider.rating}</span>
                  <span className="text-sm text-gray-500">({provider.reviews})</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <IonIcon icon={location} className="w-4 h-4" />
                  <span className="text-sm">{provider.location}</span>
                </div>
              </div>
            }
            text={
              <div className="flex flex-col">
                <p className="line-clamp-2 overflow-hidden text-ellipsis">{provider.description}</p>
                 <div className="flex gap-2 mt-2">
                   <Button outline className="p-0 min-w-0">
                    <IonIcon icon={chatbubble}  className="w-4 h-4" /> <span className="ml-2">Chat</span>
                  </Button>
                  <Button className="p-0 min-w-0">
                    <IonIcon icon={call} className="w-4 h-4" /> <span className="ml-2">Call</span>
                  </Button>
                </div>
              </div>
            }
            media={
              <img
                className="ios:rounded-lg material:rounded-lg ios:w-20 material:w-20 h-20"
                src={provider.image}
                width="80"
                alt={provider.name}
              />
            }
          />
          </Link>
        ))}
      </List>

      {filteredProviders.length === 0 && (
        <Block className="text-center py-8">
          <p className="text-gray-500">No providers found matching your search.</p>
          <Button clear onClick={() => setSearchQuery("")}>
            Clear Search
          </Button>
        </Block>
      )}
    </Page>
  );
}
