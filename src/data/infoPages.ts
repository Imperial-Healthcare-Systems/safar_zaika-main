import type { AccordionItem } from "@/components/ui/Accordion";

export interface InfoPage {
  title: string;
  intro: string;
  sections: { heading: string; body: string[] }[];
  /** policy drafts carry a visible placeholder notice */
  draft?: boolean;
  faqs?: AccordionItem[];
}

// Prototype copy only. Policies are drafts, not binding terms; contact
// details are deliberately left as "coming soon" rather than invented.
export const infoPages: Record<string, InfoPage> = {
  about: {
    title: "Food that travels with you.",
    intro: "Safar Zaika is a prototype for ordering fresh meals from local kitchens and having them handed over at your train seat.",
    sections: [
      {
        heading: "Why we're building this",
        body: [
          "Train journeys in India are long, and the food on board hasn't kept pace with what's cooking a few hundred metres from the platform. We want the thali from the kitchen beside the station to reach your berth: hot, sealed and on time.",
          "The idea is simple. Your PNR tells us the train, the date and the coach. From there we can show you which kitchens can cook and reach your platform before the train arrives.",
        ],
      },
      {
        heading: "How the prototype works",
        body: [
          "Everything you see here runs on demo data. Trains, kitchens, menus and reviews are placeholders standing in for real partners, and no actual orders are placed.",
          "What we're testing is the interface, the flows and the timing logic. Real partners, live railway data and payments come later, once formal arrangements are in place.",
        ],
      },
      {
        heading: "What we care about",
        body: [
          "Journey-aware: the train's live position, not the timetable, decides when cooking starts.",
          "Honest pricing: the price you see is the price you pay.",
          "A calm hand-over: packaging, platform position and coach door are planned before the train pulls in.",
        ],
      },
    ],
  },

  careers: {
    title: "Build the kitchen that moves.",
    intro: "A small team working on a hard problem: timing good food to a moving train. Roles will be listed here as they open.",
    sections: [
      {
        heading: "Open roles",
        body: ["There are no open roles listed right now. Positions across engineering, operations and partner success will appear here as the project grows.", "Application details are coming soon."],
      },
      {
        heading: "How we work",
        body: [
          "Most of the interesting problems sit between disciplines: a late train is a kitchen problem, a crowded platform is a packaging problem, a confusing screen is an operations problem. People who enjoy that overlap do well here.",
          "We ship small, measure on real journeys and keep the product honest about what it can and cannot do yet.",
        ],
      },
    ],
  },

  partner: {
    title: "Put your kitchen on the route.",
    intro: "Restaurants, cloud kitchens and station vendors near major halts can reach travellers on every train that stops there.",
    sections: [
      {
        heading: "Who we're looking for",
        body: [
          "Kitchens within a short ride of a station with regular long-distance halts, with consistent hygiene, reliable packaging and the ability to cook to a fixed time rather than on demand.",
          "Pure-veg and Jain kitchens are especially welcome; travellers ask for them constantly.",
        ],
      },
      {
        heading: "What partners get",
        body: [
          "Orders timed to confirmed arrivals, so nothing is cooked until a train is actually coming. A simple phone dashboard to accept orders and mark them packed. Delivery partners who handle the platform hand-over. A clear statement of every order.",
          "Commercial terms are not finalised in the prototype and will be shared during onboarding.",
        ],
      },
      {
        heading: "Onboarding",
        body: ["Onboarding details and the partner application are coming soon. Use the button below to register interest; nothing is submitted in the demo."],
      },
    ],
  },

  help: {
    title: "Answers before you ask.",
    intro: "Common questions about ordering, delivery, payments and changes. For anything else, the contact page will have support details at launch.",
    sections: [
      {
        heading: "Getting started",
        body: ["Enter your 10-digit PNR on the home page or the order page. We read the train, date and coach from it and show every upcoming station where a kitchen can deliver in time. No PNR yet? Order by train number instead."],
      },
    ],
    faqs: [
      { q: "How do I place an order?", a: "Enter your PNR, pick a delivery station, choose a kitchen and add dishes to the cart. Checkout asks for your coach and berth, then you pick how to pay." },
      { q: "Which stations can I get food at?", a: "Any upcoming halt on your route that is at least 45 minutes away and has a partner kitchen. Stations that are too close or have no kitchen are shown greyed out with the reason." },
      { q: "How do I track my order?", a: "Open Track Order and enter the order ID from your confirmation. You'll see the kitchen status, the delivery partner and the train's position on one screen." },
      { q: "What if I miss the hand-over?", a: "The delivery partner waits on the platform through the halt and will call you. If the hand-over fails for a reason on our side, the order is refunded under the refund policy." },
      { q: "Can I order for a group?", a: "Yes. For 10 or more people, use the bulk order form. A coordinator confirms the menu, packs meals individually and manages the platform hand-over." },
      { q: "Is my payment safe?", a: "In the prototype no payment is taken at all. The live product will use a standard payment gateway; card details are never stored by Safar Zaika." },
    ],
  },

  contact: {
    title: "Talk to a human.",
    intro: "Support channels are being set up. In the prototype, the form below is a demo and messages are not sent anywhere.",
    sections: [
      {
        heading: "Support",
        body: ["Phone and email support details are coming soon. In the live product, a support line will be available from the moment you order until the food reaches your seat."],
      },
      {
        heading: "Partnerships and press",
        body: ["Partnership and media enquiries will have a dedicated channel at launch. Until then, use the demo form to share what you have in mind."],
      },
    ],
  },

  cancellation: {
    title: "Cancellation policy",
    draft: true,
    intro: "This draft describes how cancellations are intended to work in the prototype. It is not a binding policy.",
    sections: [
      {
        heading: "Before the kitchen starts cooking",
        body: ["Orders can be cancelled from the tracking page at no charge until the kitchen begins preparation. In the demo that is typically until 45–60 minutes before the delivery station."],
      },
      {
        heading: "After preparation begins",
        body: ["Once food is being cooked, cancellation may not be possible or may be partially charged, depending on the kitchen. The tracking page shows the current status and whether cancellation is still available."],
      },
      {
        heading: "If we cancel",
        body: ["If a kitchen cannot fulfil an order or a train is diverted, we cancel on your behalf and any payment made is refunded in full."],
      },
    ],
  },

  refund: {
    title: "Refund policy",
    draft: true,
    intro: "This draft describes how refunds are intended to work in the prototype. It is not a binding policy.",
    sections: [
      {
        heading: "When refunds apply",
        body: ["A full refund applies when an order is cancelled before preparation, when a kitchen cannot fulfil it, or when the hand-over fails for a reason on our side. Partial refunds may apply when only part of an order is affected."],
      },
      {
        heading: "How refunds are processed",
        body: ["In the live product, refunds return to the original payment method and timelines depend on the bank or UPI provider. Cash-on-delivery orders that were never delivered have nothing to refund."],
      },
      {
        heading: "Quality concerns",
        body: ["If a meal arrives in poor condition, report it from the tracking page with a photo. Each case is reviewed with the kitchen and resolved with a refund or credit where appropriate."],
      },
    ],
  },

  privacy: {
    title: "Privacy policy",
    draft: true,
    intro: "This draft describes how the prototype handles data. It is not a binding policy.",
    sections: [
      {
        heading: "What the prototype stores",
        body: ["Your cart, selected journey, demo login and order history are stored in your own browser only. Nothing you enter here is sent to a server, and clearing site data removes it entirely."],
      },
      {
        heading: "What the live product will collect",
        body: ["To fulfil an order we will need the PNR or train details, the delivery station, a mobile number for the delivery partner and an optional email for receipts. Each is used only to deliver and support the order."],
      },
      {
        heading: "What we won't do",
        body: ["We will not sell personal data or use journey details for anything other than fulfilling and supporting orders. Partners receive only what they need to prepare and hand over a meal."],
      },
    ],
  },

  terms: {
    title: "Terms of use",
    draft: true,
    intro: "This draft describes the intended terms for the prototype. It is not a binding agreement.",
    sections: [
      {
        heading: "Using the prototype",
        body: ["This site is a demonstration. No real orders are placed, no payments are taken and no food is delivered. Trains, kitchens and reviews are placeholder data."],
      },
      {
        heading: "Orders and pricing",
        body: ["In the live product, the price shown at checkout is the full price, inclusive of delivery and taxes as itemised. Orders are accepted when a kitchen confirms them and may be declined if a train is too close to the station."],
      },
      {
        heading: "Accounts",
        body: ["Accounts are identified by mobile number. You are responsible for keeping access to that number; we never ask for a password."],
      },
      {
        heading: "Changes",
        body: ["These terms will be revised before launch and the live version will replace this draft."],
      },
    ],
  },
};

export const infoSlugs = Object.keys(infoPages);
