"use client"
import { Block, Navbar, Button, Page, Sheet, List, ListInput } from "konsta/react";
import { useState } from "react";
import Link from "next/link";
import { ROUTE_PATH } from "@/utils/contants";
import { IonIcon } from "@ionic/react";
import { arrowBack, star, call, chatbubble, location, shareSocial } from "ionicons/icons";

interface ProviderDetails {
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
  address: string;
  experience: string;
  availability: string;
}

interface Review {
  id: number;
  name: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
}

export default function ProviderDetailsPage() {
  const [activeTab, setActiveTab] = useState("overviews");
  const [sheetOpened, setSheetOpened] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: ""
  });

  // Mock data - this would come from API based on provider ID
  const provider: ProviderDetails = {
    id: 1,
    name: "Ahmed's Tailoring Shop",
    service: "Clothing",
    rating: 4.8,
    reviews: 127,
    price: "₹500-2000",
    location: "Downtown, 2.5 km",
    phone: "+91 98765 43210",
    description: "Expert tailor specializing in traditional and modern clothing designs. Over 10 years of experience providing high-quality tailoring services for all occasions.",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400",
    verified: true,
    address: "123 Fashion Street, Downtown, City - 400001",
    experience: "10+ Years",
    availability: "Mon-Sat: 9AM-8PM"
  };

  const handleShare = async () => {
    const shareData = {
      title: provider.name,
      text: `Check out ${provider.name} - ${provider.service}\nRating: ${provider.rating}⭐\n${provider.description}\nAddress: ${provider.address}`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback for browsers that don't support Web Share API
        const textToCopy = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
        await navigator.clipboard.writeText(textToCopy);
        alert('Provider details copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  // Mock reviews data
  const reviews: Review[] = [
    {
      id: 1,
      name: "Sarah Johnson",
      rating: 5,
      date: "2 days ago",
      comment: "Excellent work! Ahmed did an amazing job with my wedding dress. The fit was perfect and the quality exceeded my expectations. Highly recommended!",
      verified: true
    },
    {
      id: 2,
      name: "Mohammed Ali",
      rating: 4,
      date: "1 week ago",
      comment: "Good service and reasonable prices. Got my traditional kurta stitched here and it turned out well. Slight delay in delivery but overall satisfied.",
      verified: true
    },
    {
      id: 3,
      name: "Fatima Khan",
      rating: 5,
      date: "2 weeks ago",
      comment: "Ahmed is a master tailor! He recreated a vintage design for me exactly as I wanted. Attention to detail is incredible. Will definitely come back.",
      verified: false
    },
    {
      id: 4,
      name: "Raj Patel",
      rating: 4,
      date: "3 weeks ago",
      comment: "Professional work and timely delivery. The alterations on my suit were done perfectly. Prices are a bit higher than local shops but worth the quality.",
      verified: true
    },
    {
      id: 5,
      name: "Aisha Begum",
      rating: 5,
      date: "1 month ago",
      comment: "I've been coming here for years and never disappointed. Ahmed's work with traditional wear is exceptional. He understands cultural preferences perfectly.",
      verified: true
    }
  ];

  // Gallery images for bento grid
  const galleryImages = [
    "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400",
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400",
    "https://images.unsplash.com/photo-1560749614-612495a177a5?w=400",
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400"
  ];

  return (
    <Page style={{
      background: 'radial-gradient(at 0% 10%, #f0eff4, #f0ecff)',
    }}>
      <Navbar
        centerTitle={false}
        title="Provider Details"
        titleClassName="ml-2"
        innerClassName="justify-start"
        leftClassName="w-11"
        left={
          <Link href={ROUTE_PATH.SERVICE_PROVIDERS}>
            <IonIcon icon={arrowBack} />
          </Link>
        }
        rightClassName="w-11"
        right={
          <Button clear onClick={handleShare}>
            <IonIcon icon={shareSocial} className="w-5 h-5" />
          </Button>
        }
      />

      {/* Sub Navbar */}
      <Navbar
        large={false}
        subnavbar
        className="bg-white dark:bg-gray-800"
        innerClassName="overflow-x-auto"
      >
        <div className="flex gap-6 px-4">
          <Button
            clear
            className={`font-medium ${activeTab === "overviews" ? "text-primary" : "text-gray-500"}`}
            onClick={() => setActiveTab("overviews")}
          >
            Overviews
          </Button>
          <Button
            clear
            className={`font-medium ${activeTab === "reviews" ? "text-primary" : "text-gray-500"}`}
            onClick={() => setActiveTab("reviews")}
          >
            Reviews
          </Button>
          <Button
            clear
            className={`font-medium ${activeTab === "services" ? "text-primary" : "text-gray-500"}`}
            onClick={() => setActiveTab("services")}
          >
            Services
          </Button>
          <Button
            clear
            className={`font-medium ${activeTab === "photos" ? "text-primary" : "text-gray-500"}`}
            onClick={() => setActiveTab("photos")}
          >
            Photos
          </Button>
        </div>
      </Navbar>

      {/* Tab Content */}
      {activeTab === "overviews" && (
        <>
          {/* Bento Grid Layout - Only show on Overviews tab */}
          <Block className="mt-4">
            <div className="grid grid-cols-2 gap-2">
              {/* Large Image - 50% width */}
              <Link href={ROUTE_PATH.GALLERY}>
                <div className="col-span-1 row-span-2 rounded-lg overflow-hidden shadow-md cursor-pointer hover:opacity-90 transition-opacity">
                  <img
                    src={provider.image}
                    alt={provider.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </Link>

              {/* Right Column with 2 images */}
              <Link href={ROUTE_PATH.GALLERY}>
                <div className="col-span-1 row-span-1 rounded-lg overflow-hidden shadow-md cursor-pointer hover:opacity-90 transition-opacity">
                  <img
                    src={galleryImages[0]}
                    alt="Gallery 1"
                    className="w-full h-full object-cover"
                  />
                </div>
              </Link>

              <Link href={ROUTE_PATH.GALLERY}>
                <div className="col-span-1 row-span-1 rounded-lg overflow-hidden shadow-md bg-gray-200 relative cursor-pointer hover:opacity-90 transition-opacity">
                  <img
                    src={galleryImages[1]}
                    alt="Gallery 2"
                    className="w-full h-full object-cover opacity-75"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white bg-black bg-opacity-50 px-3 py-1 rounded-full text-sm">
                      +{galleryImages.length - 2} more
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          </Block>

          {/* Provider Details */}
          <Block>
            <div className="flex flex-col justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">{provider.name}</h2>
                  {provider.verified && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      ✓ Verified
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-sm">{provider.service}</p>
              </div>
              <div className="">
                <div className="font-semibold text-primary text-lg">{provider.price}</div>
              </div>
            </div>

            {/* Rating and Location */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                <IonIcon icon={star} className="w-4 h-4 text-yellow-500" />
                <span className="font-medium">{provider.rating}</span>
                <span className="text-gray-500 text-sm">({provider.reviews} reviews)</span>
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                <IonIcon icon={location} className="w-4 h-4" />
                <span className="text-sm">{provider.location}</span>
              </div>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500">Experience</p>
                <p className="font-semibold">{provider.experience}</p>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500">Availability</p>
                <p className="font-semibold">{provider.availability}</p>
              </div>
            </div>

            {/* Description */}
            <div className="mb-4">
              <h3 className="font-semibold mb-2">About</h3>
              <p className="text-gray-700 text-sm leading-relaxed">{provider.description}</p>
            </div>

            {/* Address */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Address</h3>
              <p className="text-gray-700 text-sm">{provider.address}</p>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-3 left-0 sticky bottom-6 w-full mt-auto">
              <Button
                large
                rounded
                clear
                className="flex-1 bg-white dark:bg-gray-800"
                onClick={() => {
                  // Handle messaging
                  console.log('Message provider');
                }}
              >
                <div className="flex items-center justify-center gap-2">
                  <IonIcon icon={chatbubble} className="w-5 h-5" />
                  <span>Message</span>
                </div>
              </Button>

              <Button
                large
                rounded
                className="flex-1"
                onClick={() => {
                  // Handle calling
                  console.log('Call provider');
                  window.open(`tel:${provider.phone}`);
                }}
              >
                <div className="flex items-center justify-center gap-2">
                  <IonIcon icon={call} className="w-5 h-5" />
                  <span>Call</span>
                </div>
              </Button>
            </div>
          </Block>
        </>
      )}

      {activeTab === "reviews" && (
        <>
          {/* Rating Summary */}
          <Block className="mt-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{provider.rating}</div>
                    <div className="text-sm text-gray-500">out of 5</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <IonIcon
                          key={star}
                          icon="star"
                          className={`w-4 h-4 ${star <= Math.floor(provider.rating) ? 'text-yellow-500' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    <div className="text-sm text-gray-600">{provider.reviews} reviews</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Verified</div>
                  <div className="font-semibold text-green-600">{reviews.filter(r => r.verified).length} reviews</div>
                </div>
              </div>
            </div>
          </Block>

          {/* Reviews List */}
          <Block className="mt-4">
            <Block className="left-0 fixed bottom-0 w-full mt-auto">
              <Button
                large
                rounded
                className="w-full"
                onClick={() => setSheetOpened(true)}
              >
                <div className="flex items-center justify-center gap-2">
                  <IonIcon icon={star} className="w-5 h-5" />
                  <span>Make Review</span>
                </div>
              </Button>
            </Block>
            
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                        {review.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{review.name}</span>
                          {review.verified && (
                            <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                              ✓ Verified
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{review.date}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <IonIcon
                          key={star}
                          icon="star"
                          className={`w-3 h-3 ${star <= review.rating ? 'text-yellow-500' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>
          </Block>
        </>
      )}

      {activeTab === "services" && (
        <Block className="mt-8 text-center">
          <div className="py-16">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
              <IonIcon icon={chatbubble} className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Services Listed</h3>
            <p className="text-gray-500">This provider hasn't added their services yet</p>
          </div>
        </Block>
      )}

      {activeTab === "photos" && (
        <Block className="mt-8 text-center">
          <div className="py-16">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
              <IonIcon icon={shareSocial} className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Photos Yet</h3>
            <p className="text-gray-500">This provider hasn't uploaded photos</p>
          </div>
        </Block>
      )}

      {/* Review Bottom Sheet */}
      <Sheet
        opened={sheetOpened}
        onBackdropClick={() => setSheetOpened(false)}
        className="pb-safe rounded-3xl"
      >
        <Page className="static">
          <Navbar title="Make a Review"  leftClassName="w-11" left={<Button clear onClick={() => setSheetOpened(false)}>
              <IonIcon icon={arrowBack} className="w-5 h-5" />
            </Button>} />
          

          <List strongIos insetIos>
            <div className="p-4">
              <label className="block text-sm font-medium mb-3">Rating</label>
              <div className="flex gap-2 justify-center mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Button
                    key={star}
                    clear
                    onClick={() => setReviewData(prev => ({ ...prev, rating: star }))}
                    className="p-1"
                  >
                    <IonIcon
                      icon="star"
                      style={{ fontSize: '32px' }}
                      className={`${star <= reviewData.rating ? 'text-yellow-500' : 'text-gray-300'}`}
                    />
                  </Button>
                ))}
              </div>
            </div>

            <ListInput
              label="Your Review"
              type="textarea"
              placeholder="Share your experience with this provider..."
              value={reviewData.comment}
              onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
              inputClassName="!h-28 resize-none"
            />
          </List>
           <Block>
          <div className="flex gap-3">
            <Button
              clear
              className="flex-1"
              onClick={() => setSheetOpened(false)}
            >
              Cancel
            </Button>
            <Button
              large
              rounded
              className="flex-1"
              onClick={() => {
                // Handle review submission
                console.log('Submitting review:', reviewData);
                setSheetOpened(false);
                // Reset form
                setReviewData({ rating: 5, comment: "" });
              }}
              disabled={!reviewData.comment.trim()}
            >
              Submit Review
            </Button>
          </div>
            </Block>     
          </Page>
      </Sheet>
    </Page>
  );
}
