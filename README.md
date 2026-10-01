# Safar Zaika — customer frontend (v1 prototype)

Premium railway food-ordering experience for **Safar Zaika Food Private Limited**.
Frontend only: every flow works end to end on realistic mock data and a swappable service layer. No backend, no real payments, no real PNR lookups.

```
npm install
npm run dev        # http://localhost:3000 (Next picks the next free port if 3000 is busy)
# docs/viewports/index.html shows the whole site captured at phone, tablet and desktop widths
npm run build && npm start
npm run lint       # eslint (React Compiler rules on)
npm run typecheck  # tsc --noEmit, strict
```

Demo data to use while clicking around:

| What | Value |
| --- | --- |
| PNR (Mumbai Rajdhani) | `1234567890` (also `2345678901`, `3456789012`, `4567890123`; any other 10-digit PNR resolves to a demo journey) |
| PNR error states | `0000xxxxxx` → railway unavailable, `1111111111` → not found, fewer than 10 digits → invalid |
| OTP | `123456` |
| Order to track | `SZ102948` |
| Coupons | `SAFAR100`, `ZAIKA20`, `FREERIDE`, `BRC50` (Vadodara only), `GROUP15`, `CHAI` |

## Flow

Home (a welcome popup with the PNR form opens once per session) → PNR → fullscreen "journey discovery" sequence (network map tilts, flies to the route, draws it, stamps the ticket) → `/journey` (ticket card + night-mode route map + station picker + reminder consent) → `/restaurants?station=BRC` (kitchens open at your arrival time) → `/restaurant/[id]` (menu, dish time windows, add to cart) → cart drawer / `/cart` → `/checkout` (passenger, delivery, coupon, prepaid vs cash-on-delivery) → `/track-order/[id]?placed=1` (LED status, timeline, cancel while still cancellable).
Also: `/order` hub, `/stations` explorer (four regions), `/bulk-order`, `/offers`, `/how-it-works`, `/track-order`, `/login`, info pages (`/about`, `/help`, `/terms`, …), branded 404.

## Brand rules (from the client, 1 Oct 2026)

- Logo usage (`Logo` component): the transparent white horizontal lockup over dark heroes and the transparent colour lockup over light pages and the scrolled pill (navbar, mobile drawer); the transparent white stacked lockup centred in the footer; the cream-plate masters (`public/brand/safar-zaika-*.png`) in the welcome popup, login page and placing overlay. The lockup already carries the wordmark, so the company name is never repeated next to it. Never recreated.
- Nothing in the UI names a specific train or halt unless the visitor entered that journey: the hero board cycles meal windows until a PNR is loaded, then the real halts; the navbar journey chip only appears for the journey entered in this browser session (the journey store is session-scoped).
- No eyebrow / kicker text above headings anywhere. Every heading stands alone with at most one supporting line.
- No italic accent words, no gradient text. One solid copper or gold word at most.
- Headline voice: direct, product-like ("Hot food on your train, handed over at your seat.").
- Maps never draw a national boundary (border depiction is sensitive in India); they are station networks on a dark grid. The production map provider handles borders.

## Stack and why

| Library | Used for | Notes |
| --- | --- | --- |
| Next.js 16 (App Router, Turbopack), React 19, TypeScript strict | App | Server pages export metadata; interactivity lives in client components |
| Tailwind CSS v4 | Styling, design tokens | All tokens in `src/app/globals.css` (`@theme`), custom utilities (`container-x`, `signboard`, `led`, `led-panel`, `flap-cell`, `glass`, `gradient-*`, `map-grid`, `ticket-edge`); carousel CSS in `src/app/carousels.css` |
| GSAP 3 + ScrollTrigger + MotionPathPlugin + SplitText + `@gsap/react` | Every animation: hero line reveal (SplitText), section entrances (`Reveal` variants: rise, slide, zoom, flip, tilt, clip, letters; no two neighbouring home sections share one), pinned horizontal "How it works" with the active card centred, route-line trains, the PNR discovery camera, fly-to-cart, modals, page wipe, split-flap boards, scroll skew | Registered once in `src/lib/gsap.ts`; `useGSAP` handles cleanup |
| Lenis | Smooth scrolling | Single instance in `src/components/providers/SmoothScroll.tsx` (lerp 0.08, native touch) ticked by `gsap.ticker` with `lagSmoothing(0)` and `ScrollTrigger.update`; `useScrollSkew` reads Lenis velocity to skew carousels; disabled for reduced motion; modals call `lockScroll()`; carousels mark `data-lenis-prevent-horizontal` |
| Swiper 14 | Categories (endless crawl), dishes (autoplay), restaurants (endless crawl), offers (autoplay), menu "Popular" row | Every instance: Navigation arrows (`CarouselArrows`), Mousewheel with axis split, Keyboard, A11y; every home carousel moves on its own and pauses on hover; a drag guard (`useDragGuard`) means a drag never click-throughs |
| react-slick + slick-carousel | Testimonials only | Slick's `centerMode` + `centerPadding` + autoplay with custom dots is the classic quote-carousel pattern and needs no extra code; Swiper stays the engine everywhere else so two engines never compete on one page |
| Three.js + React Three Fiber | Hero only: articulated express train (loco + 3 coaches) on a dual-rail track with sleepers, ballast, platforms, lamps, shadows | Fully procedural (canvas-painted livery, no model files), dynamically imported, md+ screens with WebGL only; SVG `RouteLine` fallback otherwise |
| Zustand | `journey`, `cart`, `auth`, `order`, `ui` stores | Persisted stores use `skipHydration` and rehydrate in `Providers` to avoid hydration mismatches |
| lucide-react, clsx, tailwind-merge | Icons, class merging | |

Deliberately **not** installed: **styled-components** (Tailwind tokens cover every component), **Framer Motion** (GSAP is the single animation engine), **Lottie** (no Lottie assets; the brand animation is the SVG/3D train), **date-fns** (`Intl` in `src/lib/utils.ts`).

## Project structure

```
src/
  app/                  routes (server page.tsx + metadata; client views in components/), globals.css, carousels.css, opengraph-image
  components/
    layout/             Navbar (transparent → glass pill, scroll hairline, journey chip), MobileNav, Footer (departures board), PageHeader, PageTransition
    hero/               Hero (SplitText headline, LED halt board, PNR card), HeroScene + scene/ (Train, Track, geometry, textures)
    pnr/                PnrModule (PNR + train modes, mini network map), PnrLoading (fullscreen discovery overlay), OrderView
    journey/            NetworkMap (shared camera map), JourneyMap, TrainMarker (isometric train), JourneyCard (ticket), StationCard, JourneyStatus, JourneyView
    station/            StationExplorer (regions)
    restaurant/         RestaurantCard (availability pill), RestaurantsView (open-at-arrival filter)
    menu/               FoodCard (time-window chip, disabled states, fly-to-cart), QuantityControl, RestaurantMenuView
    cart/               CartPanel, CartDrawer, StickyCartBar, ReplaceCartModal, CartView
    checkout/           CheckoutView, PaymentMethods (prepaid vs pay-at-delivery), OrderSummary, CouponField, PlacingOverlay
    tracking/           TrackOrderEntry, TrackingView (cancel panel), TrackingHero (LED status), OrderTimeline, OrderDetails
    bulk-order/         BulkOrderForm (packages with veg / non-veg prices), BulkSidebar, BulkSuccess, constants
    offers/             OfferCard, OffersSection, OffersGrid
    testimonials/       Testimonials (react-slick)
    modals/             WelcomeModal (auto-opens once per session), LoginModal + LoginForm (OTP), OrderNowModal, SearchModal
    home/               StatsBand (split-flap figures), HowItWorks (pinned ticket stubs, photos on every step, centred track), Categories,
                        MealTimes (breakfast / lunch / dinner / chai panels, active one follows the delivery moment), FoodDiscovery,
                        RestaurantShowcase, StationCoverage, LiveJourney, FoodJourney (railway-track chain), BulkCta, TrustSection (LED strip), CtaBand
    animations/         SplitFlap (departure-board text), RouteLine, TrainIcon, Reveal, Magnetic, AnimatedNumber
    providers/          Providers (stores rehydrate, global modals, toaster), SmoothScroll (Lenis+GSAP)
    ui/                 Button, Input/Textarea/Select, Card, Badge/VegDot/Rating/Price, Modal (native <dialog>), Tabs/Chip,
                        Skeleton, Toaster, Accordion, SectionHeading, Logo, CarouselArrows (+ SwiperProgress)
  data/                 stations (regions), trains, journeys, menu (dish windows, MEALS + mealsForDish/dishesForMeal), restaurants (service windows), network (map points), offers, testimonials, orders, infoPages
  services/             mock*Service.ts + index.ts (the only import path components use)
  stores/               Zustand stores (+ useDeliveryMoment)
  hooks/                useReducedMotion, useMediaQuery, useHydrated, useWebGL, useScrollSkew (+ useHeadingParallax), useDragGuard
  lib/                  gsap.ts, lenis.ts, flyToCart.ts, svgPath.ts, utils.ts
public/
  brand/                safar-zaika-logo.png / .svg, safar-zaika-horizontal.png / .svg (masters, untouched), mark.svg (emblem for tiny decorative use)
  images/food|scenes|stations
```

## Design system

Derived from the supplied logo (`assests/SAFAR_ZAIKA_LOGO`):

| Token | Hex | Origin |
| --- | --- | --- |
| `cocoa-800` | `#3c1d0b` | wordmark ink |
| `copper-500` | `#b86e24` | ring / "Zaika" |
| `gold-500` | `#c47f30` | steam highlight |
| `cream-200` | `#f3e5cb` | logo field |
| `leaf-600` | `#4e6826` | leaf accent (veg, success) |
| `sign-500` | `#f5c542` | Indian Railways station-board yellow (signboard chips) |

Type: the logo's tagline is set in Bahnschrift, a DIN-style railway signage face, so the whole UI uses the **Barlow** superfamily: Barlow Semi Condensed 800 for display (`h1`–`h3`, `.font-display`), Barlow for UI (`font-sans`), Barlow Condensed for boards (`font-condensed`). Railway devices: `signboard` (yellow station board with black frame), `led` + `led-panel` (dot-matrix coach indicator), `flap-cell` + `SplitFlap` (split-flap departures board), `ticket-edge` notches, route lines and the train glyph.

## Signature interactions

- **PNR discovery** (`PnrLoading`): a tilted, slowly rotating network map with a radar sweep while the railway is "contacted"; on success the camera flies to the route, the route draws station by station with signboard labels, the train runs it, a ticket stamps "JOURNEY FOUND" and the app moves to `/journey`. Errors flash and hand the exact service message back to the form. Works from the hero, the welcome popup, the CTA band and `/order` because it is a top-layer `<dialog>`.
- **Journey map** (`JourneyMap` on `NetworkMap`): night-mode network, glowing copper route with marching dashes, signboard station labels, radar rings on the selected halt, an isometric train marker that rides to whatever you pick. In train mode the PNR card's mini map pans to the route as you type.
- **Departures-board footer**: the site map as a split-flap board with a live clock; rows flip from ON TIME to BOARDING on hover and are real links.
- **Split-flap boards** (`SplitFlap`): hero "next halt" readout, stats band figures, How-it-works stop readout, station coverage readout, journey-found stamp.
- **3D hero train** (`HeroScene`): a double-ended trainset (two lofted bullet-nose driving cars + two coaches) in the Safar Zaika livery with wraparound windscreens, lit window bands, clearcoat body under a procedural dusk environment map, sway and bob, headlight bloom and red tail lamps, on real rails with sleepers, ballast, canopied platforms, lamps and a colour-light signal; ~59 draw calls / ~38k triangles; a 2.5 s camera push-in on load.
- **Meal windows** (`MealTimes`, hero tiles): breakfast, lunch, dinner and chai panels; the active one follows the scheduled arrival (or the clock) and links to `/restaurants?meal=…`, which filters kitchens by the dishes they serve in that window.
- **Carousels**: arrows + wheel + keyboard everywhere, endless category and restaurant crawls, dish and offer autoplay, Slick testimonials, Lenis-velocity skew and heading parallax, drag guard.
- **Loading and transitions**: a cocoa curtain carries the stacked logo over a platform track that one full train crosses, used for the first-load intro (the page then soft-lands, scaling and fading in) and for every client-side route change. Sections themselves enter with their own restrained reveals, no banner wipes.

## Operating model reflected in the UI (from the client MOM)

| MOM point | Where it shows |
| --- | --- |
| ~450 stations in four regions (North / East / West / South) | `Station.region`, `/stations` region filter and counts, stats band ("450 stations planned"; copy says planned, never live coverage) |
| Vendors 2–3 km from the station, ~2 live per station | Restaurant copy and cards (`distanceKm`), stats band |
| Vendor Live / Unavailable by date, day, time slot | `Restaurant.live`, `pausedReason`, `serviceWindows`, `closedDays`; `getRestaurantAvailability` evaluated at the scheduled arrival (`useDeliveryMoment`); pills, "Open at arrival" filter, menu banner, eligible-station counts |
| Menu items with day/time availability | `Dish.availableWindows`, FoodCard chip + disabled Add outside the window |
| Prices already include the markup; margins never shown | Prices are selling prices in `data/menu.ts`; no vendor base price anywhere |
| Prepaid vs COD, vendor must see which | PaymentMethods grouped "Pay now" / "Pay at delivery", PREPAID / COD signboard on summary and tracking, `payment.status` |
| Order flow: received → confirmed → pushed to vendor → prepared → delivered | `orderStatusSteps` labels and the tracking LED |
| Cancellation with mandatory reason | Cancel panel on tracking (only while received/confirmed), `CANCEL_REASONS`, `cancelMockOrder` |
| Reminders for long routes, subject to consent | Reminder switch on `/journey` (persisted, consent copy) |
| Group / bulk orders: fixed packages, customisable, veg / non-veg | Bulk form packages with veg / non-veg prices, custom-menu option, minimum-10 note (tentative) |

## Connecting the real backend later

Components only import from `src/services/index.ts`. Replace each mock with an API-client implementation that returns the same `ServiceResult<T>` shapes from `src/types`:

| Mock function (file) | Replace with |
| --- | --- |
| `getPNRJourney(pnr)` (`mockRailwayService`) | `POST /journeys/pnr` → Safar Zaika backend → Railway service → provider. Never call a railway/RapidAPI endpoint from the browser. |
| `getTrain(q)`, `searchTrains(q)` | `/trains?q=` |
| `getJourneyByTrain({ trainNumber, date, boardingCode })` | `/journeys/by-train` |
| `getEligibleStations(journey)` / `computeEligibleStations` | `/journeys/:id/stations` (server decides lead time and which vendors are open at arrival) |
| `getRestaurants(stationCode, filters)` (filters include `meal`), `getRestaurant(id)`, `getMenu(id)`, `searchAll(q)` (`mockRestaurantService`) | catalog endpoints; `MEALS` / `mealsForDish` in `data/menu.ts` define the meal windows the backend should own |
| `getRestaurantAvailability(r, { hhmm, weekday })`, `isWithinWindows(hhmm, windows)` (`mockRestaurantService`) | vendor Live/Unavailable toggle + `serviceWindows`/`closedDays` from the vendor console; evaluated at the scheduled arrival (`useDeliveryMoment()` in `journeyStore`). Dish `availableWindows` (breakfast-only etc.) use the same helper |
| `validateCoupon`, `computeTotals` (`mockOrderService`) | pricing must be computed server-side; keep `computeTotals` only for optimistic display |
| `createMockOrder(input)`, `getMockOrderStatus(order)` | `/orders`, `/orders/:id` (+ websocket/polling for status) |
| `cancelMockOrder(orderId, reason)` | `POST /orders/:id/cancel` with a mandatory reason; only while status is `confirmed`/`accepted`. Orders carry `payment.status` (`paid` vs `pending-cod`) so the vendor slip shows PREPAID / COD |
| `submitBulkOrder(req)` | `/bulk-requests` |
| `sendMockOTP(phone)`, `verifyMockOTP(phone, code)` (`mockAuthService`) | auth endpoints; the demo code shown in the UI must be removed |

Payment: `CheckoutView` only collects a method; wire the gateway SDK behind "Confirm order". Map data: `NetworkMap` projects real lat/lng from `data/stations.ts` + `data/network.ts`; a Mapbox/Google layer can replace it using the same coordinates.

## Assets

- Logo kit: the supplied PNG/SVG masters are copied unmodified to `public/brand/safar-zaika-*.{png,svg}`; the PNGs are what render (the SVGs reference the Bahnschrift system font for the tagline, which non-Windows devices would substitute). `mark.svg` (emblem only) remains for tiny decorative uses. Icons (`src/app/icon.png`, `apple-icon.png`) come from the favicon mark.
- Photography: Unsplash (free license, no attribution required) in `public/images/*` at web sizes. Replace with brand photography before launch; all paths live in `src/data/*.ts`.
- 3D: fully procedural (canvas-painted livery and halo textures, no model files). OG image generated at build by `src/app/opengraph-image.tsx`.

## Performance notes

- `next/image` with explicit `sizes` everywhere; AVIF/WebP enabled.
- Scroll work is kept off the main thread: the navbar changes state only when it crosses the threshold, carousel crawls skip Swiper's per-tick relayout, split-flap boards share one 60 ms ticker and never spin off screen, route-line and map loops pause when out of view, and the hero's R3F canvas does not re-measure on scroll (`resize={{ scroll: false }}`).
- Three.js/R3F loaded via `dynamic(..., { ssr: false })` only on the home hero, md+ with WebGL; `dpr` capped at 1.5; instanced sleepers and wheels; geometries, materials and textures disposed on unmount; no per-frame allocations.
- GSAP plugins registered once; animations live inside `useGSAP` (auto cleanup) or are killed on unmount; ScrollTrigger refreshes after route changes.
- Lenis uses native scroll (no transform wrapper), so sticky/pinned elements and `next/link` scrolling behave normally.
- `SplitFlap`, `RouteLine`, `NetworkMap` and `AnimatedNumber` write to the DOM per frame instead of re-rendering React; the footer board is capped at 16 rows.
- Zustand selectors return stable references (`selectCartTotals` is memoised); persisted stores skip SSR hydration.

## Accessibility notes

- Native `<dialog>` for every modal, drawer, sheet and the PNR overlay (focus trap, Esc, top layer); native `<details>` accordions; labelled inputs with `aria-invalid`/`aria-describedby`; icon buttons have `aria-label`s; skip link; visible focus rings; one `h1` per page.
- `prefers-reduced-motion`: Lenis off, hero/reveals/transitions skipped, tickers and autoplay off, split-flap text settles instantly, the PNR overlay jumps to the result.
- Map stations are keyboard-focusable buttons with tooltips on focus; carousel arrows stay in the DOM for keyboard users even where they are visually hidden on touch; `SplitFlap` exposes its text via `role="img"` + `aria-label`.

## Known limitations

- All timetables, restaurants, reviews, offers and availability are demo data; station availability must not be read as operational coverage.
- "Live" status is simulated (new orders advance one step every ~12 s; the demo order stays at "Waiting on your platform").
- Payment UIs are visual only; OTP is shown on screen; the welcome popup opens once per browser session.
- Photography is stock; the train is represented by the brand glyph, SVG and the procedural 3D scene.
- `robots` is set to `noindex` for the prototype.
- In dev, React Three Fiber logs an upstream `THREE.Clock` deprecation warning once; it is harmless.
- Verified in Chrome via Playwright against a production build at 1440×900, 768×1024 and 390×844 (full PNR → tracking click-through on desktop and phone, every route screenshotted); Safari/Firefox were not exercised in this pass.
- Scroll pacing on the production build while wheel-scrolling the whole home page: no frame over 50 ms on either desktop or phone (p95 27.8 ms desktop, 7.0 ms phone).
