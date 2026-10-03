import {
  home,
  compass,
  bookmark,
  chatbubbles,
  person,
  location,
  search,
  grid,
  storefront,
  pricetag,
  sparkles,
  bagHandle,
  construct,
  flame,
  layers,
  options,
  documentText,
  funnel,
  heart,
  chatbubbleEllipses,
  attach,
  shieldCheckmark,
  colorPalette,
  helpBuoy,
  logIn,
  happy,
  flag,
  images,
  star,
  time,
  navigate,
} from "ionicons/icons";
import type { TourChapter } from "../business-tour/tour-content";

/** The real listing the tour opens as an example. */
export interface TourSample {
  providerId: string;
  shopName: string;
  productId: string;
  productName: string;
}

export interface CustomerTourContext {
  firstName: string;
  signedIn: boolean;
  /** Owns a business on Tijarah (shows the Business button instead of "List my business"). */
  hasBusiness: boolean;
  city: string;
}

/** Every chapter of the customer tour, shaped to whether the person is signed in and owns a business. */
export function buildCustomerTour(ctx: CustomerTourContext, sample: TourSample | null): TourChapter[] {
  const hi = ctx.firstName ? `, ${ctx.firstName}` : "";
  const where = ctx.city ? `in ${ctx.city}` : "near you";

  const homeChapter: TourChapter = {
    id: "home",
    title: "Home",
    summary: "Location, search, categories and what's near you",
    minutes: 1,
    icon: home,
    color: "#F59E0B",
    colorTo: "#F97316",
    steps: [
      {
        id: "welcome",
        tab: "home",
        hero: true,
        icon: happy,
        title: `Welcome to Tijarah${hi}`,
        body:
          `Businesses from the community ${where}, all in one place. Here's a quick look around — how to find ` +
          "what you need, tell who you're dealing with, and reach them in a tap.",
        points: [
          "Home — search, categories and what's close by",
          "Explore — businesses, products and services",
          "Saved and Chats — your shortlist and conversations",
          "Profile — your account and settings",
        ],
        cta: "Show me around",
        secondary: "Maybe later",
      },
      {
        id: "location",
        tab: "home",
        anchor: "home-location",
        icon: location,
        title: "Start with where you are",
        body:
          "Tap here to set your area: use your current location, search for a street, or pick a spot on the map. " +
          "Distances and “near you” results across the app are worked out from this point.",
        tip: ctx.signedIn
          ? "Save Home and Work addresses and you can switch between them in one tap."
          : "Signing in lets you save Home and Work so you can switch in one tap.",
      },
      {
        id: "search",
        tab: "home",
        anchor: "home-search",
        icon: search,
        title: "Search for anything",
        body:
          "A shop's name, a service like AC repair, or a product like a rida — one search covers businesses, products, " +
          "services and categories together.",
      },
      {
        id: "categories",
        tab: "home",
        anchor: "home-categories",
        icon: grid,
        title: "Or browse by category",
        body: "Tap a category to see everyone in it. See All opens the full list.",
      },
      {
        id: "business-button",
        tab: "home",
        anchor: "home-business-button",
        icon: storefront,
        ...(ctx.hasBusiness
          ? {
              title: "Your business, one tap away",
              body: "Tap Business to switch to your dashboard — listings, analytics and enquiries. Switch back from its header any time.",
            }
          : {
              title: "Run a business? List it free",
              body:
                "Tap the shop icon to put your business on Tijarah. It's free and takes about 10 minutes.",
            }),
      },
      {
        id: "deals",
        tab: "home",
        anchor: "home-deals",
        optional: true,
        icon: pricetag,
        title: "Offers around you",
        missing:
          "No offers near you right now. When a business nearby posts one, it shows here with the time it has left.",
        body: "Live discounts from businesses nearby, each with the time it has left. See All lists every offer.",
      },
      {
        id: "just-for-you",
        tab: "home",
        anchor: "home-just-for-you",
        optional: true,
        icon: sparkles,
        title: "Picked for you",
        missing: ctx.signedIn
          ? "Your picks aren't ready yet. Browse and save a few things — Tijarah learns which categories you like and fills this with products from them."
          : "Sign in and browse a little — products from the categories you like most will start appearing here.",
        body: "Products from the categories you use most. The more you browse, the better these picks get.",
      },
      {
        id: "products-around",
        tab: "home",
        anchor: "home-products-around",
        optional: true,
        icon: bagHandle,
        title: "Products around you",
        missing:
          "No products are listed near you yet. Try a wider area from the location bar at the top.",
        body: "What local shops are selling — nearest first once your location is set — with the price on every tile.",
        tip: "Tap the heart on anything to keep it in Saved for later.",
      },
      {
        id: "services-around",
        tab: "home",
        anchor: "home-services-around",
        optional: true,
        icon: construct,
        title: "Services around you",
        missing:
          "No services are listed near you yet. Try a wider area from the location bar at the top.",
        body:
          "Local pros near you. The round chat button sends them an enquiry straight away — with the service " +
          "attached, so they know exactly what you're asking about.",
      },
      {
        id: "trending",
        tab: "home",
        anchor: "home-trending-products",
        optional: true,
        icon: flame,
        title: "What's trending",
        missing:
          "Nothing's trending yet \u2014 this list fills up as people in your area browse.",
        body: "The most-viewed products of the last two weeks, ranked — a quick way to see what the community is looking at.",
      },
    ],
  };

  const exploreChapter: TourChapter = {
    id: "explore",
    title: "Explore",
    summary: "Businesses, a products storefront and services, with sort and filters",
    minutes: 1,
    icon: compass,
    color: "#0EA5E9",
    colorTo: "#6366F1",
    steps: [
      {
        id: "nav",
        tab: "explore",
        exploreSegment: "businesses",
        anchor: "nav-explore",
        icon: compass,
        title: "Explore — browse everything",
        body: "When you'd rather look around than search, start here.",
      },
      {
        id: "segments",
        tab: "explore",
        exploreSegment: "businesses",
        anchor: "explore-segments",
        icon: layers,
        title: "Three ways to browse",
        body: "Switch between them any time — each remembers where you were.",
        points: [
          "Businesses — shops and pros, with ratings and distance",
          "Products — things to buy, with prices",
          "Services — work you can book, with a quick enquiry",
        ],
      },
      {
        id: "nearby",
        tab: "explore",
        exploreSegment: "businesses",
        anchor: "explore-nearby",
        optional: true,
        icon: location,
        title: "Popular nearby",
        missing:
          "No businesses are pinned close to you yet. Set your location at the top of Home to see what is nearby.",
        body: "Well-liked businesses close to you, with the distance on every card. See All shows everything near you.",
      },
      {
        id: "products",
        tab: "explore",
        exploreSegment: "products",
        anchor: "explore-segment-products",
        icon: bagHandle,
        title: "A storefront for local products",
        body: "Everything local shops sell, laid out like a shop: categories at the top, curated shelves, then every product.",
      },
      {
        id: "store-categories",
        tab: "explore",
        exploreSegment: "products",
        anchor: "store-categories",
        optional: true,
        icon: grid,
        title: "Shop by category",
        missing:
          "Category tiles appear here once products are listed in them.",
        body: "Each tile shows how many items it has. Tap one to see them all on a page of their own.",
      },
      {
        id: "store-shelf",
        tab: "explore",
        exploreSegment: "products",
        anchor: "store-first-shelf",
        optional: true,
        icon: sparkles,
        title: "Shelves that change with you",
        missing:
          "Shelves appear here once there are enough products near you to fill them.",
        body:
          "Trending, near you, under ₹499, new on Tijarah — shelves follow what's popular and where you are. " +
          "See all opens the full list.",
      },
      {
        id: "store-toolbar",
        tab: "explore",
        exploreSegment: "products",
        anchor: "store-toolbar",
        icon: options,
        title: "Sort and filter",
        body: "Sort by popular, nearest or price. Filters narrow by area, price, seller rating, verified or women-led sellers.",
        tip: "The filter sheet shows how many results you'll get before you apply it — no dead ends.",
      },
      {
        id: "services",
        tab: "explore",
        exploreSegment: "services",
        anchor: "explore-segment-services",
        icon: construct,
        title: "Find a service",
        body:
          "Tailoring, AC repair, catering, tuition and more. Every card shows a starting price or “Get a quote”, " +
          "and Enquire starts a chat with the pro in one tap.",
      },
    ],
  };


  const shop = sample?.shopName ?? "a business";
  const bizRoute = sample ? `/provider-details/?id=${sample.providerId}&tour=1` : undefined;
  const productRoute = sample ? `/product-details/?id=${sample.productId}&tour=1` : undefined;
  const onBiz = { tab: "explore" as const, route: bizRoute };
  const onProduct = { tab: "explore" as const, route: productRoute };

  const businessPageChapter: TourChapter = {
    id: "business-page",
    title: "Business page",
    summary: "What's on every listing and where to find it",
    minutes: 1,
    icon: storefront,
    color: "#0D9488",
    colorTo: "#0284C7",
    steps: [
      {
        id: "intro",
        tab: "explore",
        exploreSegment: "businesses",
        hero: true,
        icon: storefront,
        title: "Let's open a real listing",
        body: sample
          ? `We'll open ${shop} so you can see where everything is. Every business on Tijarah is laid out the same way, so once you know one, you know them all.`
          : "Every business on Tijarah is laid out the same way. Here's what you'll find on one.",
        cta: sample ? `Open ${shop}` : "Next",
      },
      {
        id: "hero",
        ...onBiz,
        anchor: "biz-page-hero",
        scrollBlock: "start",
        icon: images,
        title: "The shop at a glance",
        body: "Their main photo, name and what they do.",
        points: [
          "A blue tick next to the name means the owner is verified",
          "Badges like Top Rated show what the business has earned",
          "Tap the photo count to see every photo",
        ],
      },
      {
        id: "actions",
        ...onBiz,
        anchor: "biz-page-actions",
        icon: heart,
        title: "Save, share or report",
        body: "Bookmark it to Saved, send it to someone on WhatsApp, or flag something that looks wrong.",
      },
      {
        id: "stats",
        ...onBiz,
        anchor: "biz-page-stats",
        icon: star,
        title: "The essentials in one line",
        body: "Their rating, a typical price — or “Contact for price” — and the area they're in.",
      },
      {
        id: "tabs",
        ...onBiz,
        anchor: "biz-page-tabs",
        icon: layers,
        title: "Four tabs, everything covered",
        body: "Tap a tab to jump straight to it.",
        points: [
          "Overview — hours, offers, about and address",
          "Reviews — ratings and what people said",
          "Catalogue — everything they sell, with prices",
          "Photos — the full gallery",
        ],
      },
      {
        id: "chips",
        ...onBiz,
        providerTab: "Overview",
        anchor: "biz-page-chips",
        icon: time,
        title: "Open now? Verified?",
        body: "How many items they list, their hours, whether they're open right now, and whether they're verified.",
      },
      {
        id: "offers",
        ...onBiz,
        providerTab: "Overview",
        anchor: "biz-page-offers",
        icon: pricetag,
        title: "Their live deals",
        body: "Tap a deal to see the full terms and when it ends.",
        missing:
          "This business has no live offers right now. When it posts one, it appears here with the discount and the end date.",
      },
      {
        id: "about",
        ...onBiz,
        providerTab: "Overview",
        anchor: "biz-page-about",
        icon: documentText,
        title: "About the business",
        body: "In the owner's own words — what they do, and how they work.",
      },
      {
        id: "address",
        ...onBiz,
        providerTab: "Overview",
        anchor: "biz-page-address",
        icon: navigate,
        title: "Find them",
        body: ctx.signedIn
          ? "The full address, with Get Directions to open it in your maps app."
          : "Their area is always shown. Sign in to see the full address and get directions.",
        missing: "This business hasn't added an address yet — ask them in a message.",
      },
      {
        id: "reviews",
        ...onBiz,
        providerTab: "Reviews",
        anchor: "biz-page-reviews",
        scrollBlock: "nearest",
        icon: star,
        title: "Reviews from the community",
        body:
          "The overall rating, how the stars split, and every review — including Google reviews when the business has " +
          "linked them. Write a Review adds yours.",
      },
      {
        id: "catalogue",
        ...onBiz,
        providerTab: "Catalogue",
        anchor: "biz-page-catalogue",
        scrollBlock: "nearest",
        icon: bagHandle,
        title: "Everything they sell",
        body: "Featured items first, then the full list with prices. Tap any item to open it.",
      },
      {
        id: "cta",
        ...onBiz,
        providerTab: "Overview",
        anchor: "biz-page-cta",
        icon: chatbubbleEllipses,
        title: "Get in touch",
        body: "Two ways to reach them, always at the bottom of the page:",
        points: ["Message — starts a chat, which you'll find in Chats", "Call Now — rings them directly"],
        tip: ctx.signedIn ? undefined : "Sign in to message them or see their number.",
      },
    ],
  };

  const productPageChapter: TourChapter = {
    id: "product-page",
    title: "Product & service page",
    summary: "Photos, price, the seller, and sending an enquiry",
    minutes: 1,
    icon: bagHandle,
    color: "#F97316",
    colorTo: "#E11D48",
    steps: [
      {
        id: "gallery",
        ...onProduct,
        anchor: "product-gallery",
        scrollBlock: "start",
        icon: images,
        title: sample ? `Now one of their items: ${sample.productName}` : "Every photo, up top",
        body: "Swipe sideways through every photo the seller added, or tap a thumbnail to jump to one.",
      },
      {
        id: "topbar",
        ...onProduct,
        anchor: "product-topbar",
        icon: heart,
        title: "Save it, share it",
        body: "The heart saves it, share sends it to anyone, the flag reports a problem. This bar stays with you as you scroll.",
      },
      {
        id: "summary",
        ...onProduct,
        anchor: "product-summary",
        icon: pricetag,
        title: "Price and availability",
        body: "Everything you need to decide, before you ask:",
        points: [
          "The price — services show “Starts at”, or “Ask for a quote”",
          "Whether it's available right now",
          "Its category — tap it to see more like this",
        ],
      },
      {
        id: "seller",
        ...onProduct,
        anchor: "product-seller",
        icon: storefront,
        title: "Who sells it",
        body: "Tap the shop to open their full page — reviews, hours, and everything else they sell.",
      },
      {
        id: "about",
        ...onProduct,
        anchor: "product-about",
        icon: documentText,
        title: "The details",
        body: "The seller's own description — sizes, materials, what's included.",
        missing: "The seller hasn't written a description for this one. Ask them in a message — sellers usually reply quickly.",
      },
      {
        id: "more-from-seller",
        ...onProduct,
        anchor: "product-more-from-seller",
        scrollBlock: "nearest",
        icon: storefront,
        title: "More from this shop",
        body: "Their other items, without leaving the page.",
        missing: "This seller has only listed this one item so far.",
      },
      {
        id: "similar",
        ...onProduct,
        anchor: "product-similar",
        scrollBlock: "nearest",
        icon: sparkles,
        title: "Compare with other sellers",
        body: "Similar items from other businesses — or popular picks when nothing is quite like this one.",
        missing: "Similar items from other sellers appear here when there are some to compare.",
      },
      {
        id: "cta",
        ...onProduct,
        anchor: "product-cta",
        icon: chatbubbleEllipses,
        title: "Ask before you buy",
        body:
          "Send Enquiry opens a chat with the seller with this item attached — photo, name and price — so they know " +
          "exactly what you mean. On a service, the button reads Enquire About Service.",
        tip: ctx.signedIn ? "The heart beside it saves the item for later." : "Sign in to send an enquiry.",
      },
    ],
  };

  const savedChapter: TourChapter = {
    id: "saved",
    title: "Saved",
    summary: "Your shortlist of businesses, products and services",
    minutes: 1,
    icon: bookmark,
    color: "#E11D48",
    colorTo: "#F97316",
    steps: ctx.signedIn
      ? [
          {
            id: "nav",
            tab: "saved",
            anchor: "nav-saved",
            icon: bookmark,
            title: "Saved — your shortlist",
            body: "Tap the heart or bookmark on any business, product or service, and it lands here.",
          },
          {
            id: "filters",
            tab: "saved",
            anchor: "saved-filters",
            icon: funnel,
            title: "Businesses or products",
            body: "Show everything, just businesses, or just products and services. Search and the list/grid switch sit just above.",
          },
          {
            id: "list",
            tab: "saved",
            anchor: "saved-list",
            optional: true,
            scrollBlock: "nearest",
            icon: heart,
            title: "Back in one tap",
            missing: "Nothing saved yet. Tap the heart or bookmark on anything you like and it lands here.",
            body: "Open a saved item to see it again, or tap its bookmark to take it off your list.",
          },
        ]
      : [
          {
            id: "nav",
            tab: "home",
            anchor: "nav-saved",
            icon: bookmark,
            title: "Saved — your shortlist",
            body: "Tap the heart or bookmark on any business, product or service to keep it here.",
            tip: "Sign in to save. Your list is kept on your account, so it's there on any phone.",
          },
        ],
  };

  const chatsChapter: TourChapter = {
    id: "chats",
    title: "Chats",
    summary: "Messaging businesses and keeping track of replies",
    minutes: 1,
    icon: chatbubbles,
    color: "#7C3AED",
    colorTo: "#DB2777",
    steps: ctx.signedIn
      ? [
          {
            id: "nav",
            tab: "chats",
            anchor: "nav-chats",
            icon: chatbubbles,
            title: "Chats — talk to the business",
            body:
              "Message a business from its page, or tap Send Enquiry on a product or service. Every conversation " +
              "lands here, and the badge counts unread replies.",
          },
          {
            id: "filters",
            tab: "chats",
            anchor: "cust-chats-filters",
            icon: search,
            title: "Find a conversation",
            body: "Search by name, or switch to Unread to see who's replied.",
          },
          {
            id: "list",
            tab: "chats",
            anchor: "cust-chats-list",
            optional: true,
            scrollBlock: "nearest",
            icon: attach,
            title: "Inside a chat",
            missing: "No conversations yet. Message a business from its page and the chat appears here.",
            body: "Each row shows the last message and what it's about. Open one to reply:",
            points: [
              "Send photos or a PDF — a design, a measurement, a quote",
              "Call the business when their number is available",
              "Mute, report or block from the ⋯ menu",
            ],
          },
        ]
      : [
          {
            id: "nav",
            tab: "home",
            anchor: "nav-chats",
            icon: chatbubbleEllipses,
            title: "Chats — talk to the business",
            body: "Message any business from its page, or send an enquiry about a product or service. Replies arrive here.",
            tip: "Sign in with your mobile number to start chatting.",
          },
        ],
  };

  const profileChapter: TourChapter = {
    id: "profile",
    title: "Profile",
    summary: ctx.signedIn ? "Your account, business mode and settings" : "Signing in, appearance and help",
    minutes: 1,
    icon: person,
    color: "#10B981",
    colorTo: "#0EA5E9",
    steps: [
      {
        id: "account",
        tab: "profile",
        anchor: "profile-account",
        icon: ctx.signedIn ? person : logIn,
        scrollBlock: "start",
        ...(ctx.signedIn
          ? {
              title: "Your account",
              body: "Your name, number and area. Tap the pencil to change your name.",
            }
          : {
              title: "Sign in when you're ready",
              body:
                "Looking around is open to everyone. Sign in with your mobile number to save, message businesses and leave reviews.",
            }),
      },
      ...(ctx.signedIn
        ? [
            {
              id: "business",
              tab: "profile" as const,
              anchor: "profile-business",
              optional: true,
              icon: storefront,
              ...(ctx.hasBusiness
                ? {
                    missing: "Your business status appears here — with the Business Mode switch once your listing is set up.",
                    title: "Business Mode",
                    body: "Turn this on to manage your business; turn it off to come back and shop.",
                  }
                : {
                    missing: "Your business status appears here.",
                    title: "List your business",
                    body: "Run something from home or a shop? Put it on Tijarah, free.",
                  }),
            },
          ]
        : []),
      {
        id: "preferences",
        tab: "profile",
        anchor: "profile-preferences",
        icon: colorPalette,
        title: "Make it yours",
        body: ctx.signedIn
          ? "Choose which notifications you get, and pick light, dark or automatic appearance."
          : "Pick light, dark or automatic appearance. Notification settings need you to be signed in.",
      },
      {
        id: "support",
        tab: "profile",
        anchor: "profile-support",
        icon: helpBuoy,
        title: "Help when you need it",
        body: "Replay this tour, read the FAQ, contact the team or report a bug — all from here.",
      },
    ],
  };

  return [homeChapter, exploreChapter, businessPageChapter, productPageChapter, savedChapter, chatsChapter, profileChapter];
}

/** The closing card after the full customer tour. */
export function buildCustomerFinale(ctx: CustomerTourContext): TourChapter {
  return {
    id: "finale",
    title: "All set",
    summary: "",
    minutes: 0,
    icon: flag,
    color: "#F59E0B",
    colorTo: "#6366F1",
    steps: [
      {
        id: "finale",
        tab: "home",
        hero: true,
        icon: shieldCheckmark,
        title: `You're ready${ctx.firstName ? `, ${ctx.firstName}` : ""}`,
        body: "Three small habits that get the most out of Tijarah:",
        points: [
          "Set your location so the nearest results come first",
          "Look for the green tick — it means we've confirmed the owner",
          "Tap the heart to save, and message businesses right from their page",
        ],
        tip: "Replay any part of this tour from Profile → Take the app tour.",
        cta: "Start exploring",
      },
    ],
  };
}
