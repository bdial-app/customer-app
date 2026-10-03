import {
  home,
  layers,
  analytics,
  chatbubbles,
  storefront,
  swapHorizontal,
  radioButtonOn,
  statsChart,
  checkmarkDoneCircle,
  shieldCheckmark,
  bulb,
  rocket,
  pricetags,
  documentText,
  bagHandle,
  images,
  star,
  gift,
  grid,
  diamond,
  megaphone,
  calendar,
  speedometer,
  time,
  trophy,
  sparkles,
  flame,
  lockOpen,
  people,
  mailUnread,
  funnel,
  helpCircle,
  flag,
} from "ionicons/icons";

export type TourTab = "home" | "listings" | "analytics" | "chats";

export interface TourStep {
  id: string;
  /** `data-tour` value of the element to spotlight; none = a centred card. */
  anchor?: string;
  /** Tab the step lives on. */
  tab: TourTab;
  /** Business sub-tab to open (Business chapter). */
  subTab?: string;
  /** Analytics view to open. */
  analyticsView?: "overview" | "leads";
  title: string;
  body: string;
  points?: string[];
  tip?: string;
  icon?: string;
  /** Big centred card with a large icon — chapter openers and the finale. */
  hero?: boolean;
  /** Label for the main button (default "Next"). */
  cta?: string;
  /** A second, quieter button that ends the tour (e.g. "Maybe later"). */
  secondary?: string;
  /** Skip silently if the element isn't on screen (sections that only show sometimes). */
  optional?: boolean;
  scrollBlock?: ScrollLogicalPosition;
}

export interface TourChapter {
  id: TourTab | "finale";
  title: string;
  /** One line for the chapter picker. */
  summary: string;
  minutes: number;
  icon: string;
  color: string;
  colorTo: string;
  steps: TourStep[];
}

export interface TourContext {
  firstName: string;
  businessName: string;
  subscriptionsVisible: boolean;
  sponsorshipsEnabled: boolean;
}

/** Every chapter, in tour order, shaped to this owner's account and enabled features. */
export function buildBusinessTour(ctx: TourContext): TourChapter[] {
  const name = ctx.firstName || "there";
  const shop = ctx.businessName || "your business";

  const homeChapter: TourChapter = {
    id: "home",
    title: "Home",
    summary: "Your status, what to do next, and the switch to customer view",
    minutes: 1,
    icon: home,
    color: "#4F46E5",
    colorTo: "#7C3AED",
    steps: [
      {
        id: "welcome",
        tab: "home",
        hero: true,
        icon: storefront,
        title: `Welcome to your business, ${name}`,
        body:
          `${shop} is on Tijarah now. This short tour walks you through every screen you'll use — ` +
          "what each part does and the handful of things worth doing first.",
        points: ["Home — your status and to-do list", "Business — everything customers see", "Analytics — who's looking, and who to call back", "Chats — where enquiries land"],
        cta: "Show me around",
        secondary: "Maybe later",
      },
      {
        id: "header",
        tab: "home",
        anchor: "home-header",
        icon: storefront,
        title: "Your shop front, at a glance",
        body: "Your name, area and status, as the community sees them.",
        points: [
          "The badge shows whether you're live, in review or still need verifying",
          "The bell collects updates and notices from the Tijarah team",
          "Share sends your business card to any WhatsApp group in one tap",
        ],
        scrollBlock: "start",
      },
      {
        id: "open-toggle",
        tab: "home",
        anchor: "home-open-toggle",
        icon: radioButtonOn,
        title: "Open or closed — you decide",
        body:
          "Tap to tell customers whether you're taking work right now. Fully booked, travelling or closed for Eid? " +
          "Switch to Closed and people see it before they message you.",
      },
      {
        id: "view-switch",
        tab: "home",
        anchor: "home-view-switch",
        icon: swapHorizontal,
        title: "See Tijarah as your customers do",
        body:
          "Tap Customer to switch to the shopping side — search, browse, and check how your own listing looks to " +
          "someone finding you for the first time.",
        tip: "To come back, tap the Business button at the top of the customer home — or flip Business Mode in Profile.",
      },
      {
        id: "stats",
        tab: "home",
        anchor: "home-quick-stats",
        icon: statsChart,
        title: "Your listing in four numbers",
        body:
          "Photos, rating, reviews and catalogue size. Each one answers a question a customer has before they message — " +
          "what do you make, is it any good, what does it cost.",
      },
      {
        id: "verify",
        tab: "home",
        anchor: "home-get-verified",
        optional: true,
        icon: shieldCheckmark,
        title: "Get the green tick",
        body:
          "Upload one ID document and our team confirms you're from the community. Verified businesses carry a green " +
          "tick on search results, your profile and every product.",
        tip: "It's the single biggest reason a stranger chooses you over a name they don't know.",
      },
      {
        id: "completeness",
        tab: "home",
        anchor: "home-profile-completeness",
        optional: true,
        icon: checkmarkDoneCircle,
        title: "Finish your profile",
        body: "Everything still missing is listed here, each with a shortcut straight to where you fix it.",
      },
      {
        id: "growth-tips",
        tab: "home",
        anchor: "home-growth-tips",
        optional: true,
        icon: bulb,
        title: "Your to-do list for growth",
        body: "Tips update as you go, most important first. Tap one and it takes you to exactly the right screen.",
      },
      {
        id: "grow",
        tab: "home",
        anchor: "home-grow",
        icon: rocket,
        title: "Ways to bring in more customers",
        body: "Shortcuts to the tools that bring people to your door.",
        points: [
          "Create an offer — it shows in Deals & Offers on Explore, free",
          ...(ctx.sponsorshipsEnabled ? ["Boost — sit at the top of search when you want to reach further"] : []),
          "Leads — see who's been looking at you and call them back",
        ],
      },
      {
        id: "catalogue",
        tab: "home",
        anchor: "home-catalogue",
        scrollBlock: "nearest",
        optional: true,
        icon: bagHandle,
        title: "What you sell, at a glance",
        body:
          "A preview of your catalogue. Every product and service you add is found in search on its own, and shows on " +
          "the Products and Services pages in Explore.",
      },
    ],
  };

  const businessSteps: TourStep[] = [
    {
      id: "nav",
      tab: "listings",
      subTab: "details",
      anchor: "nav-listings",
      icon: layers,
      title: "The Business tab is your listing",
      body: "Everything a customer sees about you is edited here. Save a change and your listing updates right away.",
    },
    {
      id: "tabbar",
      tab: "listings",
      subTab: "details",
      anchor: "biz-tabbar",
      icon: grid,
      title: "One bar, every part of your listing",
      body: "Each icon opens one section. Swipe the bar sideways to see them all — we'll go through each now.",
      scrollBlock: "start",
    },
    {
      id: "details",
      tab: "listings",
      subTab: "details",
      anchor: "biz-tab-details",
      icon: documentText,
      title: "Details — the basics",
      body: "Your name, description, WhatsApp number, map pin and opening hours.",
      tip: "Drop an exact pin on the map. Customers then see a real distance — “1.2 km away” — instead of just your city.",
    },
    {
      id: "products",
      tab: "listings",
      subTab: "products",
      anchor: "biz-tab-products",
      icon: bagHandle,
      title: "Catalogue — what you sell",
      body: "Add products and services with photos, a price and a short description.",
      points: [
        "Every item can be found in search on its own",
        "Mark up to 3 as Hero to feature them first",
        "Hide an item for a while without deleting it",
      ],
      tip: "Items with a price get more serious enquiries — “Ask for price” makes people hesitate.",
    },
    {
      id: "photos",
      tab: "listings",
      subTab: "photos",
      anchor: "biz-tab-photos",
      icon: images,
      title: "Photos — your shop window",
      body: "Your shop, your work, your team. Photos are the first thing anyone looks at, long before they read.",
      tip: "Bright, close-up shots of real work beat logos and posters.",
    },
    {
      id: "reviews",
      tab: "listings",
      subTab: "reviews",
      anchor: "biz-tab-reviews",
      icon: star,
      title: "Reviews — what people say",
      body: "Every review from the community, with your rating breakdown.",
      tip: "After a good order, ask the customer to leave a review. Reviews from people they know are what convince the next one.",
    },
    {
      id: "deals",
      tab: "listings",
      subTab: "deals",
      anchor: "biz-tab-deals",
      icon: gift,
      title: "Offers — a reason to try you",
      body:
        "Create a discount with an end date. Live offers appear in Deals & Offers on Explore and on your profile — " +
        "perfect before a festival or in a quiet week.",
    },
    {
      id: "categories",
      tab: "listings",
      subTab: "categories",
      anchor: "biz-tab-categories",
      icon: pricetags,
      title: "Categories — where you're found",
      body:
        "Pick every category that genuinely describes your work. People browsing those categories, or searching " +
        "for them, will find you.",
    },
  ];
  if (ctx.subscriptionsVisible) {
    businessSteps.push({
      id: "plans",
      tab: "listings",
      subTab: "plans",
      anchor: "biz-tab-plans",
      icon: diamond,
      title: "Plans — when you want more",
      body: "The free listing covers the basics. Plans add more lead unlocks, more offer slots and boosts. Always your choice.",
    });
  }
  if (ctx.sponsorshipsEnabled) {
    businessSteps.push({
      id: "boost",
      tab: "listings",
      subTab: "boost",
      anchor: "biz-tab-boost",
      icon: megaphone,
      title: "Boost — reach further",
      body:
        "Appear at the top of search and in Featured for as long as you choose. Every boost reports its views and " +
        "taps, so you can see what it brought in.",
    });
  }

  const businessChapter: TourChapter = {
    id: "listings",
    title: "Business",
    summary: "Details, catalogue, photos, reviews, offers and categories",
    minutes: 1,
    icon: layers,
    color: "#0891B2",
    colorTo: "#4F46E5",
    steps: businessSteps,
  };

  const analyticsChapter: TourChapter = {
    id: "analytics",
    title: "Analytics",
    summary: "Who's looking, when, at what — and your leads",
    minutes: 1,
    icon: analytics,
    color: "#059669",
    colorTo: "#0D9488",
    steps: [
      {
        id: "nav",
        tab: "analytics",
        analyticsView: "overview",
        anchor: "nav-analytics",
        icon: analytics,
        title: "Analytics — how people find you",
        body: "Real numbers on who looked at your listing, what they searched for, and who's worth a call back.",
      },
      {
        id: "period",
        tab: "analytics",
        analyticsView: "overview",
        anchor: "analytics-period",
        icon: calendar,
        title: "Choose your time window",
        body: "Compare the last 7, 30 or 90 days. Every number on this screen follows your choice.",
      },
      {
        id: "kpis",
        tab: "analytics",
        analyticsView: "overview",
        anchor: "analytics-kpis",
        icon: speedometer,
        title: "Six numbers that matter",
        body: "The small % on each card compares with the period before.",
        points: [
          "Views — people who opened your profile",
          "Searches — times you appeared in someone's results",
          "Enquiries — chats started with you",
          "Calls & Directions — people ready to order or visit",
          "Saves — customers keeping you for later",
        ],
      },
      {
        id: "peak",
        tab: "analytics",
        analyticsView: "overview",
        anchor: "analytics-peak-hours",
        optional: true,
        icon: time,
        title: "When people look for you",
        body: "Your busiest hours. Be quick to reply then, and post offers just before the rush.",
      },
      {
        id: "top-products",
        tab: "analytics",
        analyticsView: "overview",
        anchor: "analytics-top-products",
        optional: true,
        icon: trophy,
        title: "Your most-viewed items",
        body: "What's catching attention. Keep these well photographed and priced — they're doing your selling.",
      },
      {
        id: "insights",
        tab: "analytics",
        analyticsView: "overview",
        anchor: "analytics-insights",
        optional: true,
        icon: sparkles,
        title: "Insights in plain words",
        body: "Growth, conversion, hot leads and rating — summed up so you don't have to read charts.",
      },
      {
        id: "leads-switch",
        tab: "analytics",
        analyticsView: "leads",
        anchor: "analytics-view-switch",
        icon: people,
        title: "Leads — people showing real interest",
        body:
          "A lead is someone who spent real time on your listing — opened your products, searched for what you do, " +
          "came back for another look. We score every visit so you know who to call first.",
      },
      {
        id: "tiers",
        tab: "analytics",
        analyticsView: "leads",
        anchor: "leads-tiers",
        icon: flame,
        title: "Hot, warm, soft, cold",
        body: "Filter by how interested someone was.",
        points: [
          "Hot — looked closely; likely ready to order",
          "Warm — interested; a friendly message goes far",
          "Soft & Cold — browsed briefly",
        ],
      },
      {
        id: "unlock",
        tab: "analytics",
        analyticsView: "leads",
        anchor: "leads-quota",
        optional: true,
        icon: lockOpen,
        title: "Unlocking a lead",
        body:
          "Tap Unlock on a lead to see their name and how to reach them. What you have available this month is shown here.",
      },
      {
        id: "list",
        tab: "analytics",
        analyticsView: "leads",
        anchor: "leads-list",
        scrollBlock: "nearest",
        optional: true,
        icon: funnel,
        title: "Every lead, with context",
        body:
          "Each card shows the score, what they searched for, which products they viewed and how long they stayed. " +
          "Open one for the full visit timeline.",
        tip: "Mention the product they looked at when you reach out — it shows you're paying attention.",
      },
    ],
  };

  const chatsChapter: TourChapter = {
    id: "chats",
    title: "Chats",
    summary: "Where enquiries arrive and how to stay on top of them",
    minutes: 1,
    icon: chatbubbles,
    color: "#DB2777",
    colorTo: "#9333EA",
    steps: [
      {
        id: "nav",
        tab: "chats",
        anchor: "nav-chats",
        icon: chatbubbles,
        title: "Chats — where enquiries arrive",
        body:
          "When someone taps Send Enquiry on your listing or a product, the conversation starts here — with the " +
          "product attached, so you know exactly what they're asking about.",
      },
      {
        id: "stats",
        tab: "chats",
        anchor: "chats-stats",
        icon: mailUnread,
        title: "Your inbox at a glance",
        body: "Unread messages and new enquiries, counted for you.",
        tip: "A quick first reply often wins the order — even “Got it, I'll send prices in an hour” helps.",
      },
      {
        id: "filters",
        tab: "chats",
        anchor: "chats-filters",
        icon: funnel,
        title: "Find the ones that matter",
        body: "Show only Unread or Enquiries, or search for a customer by name.",
      },
      {
        id: "list",
        tab: "chats",
        anchor: "chats-list",
        scrollBlock: "nearest",
        optional: true,
        icon: chatbubbles,
        title: "Every conversation",
        body:
          "Tap one to reply. The badge tells you what it's about — a quote request, a booking or a general chat.",
      },
    ],
  };

  return [homeChapter, businessChapter, analyticsChapter, chatsChapter];
}

/** The closing card after the full tour. */
export function buildFinale(ctx: TourContext): TourChapter {
  return {
    id: "finale",
    title: "All set",
    summary: "",
    minutes: 0,
    icon: flag,
    color: "#4F46E5",
    colorTo: "#DB2777",
    steps: [
      {
        id: "finale",
        tab: "home",
        hero: true,
        icon: checkmarkDoneCircle,
        title: `You're all set, ${ctx.firstName || "and ready"}`,
        body: "Three things that make the biggest difference in your first week:",
        points: [
          "Add at least 5 photos, and your products with prices",
          "Drop an exact pin on the map",
          "Share your profile in your community groups",
        ],
        tip: "Replay any part of this tour from the ? button at the top of your business home.",
        cta: "Start growing",
      },
    ],
  };
}

export const HELP_ICON = helpCircle;
