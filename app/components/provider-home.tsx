"use client";
import { useState, useRef } from "react";
import PhotoGallary, { PhotoGalleryRef } from "./photo-gallery";
import {
  Block,
  BlockTitle,
  Button,
  List,
  ListItem,
  ListInput,
  Segmented,
  SegmentedButton,
  Sheet,
  Page,
  Navbar,
  Actions,
  ActionsGroup,
  ActionsLabel,
  ActionsButton,
  Fab,
} from "konsta/react";
import { IonIcon } from "@ionic/react";
import {
  personOutline,
  businessOutline,
  callOutline,
  locationOutline,
  mapOutline,
  star,
  chatbubble,
  addOutline,
  chatboxOutline,
  documentTextOutline,
  arrowBack,
  trashOutline,
  cameraOutline,
} from "ionicons/icons";

interface ProviderDetails {
  name: string;
  service: string;
  description: string;
  phone: string;
  address: string;
  experience: string;
}

interface Review {
  id: number;
  name: string;
  rating: number;
  date: string;
  comment: string;
  reply?: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  photo_url: string;
}

const ProviderHome = () => {
  const [activeTab, setActiveTab] = useState("overview");

  // Overview State
  const [isEditing, setIsEditing] = useState(false);
  const [details, setDetails] = useState<ProviderDetails>({
    name: "Ahmed's Tailoring Shop",
    service: "Clothing & Tailoring",
    description:
      "Expert tailor specializing in traditional and modern clothing designs.",
    phone: "+91 98765 43210",
    address: "123 Fashion Street, Downtown, City - 400001",
    experience: "10+ Years",
  });
  const [tempDetails, setTempDetails] = useState<ProviderDetails>(details);

  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false);
  const [detailsSheetContent, setDetailsSheetContent] = useState({
    title: "",
    content: "",
  });

  const handleOpenDetails = (title: string, content: string) => {
    setDetailsSheetContent({ title, content });
    setDetailsSheetOpen(true);
  };

  // Reviews State
  const [reviews, setReviews] = useState<Review[]>([
    {
      id: 1,
      name: "Sarah Johnson",
      rating: 5,
      date: "2 days ago",
      comment: "Excellent work! Highly recommended!",
    },
    {
      id: 2,
      name: "Mohammed Ali",
      rating: 4,
      date: "1 week ago",
      comment: "Good service and reasonable prices.",
      reply: "Thank you for your visit! We look forward to serving you again.",
    },
  ]);
  const [replySheetOpen, setReplySheetOpen] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const handleReplyOpen = (id: number) => {
    setSelectedReviewId(id);
    setReplyText("");
    setReplySheetOpen(true);
  };

  const handleReplySubmit = () => {
    if (selectedReviewId !== null && replyText.trim()) {
      setReviews((prev) =>
        prev.map((r) =>
          r.id === selectedReviewId ? { ...r, reply: replyText.trim() } : r,
        ),
      );
    }
    setReplySheetOpen(false);
  };

  // Products State
  const [products, setProducts] = useState<Product[]>([
    {
      id: "p1",
      name: "Premium Suit",
      description: "Custom tailored premium quality suit.",
      price: "$250",
      photo_url:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    },
    {
      id: "p2",
      name: "Traditional Kurta",
      description: "Modern design elements applied to traditional attire.",
      price: "$120",
      photo_url:
        "https://images.unsplash.com/photo-1594637879035-79c445bc5d0c?w=400",
    },
  ]);
  const [productSheetOpen, setProductSheetOpen] = useState(false);
  const [deleteActionSheetOpen, setDeleteActionSheetOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Photos State
  const photoGalleryRef = useRef<PhotoGalleryRef>(null);
  const [providerPhotos, setProviderPhotos] = useState<any[]>([1]); // Mock data: [1] means has photos. [] means empty.

  const [tempProduct, setTempProduct] = useState<Product>({
    id: "",
    name: "",
    description: "",
    price: "",
    photo_url: "",
  });

  const handleAddProduct = () => {
    setEditingProduct(null);
    setTempProduct({
      id: "",
      name: "",
      description: "",
      price: "",
      photo_url: "",
    });
    setProductSheetOpen(true);
  };

  const handleEditProduct = (p: Product) => {
    setEditingProduct(p);
    setTempProduct({ ...p });
    setProductSheetOpen(true);
  };

  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSaveProduct = () => {
    if (editingProduct) {
      setProducts((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? tempProduct : p)),
      );
    } else {
      setProducts((prev) => [
        ...prev,
        { ...tempProduct, id: Date.now().toString() },
      ]);
    }
    setProductSheetOpen(false);
  };

  return (
    <div className="pb-24">
      <Block className="px-4 py-2 mt-4 mb-0">
        <Segmented rounded strong>
          <SegmentedButton
            className="!text-xs"
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </SegmentedButton>
          <SegmentedButton
            className="!text-xs"
            active={activeTab === "reviews"}
            onClick={() => setActiveTab("reviews")}
          >
            Reviews
          </SegmentedButton>
          <SegmentedButton
            className="!text-xs"
            active={activeTab === "products"}
            onClick={() => setActiveTab("products")}
          >
            Products
          </SegmentedButton>
          <SegmentedButton
            className="!text-xs"
            active={activeTab === "photos"}
            onClick={() => setActiveTab("photos")}
          >
            Photos
          </SegmentedButton>
        </Segmented>
      </Block>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="animate-in fade-in duration-300">
          <BlockTitle className="flex items-center justify-between">
            <span>Provider Information</span>
            {!isEditing && (
              <Button
                clear
                small
                inline
                rounded
                onClick={() => {
                  setIsEditing(true);
                  setTempDetails({ ...details });
                }}
              >
                Update
              </Button>
            )}
          </BlockTitle>

          <List strongIos insetIos>
            {isEditing ? (
              <>
                <ListInput
                  label="Name"
                  type="text"
                  placeholder="Business Name"
                  value={tempDetails.name}
                  onChange={(e) =>
                    setTempDetails({ ...tempDetails, name: e.target.value })
                  }
                  media={<IonIcon icon={personOutline} />}
                />
                <ListInput
                  label="Service"
                  type="text"
                  placeholder="e.g. Tailoring"
                  value={tempDetails.service}
                  onChange={(e) =>
                    setTempDetails({ ...tempDetails, service: e.target.value })
                  }
                  media={<IonIcon icon={businessOutline} />}
                />
                <ListInput
                  label="Description"
                  type="textarea"
                  placeholder="Brief description..."
                  value={tempDetails.description}
                  onChange={(e) =>
                    setTempDetails({
                      ...tempDetails,
                      description: e.target.value,
                    })
                  }
                  inputClassName="!h-24 resize-none"
                />
                <ListInput
                  label="Phone"
                  type="tel"
                  placeholder="Phone Number"
                  value={tempDetails.phone}
                  onChange={(e) =>
                    setTempDetails({ ...tempDetails, phone: e.target.value })
                  }
                  media={<IonIcon icon={callOutline} />}
                />
                <ListInput
                  label="Address"
                  type="text"
                  placeholder="Your Address"
                  value={tempDetails.address}
                  onChange={(e) =>
                    setTempDetails({ ...tempDetails, address: e.target.value })
                  }
                  media={<IonIcon icon={locationOutline} />}
                />
                <ListInput
                  label="Experience"
                  type="text"
                  placeholder="e.g. 5 Years"
                  value={tempDetails.experience}
                  onChange={(e) =>
                    setTempDetails({
                      ...tempDetails,
                      experience: e.target.value,
                    })
                  }
                  media={<IonIcon icon={mapOutline} />}
                />
                <Block className="grid grid-cols-2 gap-4 mt-4">
                  <Button
                    outline
                    rounded
                    large
                    onClick={() => setIsEditing(false)}
                    className="font-bold border-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    rounded
                    large
                    onClick={() => {
                      setDetails({ ...tempDetails });
                      setIsEditing(false);
                    }}
                    className="font-bold"
                  >
                    Save
                  </Button>
                </Block>
              </>
            ) : (
              <>
                <ListItem
                  title="Name"
                  titleWrapClassName="text-sm"
                  after={
                    <span className="text-slate-800 font-semibold">
                      {details.name}
                    </span>
                  }
                  media={
                    <IonIcon icon={personOutline} className="text-slate-400" />
                  }
                />
                <ListItem
                  title="Service"
                  titleWrapClassName="text-sm"
                  after={
                    <span className="text-slate-800">{details.service}</span>
                  }
                  media={
                    <IonIcon
                      icon={businessOutline}
                      className="text-slate-400"
                    />
                  }
                />
                <ListItem
                  title="Description"
                  titleWrapClassName="text-sm"
                  after={
                    <Button
                      clear
                      small
                      inline
                      onClick={() =>
                        handleOpenDetails("Description", details.description)
                      }
                    >
                      View
                    </Button>
                  }
                  media={
                    <IonIcon
                      icon={documentTextOutline}
                      className="text-slate-400"
                    />
                  }
                />
                <ListItem
                  title="Phone"
                  titleWrapClassName="text-sm"
                  after={
                    <span className="text-slate-800">{details.phone}</span>
                  }
                  media={
                    <IonIcon icon={callOutline} className="text-slate-400" />
                  }
                />
                <ListItem
                  title="Address"
                  titleWrapClassName="text-sm"
                  media={
                    <IonIcon
                      icon={locationOutline}
                      className="text-slate-400"
                    />
                  }
                  after={
                    <Button
                      clear
                      small
                      inline
                      onClick={() =>
                        handleOpenDetails("Address", details.address)
                      }
                    >
                      View
                    </Button>
                  }
                />
                <ListItem
                  title="Experience"
                  titleWrapClassName="text-sm"
                  after={
                    <span className="text-slate-800">{details.experience}</span>
                  }
                  media={
                    <IonIcon icon={mapOutline} className="text-slate-400" />
                  }
                />
              </>
            )}
          </List>

          <Sheet
            opened={detailsSheetOpen}
            onBackdropClick={() => setDetailsSheetOpen(false)}
            className="pb-safe rounded-t-3xl h-fit min-h-[500px] max-h-[80vh]"
          >
            <Page className="static bg-white">
              <Navbar
                title={detailsSheetContent.title}
                leftClassName="w-11"
                left={
                  <Button clear onClick={() => setDetailsSheetOpen(false)}>
                    <IonIcon icon={arrowBack} className="w-5 h-5" />
                  </Button>
                }
              />
              <Block className="overflow-y-auto mt-4 px-4 pb-8 space-y-4 text-slate-700 leading-relaxed whitespace-pre-wrap">
                {detailsSheetContent.content}
                {detailsSheetContent.title === "Address" &&
                  detailsSheetContent.content && (
                    <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 shadow-sm relative h-48 w-full bg-slate-100 flex items-center justify-center">
                      <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(
                          detailsSheetContent.content,
                        )}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                      ></iframe>
                    </div>
                  )}
              </Block>
            </Page>
          </Sheet>
        </div>
      )}

      {/* REVIEWS TAB */}
      {activeTab === "reviews" && (
        <div className="animate-in fade-in duration-300">
          {/* <BlockTitle>Customer Reviews</BlockTitle> */}
          <Block className="space-y-4">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="font-semibold">{r.name}</div>
                  <div className="flex text-yellow-500">
                    {[...Array(5)].map((_, i) => (
                      <IonIcon
                        key={i}
                        icon={star}
                        className={`w-3 h-3 ${i < r.rating ? "" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-700">{r.comment}</p>
                <div className="text-xs text-gray-400 mt-2 border-b border-gray-100 pb-3">
                  {r.date}
                </div>

                {r.reply ? (
                  <div className="mt-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2 mb-1">
                      <IonIcon icon={chatbubble} className="text-indigo-500" />
                      <span className="font-semibold text-xs text-indigo-600">
                        Provider Reply
                      </span>
                    </div>
                    <p className="text-sm text-slate-700">{r.reply}</p>
                  </div>
                ) : (
                  <div className="mt-3 flex justify-end">
                    <Button
                      clear
                      small
                      inline
                      rounded
                      onClick={() => handleReplyOpen(r.id)}
                      className="text-indigo-600"
                    >
                      <div className="flex items-center gap-1">
                        <IonIcon icon={chatboxOutline} />
                        <span>Reply</span>
                      </div>
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </Block>

          <Sheet
            opened={replySheetOpen}
            onBackdropClick={() => setReplySheetOpen(false)}
            className="pb-safe rounded-t-3xl min-h-[500px]"
          >
            <Page className="flex flex-col">
              <Navbar
                title="Reply to Review"
                leftClassName="w-11"
                left={
                  <Button clear onClick={() => setReplySheetOpen(false)}>
                    <IonIcon icon={arrowBack} className="w-5 h-5" />
                  </Button>
                }
              />
              <List strongIos insetIos>
                <ListInput
                  label="Your Response"
                  type="textarea"
                  placeholder="Thank the customer for their review..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  inputClassName="!h-32 resize-none"
                />
              </List>
              <Block className="mt-auto">
                <Button
                  large
                  rounded
                  onClick={handleReplySubmit}
                  disabled={!replyText.trim()}
                >
                  Submit Reply
                </Button>
              </Block>
            </Page>
          </Sheet>
        </div>
      )}

      {/* PRODUCTS TAB */}
      {activeTab === "products" && (
        <div className="animate-in fade-in duration-300">
          <List strongIos outlineIos className="!mx-0">
            {products.map((p) => (
              <ListItem
                key={p.id}
                link
                chevronMaterial={false}
                title={p.name}
                after={p.price}
                text={p.description}
                media={
                  p.photo_url ? (
                    <img
                      className="ios:rounded-lg material:rounded-full ios:w-20 material:w-10 h-20 object-cover"
                      src={p.photo_url}
                      width="80"
                      height="80"
                      alt={p.name}
                    />
                  ) : (
                    <div className="ios:rounded-lg material:rounded-full bg-slate-200 ios:w-20 material:w-10 h-20 flex items-center justify-center text-slate-400">
                      Img
                    </div>
                  )
                }
                onClick={() => handleEditProduct(p)}
              />
            ))}
            {products.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                You haven't added any products yet.
              </div>
            )}
          </List>

          <div className="h-40"></div>

          <Fab
            className="fixed right-6 bottom-safe-28 z-20"
            icon={<IonIcon icon={addOutline} />}
            text="Add Product"
            textPosition="after"
          />

          <Sheet
            opened={productSheetOpen}
            onBackdropClick={() => setProductSheetOpen(false)}
            className="pb-safe rounded-t-3xl h-fit min-h-[80vh] max-h-[90vh]"
          >
            <Page className="flex flex-col">
              <Navbar
                title={editingProduct ? "Edit Product" : "Add Product"}
                leftClassName="w-11"
                rightClassName="w-11"
                left={
                  <Button clear onClick={() => setProductSheetOpen(false)}>
                    <IonIcon icon={arrowBack} className="w-5 h-5" />
                  </Button>
                }
                right={
                  editingProduct && (
                    <Button
                      clear
                      onClick={() => setDeleteActionSheetOpen(true)}
                      className="text-red-500"
                    >
                      <IonIcon icon={trashOutline} className="w-5 h-5" />
                    </Button>
                  )
                }
              />
              <div className="overflow-y-auto pb-4">
                <label className="block mt-6 mb-4 text-center cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setTempProduct({
                          ...tempProduct,
                          photo_url: URL.createObjectURL(file),
                        });
                      }
                    }}
                  />
                  <div className="w-32 h-32 mx-auto rounded-2xl overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-gray-500 relative transition-all active:scale-95">
                    {tempProduct.photo_url ? (
                      <img
                        src={tempProduct.photo_url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <>
                        <IonIcon
                          icon={cameraOutline}
                          className="text-3xl mb-1 text-indigo-400"
                        />
                        <span className="text-xs font-semibold text-slate-500">
                          Upload Photo
                        </span>
                      </>
                    )}
                    {tempProduct.photo_url && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-100 backdrop-blur-[2px]">
                        <span className="text-white text-xs font-semibold px-3 py-1 border border-white/50 rounded-full">
                          Change
                        </span>
                      </div>
                    )}
                  </div>
                </label>
                <List strongIos insetIos className="!mt-0">
                  <ListInput
                    label="Name"
                    type="text"
                    placeholder="Product/Service Name"
                    value={tempProduct.name}
                    onChange={(e) =>
                      setTempProduct({ ...tempProduct, name: e.target.value })
                    }
                  />
                  <ListInput
                    label="Price"
                    type="text"
                    placeholder="e.g. $100"
                    value={tempProduct.price}
                    onChange={(e) =>
                      setTempProduct({ ...tempProduct, price: e.target.value })
                    }
                  />

                  <ListInput
                    label="Description"
                    type="textarea"
                    placeholder="Detailed description..."
                    value={tempProduct.description}
                    onChange={(e) =>
                      setTempProduct({
                        ...tempProduct,
                        description: e.target.value,
                      })
                    }
                    inputClassName="!h-32 min-h-[6rem] py-2 resize-none"
                  />
                </List>
              </div>
              <Block className="mt-auto">
                <Button
                  large
                  rounded
                  onClick={handleSaveProduct}
                  disabled={!tempProduct.name || !tempProduct.price}
                >
                  {editingProduct ? "Save Changes" : "Add Product"}
                </Button>
              </Block>
            </Page>
          </Sheet>

          <Actions
            opened={deleteActionSheetOpen}
            onBackdropClick={() => setDeleteActionSheetOpen(false)}
          >
            <ActionsGroup>
              <ActionsLabel>
                This product will be permanently removed.
              </ActionsLabel>
              <ActionsButton
                onClick={() => {
                  if (editingProduct) {
                    handleDeleteProduct(editingProduct.id);
                  }
                  setDeleteActionSheetOpen(false);
                  setProductSheetOpen(false);
                }}
                className="text-red-500 font-semibold"
              >
                Delete
              </ActionsButton>
            </ActionsGroup>
            <ActionsGroup>
              <ActionsButton
                onClick={() => setDeleteActionSheetOpen(false)}
                bold
              >
                Cancel
              </ActionsButton>
            </ActionsGroup>
          </Actions>
        </div>
      )}

      {/* PHOTOS TAB */}
      {activeTab === "photos" && (
        <div className="animate-in fade-in duration-300 relative">
          {providerPhotos.length === 0 ? (
            <Block className="text-center">
              <div className="text-slate-400 mb-4 inline-block">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <IonIcon
                    icon={mapOutline}
                    className="text-4xl text-slate-400"
                  />
                </div>
              </div>
              <div className="text-slate-600 font-semibold text-lg">
                Coming Soon
              </div>
              <div className="text-slate-500 text-sm mt-2 max-w-xs mx-auto">
                Photo gallery management will be available in a future update.
              </div>
            </Block>
          ) : (
            <Block className="mt-8 text-center pt-8 !px-0">
              <PhotoGallary ref={photoGalleryRef} />
            </Block>
          )}

          <Fab
            className="fixed right-6 bottom-safe-28 z-20"
            icon={<IonIcon icon={addOutline} />}
            text="Add Photo"
            textPosition="after"
          />
        </div>
      )}
    </div>
  );
};

export default ProviderHome;
