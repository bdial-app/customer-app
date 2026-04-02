"use client"
import { Block, Navbar, Searchbar, Button, Card, Page, List, ListItem } from "konsta/react";
import { useState } from "react";
import Link from "next/link";
import { ROUTE_PATH } from "@/utils/contants";
import { IonIcon } from "@ionic/react";
import { arrowBack } from "ionicons/icons";

export default function AllServicesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const allServices = [
    {
      id: 1,
      title: "Clothing",
      subtitle: "Rida, Burqa and other garments",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla sagittis tellus ut turpis condimentum, ut dignissim lacus tincidunt.",
      image: "https://i.pinimg.com/originals/fc/6a/be/fc6abe6990d4faab93760ac471745a6d.jpg",
      category: "Fashion"
    },
    {
      id: 2,
      title: "Home Services",
      subtitle: "Cleaning & Repair",
      description: "Professional home cleaning and repair services at your fingertips.",
      image: "https://images.unsplash.com/photo-1581578261546-f7d6d0b5b4d6?w=400",
      category: "Home"
    },
    {
      id: 3,
      title: "Transport",
      subtitle: "Ride & Delivery",
      description: "Quick and reliable transportation services for all your needs.",
      image: "https://images.unsplash.com/photo-1449965408869-e09346510d6b?w=400",
      category: "Transport"
    },
    {
      id: 4,
      title: "Food & Dining",
      subtitle: "Order & Reserve",
      description: "Best food delivery and restaurant reservation services.",
      image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400",
      category: "Food"
    },
    {
      id: 5,
      title: "Health & Fitness",
      subtitle: "Gyms & Trainers",
      description: "Personal fitness training and gym memberships.",
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f08b8d66?w=400",
      category: "Health"
    },
    {
      id: 6,
      title: "Beauty & Wellness",
      subtitle: "Spa & Salon",
      description: "Pamper yourself with our premium beauty and wellness services.",
      image: "https://images.unsplash.com/photo-1560749614-612495a177a5?w=400",
      category: "Beauty"
    }
  ];

  const filteredServices = allServices.filter(service =>
    service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <Link href={ROUTE_PATH.HOME || "/"}>
            <IonIcon icon={arrowBack} />
          </Link>
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
            {filteredServices.length} services found
          </p>
        </div>
      </Block>

      <List strongIos outlineIos className="mt-4">
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
      </List>

      {filteredServices.length === 0 && (
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
