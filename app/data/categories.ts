export interface Category {
  id: string;
  name: string;
  icon: string;
  children?: Category[];
}

export const CATEGORIES: Category[] = [
  {
    id: "clothing",
    name: "Clothing",
    icon: "👔",
    children: [
      { id: "tailoring", name: "Tailoring", icon: "🧵" },
      { id: "alterations", name: "Alterations", icon: "✂️" },
      { id: "designer-wear", name: "Designer Wear", icon: "👗" },
      { id: "traditional", name: "Traditional Wear", icon: "🥻" },
    ],
  },
  {
    id: "home-services",
    name: "Home Services",
    icon: "🏠",
    children: [
      { id: "plumbing", name: "Plumbing", icon: "🔧" },
      { id: "electrician", name: "Electrician", icon: "⚡" },
      { id: "painting", name: "Painting", icon: "🎨" },
      { id: "cleaning", name: "Cleaning", icon: "🧹" },
      { id: "gardening", name: "Gardening", icon: "🌱" },
    ],
  },
  {
    id: "beauty",
    name: "Beauty & Wellness",
    icon: "💅",
    children: [
      { id: "salon", name: "Salon", icon: "💇" },
      { id: "makeup", name: "Makeup", icon: "💄" },
      { id: "mehandi", name: "Mehandi", icon: "🤲" },
      { id: "spa", name: "Spa & Massage", icon: "🧖" },
    ],
  },
  {
    id: "transport",
    name: "Transport & Logistics",
    icon: "🚗",
    children: [
      { id: "delivery", name: "Delivery", icon: "📦" },
      { id: "shifting", name: "Shifting", icon: "🚚" },
      { id: "car-wash", name: "Car Wash", icon: "🚿" },
    ],
  },
  {
    id: "food",
    name: "Food & Cooking",
    icon: "🍳",
    children: [
      { id: "cooking", name: "Cooking", icon: "👨‍🍳" },
      { id: "catering", name: "Catering", icon: "🍽️" },
      { id: "tiffin", name: "Tiffin Service", icon: "🥘" },
    ],
  },
  {
    id: "repair",
    name: "Repair & Maintenance",
    icon: "🔨",
    children: [
      { id: "appliance-repair", name: "Appliance Repair", icon: "📺" },
      { id: "furniture-repair", name: "Furniture Repair", icon: "🪑" },
      { id: "phone-repair", name: "Phone Repair", icon: "📱" },
    ],
  },
];

/** Get all child IDs for a parent category */
export function getChildIds(category: Category): string[] {
  return category.children?.map((c) => c.id) ?? [];
}

/** Find display label for a filter ID */
export function getFilterLabel(filterId: string): string {
  for (const cat of CATEGORIES) {
    if (cat.id === filterId) return cat.name;
    const child = cat.children?.find((c) => c.id === filterId);
    if (child) return child.name;
  }
  return filterId;
}
