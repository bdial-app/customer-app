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
} from "konsta/react";
import { BottomSheet } from "./bottom-sheet";
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
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { FormikInput } from "./formik-input";
import { AppDialog } from "./app-dialog";

const overviewSchema = Yup.object({
  name: Yup.string().required("Required"),
  service: Yup.string().required("Required"),
  description: Yup.string().required("Required"),
  phone: Yup.string().required("Required"),
  address: Yup.string().required("Required"),
  experience: Yup.string().required("Required"),
});

const productSchema = Yup.object({
  name: Yup.string().required("Required"),
  price: Yup.string().required("Required"),
  description: Yup.string(),
});

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
  const [activeTab, setActiveTab] = useState("details");

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

  const handleAddProduct = () => {
    setEditingProduct(null);
    setProductSheetOpen(true);
  };

  const handleEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductSheetOpen(true);
  };

  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="pb-24">
      <Block className="px-4 py-2 mt-4 mb-0">
        <Segmented rounded strong>
          <SegmentedButton
            className="!text-xs"
            active={activeTab === "details"}
            onClick={() => setActiveTab("details")}
          >
            Details
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

          <SegmentedButton
            className="!text-xs"
            active={activeTab === "reviews"}
            onClick={() => setActiveTab("reviews")}
          >
            Reviews
          </SegmentedButton>
        </Segmented>
      </Block>

      {/* OVERVIEW TAB */}
      {activeTab === "details" && (
        <div className="animate-in fade-in duration-300">
          <BlockTitle className="flex items-center justify-between">
            <span>Provider Information</span>
            {!isEditing && (
              <Button
                clear
                small
                inline
                rounded
                onClick={() => setIsEditing(true)}
              >
                Update
              </Button>
            )}
          </BlockTitle>

          <List strongIos insetIos>
            {isEditing ? (
              <Formik
                initialValues={details}
                validationSchema={overviewSchema}
                onSubmit={(values) => {
                  setDetails(values);
                  setIsEditing(false);
                }}
              >
                {({ isValid, dirty }) => (
                  <Form className="contents">
                    <FormikInput
                      name="name"
                      label="Name"
                      type="text"
                      placeholder="Business Name"
                      media={<IonIcon icon={personOutline} />}
                    />
                    <FormikInput
                      name="service"
                      label="Service"
                      type="text"
                      placeholder="e.g. Tailoring"
                      media={<IonIcon icon={businessOutline} />}
                    />
                    <FormikInput
                      name="description"
                      label="Description"
                      type="textarea"
                      placeholder="Brief description..."
                      inputClassName="!h-24 resize-none"
                      media={<IonIcon icon={documentTextOutline} />}
                    />
                    <FormikInput
                      name="phone"
                      label="Phone"
                      type="tel"
                      placeholder="Phone Number"
                      media={<IonIcon icon={callOutline} />}
                    />
                    <FormikInput
                      name="address"
                      label="Address"
                      type="text"
                      placeholder="Your Address"
                      media={<IonIcon icon={locationOutline} />}
                    />
                    <FormikInput
                      name="experience"
                      label="Experience"
                      type="text"
                      placeholder="e.g. 5 Years"
                      media={<IonIcon icon={mapOutline} />}
                    />
                    <Block className="grid grid-cols-2 gap-4 mt-4">
                      <Button
                        outline
                        rounded
                        large
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="font-bold border-2"
                      >
                        Cancel
                      </Button>
                      <Button
                        rounded
                        large
                        type="submit"
                        className="font-bold"
                        disabled={!isValid || !dirty}
                      >
                        Save
                      </Button>
                    </Block>
                  </Form>
                )}
              </Formik>
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
                    <span className="text-slate-800 dark:text-slate-200">{details.service}</span>
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
                    <span className="text-slate-800 dark:text-slate-200">{details.phone}</span>
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
                    <span className="text-slate-800 dark:text-slate-200">{details.experience}</span>
                  }
                  media={
                    <IonIcon icon={mapOutline} className="text-slate-400" />
                  }
                />
              </>
            )}
          </List>

          <BottomSheet
            opened={detailsSheetOpen}
            onClose={() => setDetailsSheetOpen(false)}
            title={detailsSheetContent.title}
            className="max-h-[80vh]"
            headerLeft={
              <button onClick={() => setDetailsSheetOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                <IonIcon icon={arrowBack} className="w-5 h-5 text-gray-500 dark:text-slate-400" />
              </button>
            }
          >
            <div className="overflow-y-auto px-4 pb-8 pt-4 space-y-4 text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {detailsSheetContent.content}
                {detailsSheetContent.title === "Address" &&
                  detailsSheetContent.content && (
                    <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm relative h-48 w-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
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
            </div>
          </BottomSheet>
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

          <BottomSheet
            opened={replySheetOpen}
            onClose={() => setReplySheetOpen(false)}
            title="Reply to Review"
            headerLeft={
              <button onClick={() => setReplySheetOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                <IonIcon icon={arrowBack} className="w-5 h-5 text-gray-500 dark:text-slate-400" />
              </button>
            }
          >
            <div className="flex flex-col flex-1">
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
              <div className="px-4 pb-4 mt-auto">
                <button
                  className="w-full py-3.5 rounded-2xl bg-teal-500 text-white font-semibold text-sm disabled:opacity-50 transition-all active:scale-[0.98]"
                  onClick={handleReplySubmit}
                  disabled={!replyText.trim()}
                >
                  Submit Reply
                </button>
              </div>
            </div>
          </BottomSheet>
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

          {/* Floating Add Product button */}
          <button
            onClick={handleAddProduct}
            className="fixed right-6 bottom-28 z-20 flex items-center gap-2 h-11 px-5 rounded-full bg-amber-500 text-white font-semibold text-sm shadow-lg shadow-amber-200/50 active:scale-95 transition-all"
          >
            <IonIcon icon={addOutline} className="w-5 h-5" />
            Add Product
          </button>

          <BottomSheet
            opened={productSheetOpen}
            onClose={() => setProductSheetOpen(false)}
            title={editingProduct ? "Edit Product" : "Add Product"}
            className="max-h-[90vh]"
            headerLeft={
              <button onClick={() => setProductSheetOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                <IonIcon icon={arrowBack} className="w-5 h-5 text-gray-500 dark:text-slate-400" />
              </button>
            }
            headerRight={
              editingProduct ? (
                <button
                  onClick={() => setDeleteActionSheetOpen(true)}
                  className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center"
                >
                  <IonIcon icon={trashOutline} className="w-5 h-5 text-red-500" />
                </button>
              ) : undefined
            }
          >
              <div className="overflow-y-auto pb-4">
                <Formik
                  initialValues={
                    editingProduct || {
                      id: "",
                      name: "",
                      description: "",
                      price: "",
                      photo_url: "",
                    }
                  }
                  validationSchema={productSchema}
                  enableReinitialize
                  onSubmit={(values) => {
                    if (editingProduct) {
                      setProducts((prev) =>
                        prev.map((p) =>
                          p.id === editingProduct.id ? (values as Product) : p,
                        ),
                      );
                    } else {
                      setProducts((prev) => [
                        ...prev,
                        { ...(values as Product), id: Date.now().toString() },
                      ]);
                    }
                    setProductSheetOpen(false);
                  }}
                >
                  {({ values, setFieldValue, isValid, dirty }) => (
                    <Form className="contents">
                      <label className="block mt-6 mb-4 text-center cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setFieldValue(
                                "photo_url",
                                URL.createObjectURL(file),
                              );
                            }
                          }}
                        />
                        <div className="w-64 h-64 mx-auto rounded-2xl overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-gray-500 relative transition-all active:scale-95">
                          {values.photo_url ? (
                            <img
                              src={values.photo_url}
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
                          {values.photo_url && (
                            <div
                              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-100"
                              style={{
                                backdropFilter: !values.photo_url
                                  ? "blur(2px)"
                                  : "none",
                              }}
                            >
                              <span className="text-white text-xs font-semibold px-3 py-1 border border-white/50 rounded-full">
                                Change
                              </span>
                            </div>
                          )}
                        </div>
                      </label>
                      <List strongIos insetIos className="!mt-0">
                        <FormikInput
                          name="name"
                          label="Name"
                          type="text"
                          placeholder="Product/Service Name"
                        />
                        <FormikInput
                          name="price"
                          label="Price"
                          type="text"
                          placeholder="e.g. $100"
                        />

                        <FormikInput
                          name="description"
                          label="Description"
                          type="textarea"
                          placeholder="Detailed description..."
                          inputClassName="!h-32 min-h-[6rem] py-2 resize-none"
                          media={<IonIcon icon={documentTextOutline} />}
                        />
                      </List>
                      <Block className="mt-auto">
                        <Button
                          large
                          rounded
                          type="submit"
                          disabled={!isValid || (!dirty && !values.photo_url)}
                        >
                          {editingProduct ? "Save Changes" : "Add Product"}
                        </Button>
                      </Block>
                    </Form>
                  )}
                </Formik>
              </div>
          </BottomSheet>

          <AppDialog
            open={deleteActionSheetOpen}
            onClose={() => setDeleteActionSheetOpen(false)}
            icon={trashOutline}
            iconColor="text-red-500"
            iconBg="bg-red-50"
            title="Delete Product?"
            description="This product will be permanently removed."
            confirmLabel="Delete"
            cancelLabel="Cancel"
            onConfirm={() => {
              if (editingProduct) {
                handleDeleteProduct(editingProduct.id);
              }
              setDeleteActionSheetOpen(false);
              setProductSheetOpen(false);
            }}
            confirmColor="red"
          />
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

          {/* Floating Add Photo button */}
          <button
            className="fixed right-6 bottom-28 z-20 flex items-center gap-2 h-11 px-5 rounded-full bg-amber-500 text-white font-semibold text-sm shadow-lg shadow-amber-200/50 active:scale-95 transition-all"
          >
            <IonIcon icon={addOutline} className="w-5 h-5" />
            Add Photo
          </button>
        </div>
      )}
    </div>
  );
};

export default ProviderHome;
