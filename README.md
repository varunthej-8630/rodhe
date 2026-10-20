# RODHE — Woven with Trust
### Cinematic, Nature-Inspired Luxury Saree E-Commerce Experience

> **Creative Concept**: *Nature → Cotton → Thread → Natural Colour → Handcrafted Patterns → Saree → RODHE*

A contemporary luxury fashion editorial and fully functional e-commerce atelier for **RODHE**, an Indian artisanal saree brand celebrating slow luxury, botanical dyes, and generational craft.

---

## ✨ Signature Features

- **Cinematic Logo Reveal Opening Experience**: Warm ivory cinematic reveal powered by authentic brand video (`Intro-Rodhe.mp4`), featuring skip-to-store, audio controls, and session persistence.
- **Editorial Video Hero**: Seamless full-width background video experience (`Herosection-RODHE.mp4`) with typography, playback controls, and discreet scroll cue.
- **From Nature to Saree Storytelling**: 4-chapter interactive journey detailing:
  - *Chapter 01 — Born from Nature* (organic rain-fed cotton)
  - *Chapter 02 — Colours of the Earth* (fermented natural indigo & madder root)
  - *Chapter 03 — The Art of Craft* (handcarved teakwood stamps & Dabu mud resist)
  - *Chapter 04 — A Saree Comes to Life* (6.5m lightweight drape & packaging reverence)
- **Comprehensive Saree Catalog**:
  - Pure Mulmul Cotton, Bagru Mud-Resist, Shibori Tie-Dye, Chanderi Cotton Silk, and Wild Tussar Silk
  - Secondary hover detail reveals, Quick View modal, and Wishlist toggling
  - Multi-attribute filtering (Craft, Botanical Palette, Fabric Weave, Price range) and sorting
- **Interactive Product Detail View (PDP)**:
  - Multi-angle zoom gallery, blouse piece specifications (80cm unstitched fabric included)
  - Wash & care instructions, artisan provenance, and sticky Add to Bag bar on mobile
- **Slide-Over Cart Drawer**:
  - Live progress meter for complimentary express shipping (unlocked on orders ₹2,999+)
  - Keepsake gift box packaging option
  - Promo code coupon system (e.g., `WOVEN10` for 10% off)
- **Multi-Step Indian Checkout**:
  - Customer contact details & delivery address with intelligent PIN code auto-lookup
  - Payment gateway selection (UPI, Credit/Debit Cards, Net Banking, Cash on Delivery)
  - Order confirmation screen with celebratory confetti animation
- **Live Search Modal**: Keyboard accessible (`Cmd/Ctrl + K`) with real-time filtering and trending tags.
- **Patron Portal**: Sign In / Registration modal with guest checkout option.
- **Customer Concierge & Styling**: Inquiry form, styling consultation, customer support, and FAQs.

---

## 🎨 Brand Design System

- **Natural Ivory**: `#EADAB5` / `#FAF6EE`
- **Earth Brown**: `#4B3024` / `#2A1A13`
- **Muted Gold**: `#B88D4A` / `#D4AC68`
- **Soft Rose**: `#C98278` / `#E8B5AE`
- **Display Typography**: *Cormorant Garamond* & *Marcellus*
- **Body Typography**: *Plus Jakarta Sans*

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+ (tested on Node v24)
- npm v9+

### Installation & Local Development

```bash
# Clone the repository
git clone https://github.com/varunthej-8630/rodhe.git

# Navigate to project directory
cd rodhe

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173/` in your browser.

### Production Build

```bash
npm run build
npm run preview
```

---

## 📁 Project Structure

```
rodhe/
├── public/
│   ├── assets/
│   │   ├── Intro-Rodhe.mp4               # Brand reveal video
│   │   ├── Herosection-RODHE.mp4         # Hero background video
│   │   ├── RODHE Woven Luxury Wordmark.png
│   │   ├── 01_Primary_logo_transparent.png
│   │   ├── products/                     # High-fashion saree product photography
│   │   └── ...                           # Authentic craft & packaging archives
├── src/
│   ├── components/                       # Modular UI components
│   │   ├── IntroOverlay.jsx
│   │   ├── Navbar.jsx
│   │   ├── HeroSection.jsx
│   │   ├── NatureStorySection.jsx
│   │   ├── ProductCard.jsx
│   │   ├── ProductGrid.jsx
│   │   ├── CollectionPage.jsx
│   │   ├── ProductDetailPage.jsx
│   │   ├── CartDrawer.jsx
│   │   ├── WishlistDrawer.jsx
│   │   ├── SearchModal.jsx
│   │   ├── CheckoutModal.jsx
│   │   └── ...
│   ├── context/
│   │   └── ShopContext.jsx               # Cart, Wishlist, & Filter state management
│   ├── data/
│   │   ├── products.js                   # Saree catalog & textile specifications
│   │   └── storyData.js                  # 4-chapter narrative & patron stories
│   ├── App.jsx                           # Application router & layout
│   ├── index.css                         # Design system tokens & animations
│   └── main.jsx
├── package.json
└── vite.config.js
```

---

## 📜 License & Provenance

© 2026 RODHE. “Woven with Trust” is a registered trademark. Handcrafted in India.
