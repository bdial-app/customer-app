export interface Provider {
  id: number;
  name: string;
  service: string;
  categories: string[];
  rating: number;
  reviews: number;
  price: string;
  location: string;
  phone: string;
  description: string;
  image: string;
  verified: boolean;
  womenLed?: boolean;
}

export const ALL_PROVIDERS: Provider[] = [
  {
    id: 1,
    name: "Ahmed's Tailoring Shop",
    service: "Clothing",
    categories: ["clothing", "tailoring"],
    rating: 4.8,
    reviews: 127,
    price: "₹500-2000",
    location: "Downtown, 2.5 km",
    phone: "+91 98765 43210",
    description: "Expert tailor specializing in traditional and modern clothing designs. Over 10 years of experience.",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400",
    verified: true,
  },
  {
    id: 2,
    womenLed: true,
    name: "Fashion House",
    service: "Clothing",
    categories: ["clothing", "designer-wear"],
    rating: 4.5,
    reviews: 89,
    price: "₹800-3000",
    location: "City Center, 3.2 km",
    phone: "+91 98765 43211",
    description: "Premium clothing services with custom designs and alterations.",
    image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400",
    verified: true,
  },
  {
    id: 3,
    name: "Stitch Perfect",
    service: "Clothing",
    categories: ["clothing", "alterations"],
    rating: 4.6,
    reviews: 203,
    price: "₹600-2500",
    location: "West End, 1.8 km",
    phone: "+91 98765 43212",
    description: "Professional stitching and alteration services for all types of garments.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    verified: false,
  },
  {
    id: 4,
    name: "Royal Tailors",
    service: "Clothing",
    categories: ["clothing", "traditional"],
    rating: 4.9,
    reviews: 156,
    price: "₹1000-5000",
    location: "Old Town, 4.1 km",
    phone: "+91 98765 43213",
    description: "Luxury tailoring services for special occasions and traditional wear.",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400",
    verified: true,
  },
  {
    id: 5,
    name: "QuickFix Plumbing",
    service: "Plumbing",
    categories: ["home-services", "plumbing"],
    rating: 4.7,
    reviews: 98,
    price: "₹300-1500",
    location: "Sector 5, 3.0 km",
    phone: "+91 98765 43214",
    description: "Fast and reliable plumbing services for all residential and commercial needs.",
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400",
    verified: true,
  },
  {
    id: 6,
    name: "Glow Beauty Studio",
    service: "Salon",
    categories: ["beauty", "salon", "makeup"],
    rating: 4.8,
    reviews: 215,
    price: "₹400-2500",
    location: "Mall Road, 1.5 km",
    phone: "+91 98765 43215",
    description: "Full-service beauty salon offering haircuts, styling, makeup, and skincare treatments.",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400",
    verified: true,
    womenLed: true,
  },
  {
    id: 7,
    womenLed: true,
    name: "SparkClean Services",
    service: "Cleaning",
    categories: ["home-services", "cleaning"],
    rating: 4.4,
    reviews: 76,
    price: "₹500-3000",
    location: "Phase 2, 4.5 km",
    phone: "+91 98765 43216",
    description: "Professional deep cleaning services for homes, offices, and commercial spaces.",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400",
    verified: false,
  },
  {
    id: 8,
    name: "Chef Hussain's Kitchen",
    service: "Cooking",
    categories: ["food", "cooking", "catering"],
    rating: 4.9,
    reviews: 312,
    price: "₹1000-8000",
    location: "Old Market, 2.0 km",
    phone: "+91 98765 43217",
    description: "Authentic home-style cooking and catering services for events and daily meals.",
    image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400",
    verified: true,
  },
];
