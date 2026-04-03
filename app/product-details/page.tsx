"use client"
import { Block, Navbar, Button, Page, BlockTitle } from "konsta/react";
import { useState } from "react";
import Link from "next/link";
import { ROUTE_PATH } from "@/utils/contants";
import { IonIcon } from "@ionic/react";
import { arrowBack, star, call, chatbubble } from "ionicons/icons";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  photo_url: string;
  display_order: number;
  is_active: boolean;
}

export default function ProductDetailsPage() {
  const [quantity, setQuantity] = useState(1);

  const router = useRouter()

  // Mock product data - this would come from API based on product ID
  const product: Product = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    name: "Premium Suit - Custom Tailored",
    description: "Expertly crafted premium suit with high-quality fabric. Perfect for special occasions and business meetings. Custom measurements included for perfect fit. Available in various colors and sizes.",
    price: 5000,
    currency: "INR",
    photo_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
    display_order: 1,
    is_active: true
  };

  const relatedProducts: Product[] = [
    {
      id: "223e4567-e89b-12d3-a456-426614174001",
      name: "Business Shirt",
      description: "Professional business shirt with premium fabric",
      price: 1200,
      currency: "INR",
      photo_url: "https://images.unsplash.com/photo-1596755098206-66d6dc2b2876?w=400",
      display_order: 2,
      is_active: true
    },
    {
      id: "323e4567-e89b-12d3-a456-426614174002",
      name: "Traditional Kurta",
      description: "Traditional kurta with modern design elements",
      price: 1800,
      currency: "INR",
      photo_url: "https://images.unsplash.com/photo-1594637879035-79c445bc5d0c?w=400",
      display_order: 3,
      is_active: true
    },
    {
      id: "424e4567-e89b-12d3-a456-426614174003",
      name: "Formal Trousers",
      description: "Well-fitted formal trousers for office wear",
      price: 1500,
      currency: "INR",
      photo_url: "https://images.unsplash.com/photo-1594637879035-79c445bc5d0c?w=400",
      display_order: 4,
      is_active: true
    }
  ];

  return (
    <Page style={{
      background: 'radial-gradient(at 0% 10%, #f0eff4, #f0ecff)',
    }}>
      <Navbar
        centerTitle={false}
        title="Product Details"
        titleClassName="ml-2"
        innerClassName="justify-start"
        leftClassName="w-11"
        left={
          <button onClick={() => router.back()}>
            <IonIcon icon={arrowBack} />
          </button>
        }
      />

      {/* Product Image */}
      <Block>
        <div className="bg-white rounded-lg overflow-hidden shadow-md">
          <img
            src={product.photo_url}
            alt={product.name}
            className="w-full h-80 object-cover"
          />
        </div>
      </Block>
      <Block>
          <h2 className="text-xl font-bold mb-2">{product.name}</h2>
         <div className="flex items-center gap-2 mb-3">
            <div className="text-2xl font-bold text-primary">
              {product.currency} {product.price.toLocaleString()}
            </div>
            <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              In Stock
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-gray-700 text-sm leading-relaxed">{product.description}</p>
          </div> 
      </Block>
   
    

      {/* Related Products */}
      <Block className="mt-6">
        <h3 className="text-lg font-semibold mb-4">Related Products</h3>
        <div className="grid grid-cols-2 gap-4">
          {relatedProducts.map((relatedProduct) => (
            <Link key={relatedProduct.id} href={`${ROUTE_PATH.PRODUCT_DETAILS}?id=${relatedProduct.id}`}>
              <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow">
                <img
                  src={relatedProduct.photo_url}
                  alt={relatedProduct.name}
                  className="w-full h-40 object-cover"
                />
                <div className="p-3">
                  <h4 className="font-medium text-sm mb-1 line-clamp-1">{relatedProduct.name}</h4>
                  <div className="text-primary font-semibold">
                    {relatedProduct.currency} {relatedProduct.price.toLocaleString()}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Block>

        {/* CTA Buttons */}
      <Block className="z-10 my-0! flex gap-3 left-0 fixed bottom-6 w-full mt-auto">
       
        <Button
          large
          rounded
          className="flex-1"
          onClick={() => {
            console.log('Send enquiry:', product.id, quantity);
          }}
        >
          <div className="flex items-center justify-center gap-2">
            <IonIcon icon={chatbubble} className="w-5 h-5" />
            <span>Send Enquiry</span>
          </div>
        </Button>
      </Block>

      <div className="h-20"></div>
    </Page>
  );
}
