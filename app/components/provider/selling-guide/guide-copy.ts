/**
 * The words behind the Selling guide, kept apart from the screen so the advice
 * can change without touching layout.
 *
 * Every number is a fact about Tijarah itself (the wide cover, 10 gallery
 * photos, 5 per item, 3 starred), never an industry statistic we can't back.
 */

export const GUIDE_FACTS = [
  { value: "Wide", label: "Cover photo at the top of your page" },
  { value: "10", label: "Gallery photos" },
  { value: "5", label: "Photos per product or service" },
  { value: "3", label: "Starred items shown first" },
] as const;

export const COVER_TIPS = [
  "A wide, landscape photo: your shop front with the board showing, or your best work laid out",
  "Keep the important part in the middle. The edges are cut off on some phones",
  "Take it in daylight, with the shutter up and the lights on",
] as const;

export const LOGO_TIPS = [
  "Square, simple and easy to read when it's small",
  "Your logo, or a clear, straight photo of your shop board",
  "Not a photo of your visiting card or a screenshot",
] as const;

/** One slot each, in the order customers look for them. */
export const GALLERY_PLAN = [
  { slots: "1", title: "Your shop front", why: "So customers can find you on the street" },
  { slots: "2", title: "Inside, or your counter", why: "Shows it's clean, organised and real" },
  { slots: "3", title: "You and your team at work", why: "People buy from people they can see" },
  { slots: "4–7", title: "Your best work", why: "Four photos of what you're proudest of" },
  { slots: "8", title: "Before and after", why: "For services: the change is the proof" },
  { slots: "9", title: "Packing or delivery", why: "Shows how carefully the order reaches them" },
  { slots: "10", title: "Certificates or your rate card", why: "Anything that answers “can I trust them?”" },
] as const;

export const PHOTO_DOS = [
  "Shoot in daylight, near a door or window",
  "Use a plain background: a wall, a cloth or a table top",
  "Clean the counter and the lens before you shoot",
  "Hold the phone straight. Use the camera grid",
  "Show your real work, made by you",
  "Ask before you photograph a customer",
] as const;

export const PHOTO_DONTS = [
  "Dark, blurry or yellow tube-light photos",
  "Clutter, bills or wires in the background",
  "Phone numbers or prices written on the photo",
  "Collages of many things in one picture",
  "Photos copied from the internet or another shop",
  "Screenshots of WhatsApp or Instagram",
] as const;

export const PHONE_TRICKS = [
  { title: "Wipe the lens", body: "A fingerprint on the lens is the usual cause of hazy photos." },
  { title: "Don't zoom, step closer", body: "Zooming throws away detail. Move the phone instead." },
  { title: "Tap to focus", body: "Tap the item on the screen, then slide the brightness down a little if white parts glow." },
  { title: "Turn off the flash", body: "Flash makes everything flat and shiny. Move to the light instead." },
  { title: "Take ten, keep one", body: "Shoot a few from slightly different angles and keep the sharpest." },
  { title: "Same spot every time", body: "Shoot every product in one place, so your page looks neat and consistent." },
] as const;

export const ITEM_SHOTS = {
  Products: [
    "Front, on a plain background",
    "A close-up of the detail, fabric or finish",
    "In use, worn or in someone's hand",
    "Next to something everyday, so the size is clear",
    "The pack or box it comes in",
  ],
  Services: [
    "The finished result",
    "Before and after, from the same angle",
    "You at work",
    "Your tools, setup or workshop",
    "A happy moment, with permission",
  ],
} as const;

export const NAME_FIXES = [
  { before: "Suit", after: "Men's Linen Kurta, Custom Stitched" },
  { before: "AC", after: "Split AC Service & Gas Refill" },
  { before: "Mehendi", after: "Bridal Mehendi, Full Hands & Feet" },
  { before: "Box", after: "Kaju Katli, 500 g Box" },
] as const;

export type FormulaTone = "indigo" | "rose" | "violet" | "sky" | "emerald";

/** The item description formula, in the order a customer reads it. */
export const ITEM_FORMULA: { label: string; example: string; tone: FormulaTone }[] = [
  { label: "What it is", example: "Bridal mehendi for full hands and feet,", tone: "indigo" },
  { label: "What's included", example: "in Arabic or traditional designs, with natural henna and aftercare oil.", tone: "rose" },
  { label: "How long it takes", example: "Takes 3–4 hours, at your home.", tone: "violet" },
  { label: "When to book", example: "Book a week ahead for wedding dates.", tone: "emerald" },
];

export const SEARCH_WORDS = {
  item: "Bridal Mehendi",
  words: ["mehendi", "mehndi", "henna", "bridal", "wedding", "nikah"],
} as const;

/** The "About your business" formula. */
export const ABOUT_FORMULA: { label: string; example: string; tone: FormulaTone }[] = [
  { label: "Who you are", example: "Family-run sweet shop since 1998.", tone: "indigo" },
  { label: "What you offer", example: "Fresh mithai made every morning, plus party and thaal orders for up to 200 people.", tone: "rose" },
  { label: "Why you", example: "Pure ghee, no added colours.", tone: "violet" },
  { label: "Where you serve", example: "Home delivery across Pune.", tone: "sky" },
  { label: "How to order", example: "Order a day ahead for large orders.", tone: "emerald" },
];

export const ABOUT_BEFORE = "BEST SHOP IN CITY!!! ALL ITEMS AVAILABLE. CALL 98XXXXXXXX";

export const ABOUT_AVOID = [
  { title: "Phone numbers in the text", body: "Your page already has Call and Message buttons, and they always show your current number." },
  { title: "ALL CAPS and “!!!”", body: "It reads as shouting and looks less trustworthy, not more." },
  { title: "Claims you can't prove", body: "“No. 1 in India” makes customers doubt the rest. Say what's true: since when, how many orders, what's special." },
  { title: "Prices that change", body: "Put prices on your products and services, where they're easy to keep up to date." },
] as const;

/** Copy-ready "About your business" starters. Brackets are for the owner. */
export const TEMPLATES = [
  {
    kind: "Food & catering",
    text: "[Home kitchen / Family business] serving [city] since [year]. We make [your specialities] fresh every day, and take thaal and party orders for up to [number] people. [Pure ghee / No preservatives]. Delivery in [areas]. Please order [notice] ahead.",
  },
  {
    kind: "Clothing & tailoring",
    text: "[Name] has been stitching [rida / kurtas / sherwanis] in [city] for [years] years. Choose your fabric or bring your own; we take measurements at [our shop / your home]. Ready in [days] days, with free alterations within [days] days.",
  },
  {
    kind: "Beauty & mehendi",
    text: "[Bridal / party] mehendi and beauty services in [city], at your home or our studio. [Number]+ brides served since [year]. We use [natural henna / branded products] only. Book [notice] ahead for wedding dates.",
  },
  {
    kind: "Repairs & home services",
    text: "[AC / electrical / plumbing] repair and servicing in [areas]. [Number] years of experience, trained technicians and genuine parts. Same-day visits when booked before [time]. [Number]-day warranty on our work.",
  },
  {
    kind: "Shop & retail",
    text: "Your neighbourhood [type of shop] in [area], open since [year]. We stock [main products and brands]. [Wholesale rates / Bulk orders] available. Home delivery within [distance].",
  },
  {
    kind: "Classes & tutors",
    text: "[Subject] classes for [ages / grades] in [area] and online. [Batch size] students per batch, so everyone gets attention. [Number] years of teaching. Free trial class for new students.",
  },
] as const;

export const CHECKLIST = [
  "My cover photo is wide, bright and shows my shop or work",
  "My logo is clear and square",
  "I have at least 5 gallery photos, including my shop front",
  "Each product or service has 3 or more photos",
  "Every item name says exactly what it is",
  "Every item has a price, or a starting price",
  "Descriptions say what's included and how long it takes",
  "I've added search words people would type",
  "My 3 best sellers are starred",
  "My “About” says who I am, what I offer and where",
] as const;
