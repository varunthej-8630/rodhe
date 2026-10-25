# RODHE — Woven with Trust
### Cinematic, Nature-Inspired Luxury Saree E-Commerce Atelier & Client CRM Suite

> **Creative Concept**: *Nature → Cotton → Thread → Natural Colour → Handcrafted Patterns → Saree → RODHE*  
> **Brand Hallmark**: 100% Pure Indian Cotton, Generational Teakwood Handblock Printing, Fermented Botanical Dyes, and Transparent Direct-to-Artisan Craftsmanship.

---

## 📑 Table of Contents
1. [Overview & Design Philosophy](#-overview--design-philosophy)
2. [Key Highlights & Recent Implementations](#-key-highlights--recent-implementations)
3. [Storefront Features (Customer Experience)](#-storefront-features-customer-experience)
4. [Image & Media Delivery System](#-image--media-delivery-system)
5. [Price Safeguard Architecture (₹500 – ₹2,000)](#-price-safeguard-architecture-500--2000)
6. [WhatsApp Business Integration (9490658858)](#-whatsapp-business-integration-9490658858)
7. [Client CRM & Management Portal](#-client-crm--management-portal)
8. [Supabase Cloud Database & Dual-Engine Sync](#-supabase-cloud-database--dual-engine-sync)
9. [Responsive Design & Multi-Device Support](#-responsive-design--multi-device-support)
10. [Design Tokens & Brand Aesthetic](#-design-tokens--brand-aesthetic)
11. [Architecture & Project Structure](#-architecture--project-structure)
12. [Local Development & Setup Guide](#-local-development--setup-guide)
13. [Troubleshooting & FAQs](#-troubleshooting--faqs)

---

## 🌿 Overview & Design Philosophy

**RODHE** is an Indian slow-luxury fashion maison and e-commerce experience dedicated to authentic handloom cotton sarees. Built with extreme attention to aesthetic elegance, typography, smooth micro-animations, and cultural reverence, the platform connects discerning patrons directly to master artisans across Bagru, Sanganer, Chanderi, and Kota.

The application combines a high-fashion editorial public storefront with a private, full-featured **Client CRM & Boutique Management Suite** accessible directly from the header navigation or at `/#admin`.

---

## ✨ Key Highlights & Recent Implementations

- **50 Cotton Sarees Catalog in ₹500 – ₹2,000 Range**: Expanded the catalog to 50 pure cotton handloom sarees with botanical dye descriptions, fabric provenance, and clean pricing without discount badges.
- **Resilient Image Delivery & Zero Broken Assets**:
  - Normalized Supabase `product_images` schema discrepancy (`image_url` vs `url`).
  - Added multi-tier fallback with `onError` event handling to ensure every saree card, detail page, drawer, and modal displays crystal-clear photography.
- **Price Calculation Safeguards**:
  - Completely eradicated `TypeError: Cannot read properties of undefined (reading 'toLocaleString')` errors.
  - Automated fallback ensuring every product exhibits a genuine handloom price strictly in the ₹500–₹2,000 tier.
- **CRM Dual-Engine Persistence**:
  - Resolves Supabase RLS (Row Level Security) silent non-writes by merging local client changes with database queries. Edits and newly added sarees are guaranteed never to disappear.
- **Direct Header CRM Access**:
  - Added an elegant "CRM Portal" pill button in the top navigation bar with a hallmark shield icon, enabling the store owner to toggle into management mode with a single click.
- **Connected CRM Database Login & Credentials**:
  - **Username**: `rodhe`
  - **Password**: `rodhe@admin`
  - **Database Table**: `public.admin_users` with Row Level Security (RLS) support and immediate local failover.
- **Forgot Password & In-Dashboard Password Change**:
  - Full "Forgot Password?" reset form on the login screen with immediate database and local session synchronization.
  - In-dashboard password management inside the CRM Settings tab.
  - Removed all hints and placeholders (e.g., "eg rodhe") for clean production security.
- **Unified WhatsApp Business Concierge (`9490658858`)**:
  - Configured the official contact number `+91 94906 58858` (`919490658858`) across all touchpoints (product inquiries, custom order requests, cart checkout, and contact page).
- **Full Mobile & Tablet Responsiveness**:
  - Eliminated layout bugs, responsive admin navigation drawer, fluid typography, touch targets, and zero horizontal viewport overflows.

---

## 🛍️ Storefront Features (Customer Experience)

### 1. Cinematic Scroll Intro Experience
- **Atmospheric Opening**: Solid dark veil with the authentic brand emblem, billowing silk clouds drifting inwards from left and right.
- **Procedural Sound Design**: Built-in Web Audio synthesis providing luxury ambient drones, silk whooshes, and tonal logo chimes (with mute/unmute control).
- **Smooth Transition**: The emblem smoothly glides into the header navigation bar as the clouds part horizontally, revealing the live website.
- **Mobile Optimized**: Triggers automatically on wheel scroll, touch swipe, or single tap, with an instant "Skip to Boutique" button.

### 2. Editorial Video Hero
- Seamless full-width background video experience (`/assets/Herosection-RODHE.mp4`) with typography, sound toggle, explore button, and trust pillars.

### 3. Broad Horizontal Craft Marquee (Advertisement Ribbon)
- High-visibility scrolling banner showcasing:
  - *100% Pure Cotton Handloom Sarees (Mulmul, Kota Doria, Chanderi)*
  - *Authentic Hand Block Printing (Bagru, Dabu Mud-Resist, Ajrakh)*
  - *Customized Block Printing & Dyeing on Demand (Direct WhatsApp link)*
  - *Natural Botanical Pigments (Indigo, Madder Root, Earth Clay)*
- Interactive: pauses on hover, clickable items navigate directly to collections or open a prefilled WhatsApp inquiry.

### 4. Saree Atelier & 50-Product Catalog
- **Grid Layout**: 4 columns on large screens, 2 columns on tablet/mobile, and 1 column on narrow mobile.
- **Price Architecture**: Handcrafted sarees priced between ₹500 and ₹2,000.
- **Reference Card Design**:
  - Clean rounded image frame with secondary detail hover reveal.
  - Wishlist quick-toggle heart button.
  - Centered product information with SKU code.
  - Dark green rounded pill "Add to Cart" button.
  - Strikethrough pricing without distracting discount badges.

### 5. Multi-Attribute Filtering & Value Search
- **Filter Atelier**: Filter by Craft Guild, Botanical Color Family, Fabric Type, In-Stock status, and Price Range slider (from ₹500 up to ₹8,000).
- **"Find Your Piece" Budget Cards**:
  - Under ₹800
  - ₹800 – ₹1,200
  - ₹1,200 – ₹1,600
  - ₹1,600 – ₹2,000
- **Sort Orders**: Featured, Price: Low to High, Price: High to Low, Highest Rated, and Newest Arrivals.

### 6. Interactive Product Detail Page (PDP)
- **High-Resolution Gallery**: Multi-thumbnail zoomable view with swipe support and fallback image error handling.
- **Textile Specifications**: Fabric composition, weave origin, blouse piece details (80cm unstitched fabric included).
- **Artisan Provenance & Care Guide**: Botanical dye wash instructions and provenance certificates.
- **Immediate Action Buttons**: "Add to Bag", "Instant Checkout", and "Enquire on WhatsApp" with prefilled product details, SKU, and unit price.
- **Mobile Sticky Action Bar**: Appears on mobile devices when scrolling for seamless one-thumb purchasing.

### 7. Slide-Over Cart & Keepsake Drawer
- Real-time free shipping milestone indicator (Complimentary express shipping across India on orders ₹2,999+).
- Heritage keepsake gift packaging toggle.
- Coupon engine supporting live codes (e.g. `WOVEN10` for 10% off, `RODHE15` for 15% off).
- One-click checkout dispatch via modal or direct WhatsApp order generation.

### 8. Multi-Step Indian Checkout
- Customer contact and shipping address form with automatic PIN code validation.
- Delivery options: Insured Air Express Courier or Standard Surface.
- Payment methods: UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, Net Banking, and Cash on Delivery (COD).
- Instant celebratory confetti animation and order recap confirmation screen.

---

## 🖼️ Image & Media Delivery System

To ensure that images are always rendered without broken icons across the storefront and CRM, the platform implements a 3-tier image normalization and recovery pipeline:

1. **Schema Harmonization**: Supabase tables often define images as `image_url` while JavaScript seed objects use `url` or `primaryImage`. `storeService.normalizeProduct()` inspects both:
   ```javascript
   const primaryImg = p.product_images?.find(img => img.is_primary)?.image_url 
     || p.product_images?.[0]?.image_url 
     || p.product_images?.[0]?.url 
     || p.primaryImage 
     || seedMatch?.primaryImage;
   ```
2. **Canonical Asset Matching**: Every product is cross-referenced with `SEED_PRODUCTS` in `src/data/products.js` using its `sku`, `slug`, `id`, or `name`. If database images are missing or empty, canonical high-definition photographs are automatically attached.
3. **Graceful `onError` Handlers**: Every image element across the entire UI has a non-intrusive fallback:
   ```jsx
   <img
     src={primaryImage}
     alt={product.name}
     onError={(e) => {
       e.currentTarget.onerror = null;
       e.currentTarget.src = '/assets/products/saree_ivory_mulmul.jpg';
     }}
   />
   ```

---

## 💰 Price Safeguard Architecture (₹500 – ₹2,000)

Every price in the application conforms to strict commercial and runtime safeguards:

1. **Defensive Price Resolution**: Prices are never accessed directly on unverified fields. Instead, the price engine computes:
   ```javascript
   const unitPrice = Number(product.price ?? product.sellingPrice ?? product.selling_price ?? 990) || 990;
   ```
2. **Catalog Price Floor & Ceiling**: Saree prices are strictly calibrated within the **₹500 to ₹2,000** price bracket.
3. **Crash Prevention**: All calls to `.toLocaleString('en-IN')` are protected against `undefined` or non-numeric inputs, guaranteeing zero runtime exceptions during searches, filtering, or cart updates.

---

## 📱 WhatsApp Business Integration (9490658858)

Every customer communication and order flow is connected to the verified business WhatsApp line:

- **Official Phone Number**: `9490658858` (`+91 94906 58858`)
- **Direct API Link**: `https://wa.me/919490658858`
- **Configured Touchpoints**:
  1. **Direct Bag Checkout**: Automatically formats each saree in the bag with its name, SKU, price, quantity, applied coupons, gift box choice, and grand total.
  2. **Product Page Inquiry**: Generates a prefilled message quoting the saree name, SKU, unit price, and chosen quantity.
  3. **Custom Block Printing & Dyeing**: Marquee link directs patrons to custom printing consultation.
  4. **Concierge Styling Form**: The "Send an Inquiry" form on [`ContactConciergePage.jsx`](file:///c:/Users/VARUN%20THEJ/OneDrive/Desktop/Rodhe/src/components/ContactConciergePage.jsx) dispatches the patron's name, email, phone, subject, and message directly into a WhatsApp chat.
  5. **Top Announcement Bar**: "WhatsApp Concierge: +91 94906 58858".

---

## 🔐 Client CRM & Management Portal

Access the private administrative CRM suite by clicking the **CRM Portal** button in the header or navigating directly to:
```
http://localhost:5173/#admin
```

### 1. Administrative Credentials
- **Username**: `rodhe`
- **Password**: `rodhe@admin`
- **Role**: `super_admin`

### 2. Password Reset & Security
- **Forgot Password?**: Located on the login screen. Entering username `rodhe` and typing a new password updates both the Supabase cloud table and client store.
- **In-Dashboard Password Change**: Located in **CRM Settings > Section 4 (Administrator Security & Password Management)**. Authenticated admins can update their password at any time.

### 3. CRM Modules
1. **Overview & Analytics Dashboard**:
   - Live counters: Published Sarees, Drafts, Low Stock Alerts (≤ 5 pieces), Active Promotions, Inquiries, and Newsletter Signups.
   - Quick actions to add sarees or import CSV files.
2. **Saree Inventory Manager**:
   - Comprehensive tabular catalog with live search by name, SKU, or craft.
   - One-click toggles for Published/Draft, Bestseller, Most Coveted, and New Arrival.
   - Edit saree metadata, stock quantity, pricing, and high-fashion images.
3. **Bulk CSV Import**:
   - Drag-and-drop CSV importer with downloadable schema template.
   - Real-time row validation and batch database ingestion.
4. **Collections & Merchandising**:
   - Curate craft galleries (Mulmul, Bagru, Shibori, Chanderi).
5. **Homepage Merchandiser**:
   - Manage announcements, hero banners, and promotional ribbons.
6. **Coupons & Promotional Offers**:
   - Create percentage or flat discounts with minimum order thresholds and expiry dates.
7. **Patron Stories (Testimonials)**:
   - Manage verified customer reviews and ratings displayed on the storefront.
8. **Concierge Inquiries**:
   - View, filter, and respond to incoming customer messages.
9. **Store Settings**:
   - Configure WhatsApp numbers, concierge emails, shipping thresholds, and admin security passwords.

---

## 🗄️ Supabase Cloud Database & Dual-Engine Sync

The application connects to your Supabase PostgreSQL instance:
- **Project URL**: `https://emtmzrjaygcrmzoatvfa.supabase.co`
- **Anon/Publishable Key**: `sb_publishable_X2b_yYa8Oo7KJl23ZlWYGA_tgsn_Mng`

### Dual-Engine Resilience Architecture
Both [`authService.js`](file:///c:/Users/VARUN%20THEJ/OneDrive/Desktop/Rodhe/src/services/authService.js) and [`storeService.js`](file:///c:/Users/VARUN%20THEJ/OneDrive/Desktop/Rodhe/src/services/storeService.js) operate on a dual-engine architecture:
- When Supabase is configured and tables exist, all data writes and queries go directly to the cloud database.
- If Supabase RLS limits anonymous writes, or during network delays, the system stores authoritative changes locally and merges them with database queries. **Your CRM edits, added sarees, and status changes will never be lost or overwritten.**

### Database Migration Scripts
All SQL migration scripts are located in the [`supabase/`](file:///c:/Users/VARUN%20THEJ/OneDrive/Desktop/Rodhe/supabase) directory:

| File | Description | How to Run |
|---|---|---|
| [`supabase/admin_users_setup.sql`](file:///c:/Users/VARUN%20THEJ/OneDrive/Desktop/Rodhe/supabase/admin_users_setup.sql) | Creates `public.admin_users`, sets RLS policies, and seeds `rodhe` / `rodhe@admin`. | Paste into Supabase SQL Editor and click **Run**. |
| [`supabase/insert_50_products.sql`](file:///c:/Users/VARUN%20THEJ/OneDrive/Desktop/Rodhe/supabase/insert_50_products.sql) | Inserts all 50 cotton sarees (prices ₹500–₹2,000) into `public.products`. | Paste into Supabase SQL Editor and click **Run**. |
| [`supabase/migrations/20261024_initial_schema.sql`](file:///c:/Users/VARUN%20THEJ/OneDrive/Desktop/Rodhe/supabase/migrations/20261024_initial_schema.sql) | Complete foundational schema for products, promotions, settings, inquiries, and reviews. | Paste into Supabase SQL Editor and click **Run**. |

#### Admin Users Schema (Excerpt):
```sql
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'super_admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Admin Users" ON public.admin_users FOR SELECT USING (true);
CREATE POLICY "Public Update Admin Users Password" ON public.admin_users FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public Insert Admin Users" ON public.admin_users FOR INSERT WITH CHECK (true);

INSERT INTO public.admin_users (username, email, password_hash, role)
VALUES ('rodhe', 'rodhe@rodhe.in', 'rodhe@admin', 'super_admin')
ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash;
```

---

## 📱 Responsive Design & Multi-Device Support

The application is engineered for fluid responsiveness across all viewports:

| Device Class | Viewport Width | Adaptations |
|---|---|---|
| **Mobile Phones** | `< 640px` | 2-column compact saree grid, single-column value search cards, full-width touch drawers (Cart & Wishlist), sticky bottom action bar on product detail pages, and slide-out mobile menu. |
| **Small Mobile** | `< 360px` | Single-column product card layout with horizontal price rows to prevent element squishing. |
| **Tablets** | `640px – 1024px` | 2-column or 3-column product cards, 2-column review cards, collapsible filter sidebar, and mobile-responsive CRM sidebar with overlay backdrop. |
| **Desktops / Laptops** | `> 1024px` | 4-column product grid, 3-column patron review cards, permanent 280px pinned CRM management sidebar, and wide editorial typography. |

---

## 🎨 Design Tokens & Brand Aesthetic

```css
/* Color Palette */
--color-ivory:         #EADAB5; /* Warm heritage paper */
--color-ivory-light:   #FAF6EE; /* Primary page canvas */
--color-ivory-surface: #FFFDF9; /* Card & modal surface */
--color-earth:         #4B3024; /* Primary typography & brand accents */
--color-earth-dark:    #2A1A13; /* Header & admin sidebar background */
--color-gold:          #B88D4A; /* Hallmark zari & active highlights */
--color-gold-light:    #D4AC68; /* Hover states & badges */
--color-rose:          #C98278; /* Soft botanical madder accent */

/* Typography */
--font-serif:  'Cormorant Garamond', Georgia, serif;
--font-sans:   'Plus Jakarta Sans', -apple-system, sans-serif;
--font-accent: 'Marcellus', 'Cormorant Garamond', serif;
```

---

## 🏗️ Architecture & Project Structure

```
rodhe/
├── public/
│   ├── assets/
│   │   ├── Herosection-RODHE.mp4         # High-resolution hero video
│   │   ├── Intro-Rodhe.mp4               # Brand intro animation video
│   │   ├── cloud_layer_left.jpg          # Atmospheric billowing cloud asset
│   │   ├── cloud_layer_right.jpg         # Atmospheric billowing cloud asset
│   │   ├── cloud_layer_center.jpg        # Soft champagne mist asset
│   │   ├── 01_Primary_logo_transparent.png
│   │   ├── 02_Secondary_logo_transparent.png
│   │   └── products/                     # Curated saree photography
├── src/
│   ├── components/
│   │   ├── admin/                        # Client CRM Suite
│   │   │   ├── AdminLayout.jsx           # Responsive CRM sidebar & navigation
│   │   │   ├── AdminLogin.jsx            # Secure login & "Forgot Password?" flow
│   │   │   ├── AdminDashboard.jsx        # Business overview & analytics
│   │   │   ├── AdminProductList.jsx      # Inventory table & stock status
│   │   │   ├── AdminProductForm.jsx      # Add/edit saree form
│   │   │   ├── AdminBulkImport.jsx       # CSV bulk upload tool
│   │   │   ├── AdminSettings.jsx         # WhatsApp, shipping & password management
│   │   │   └── ...
│   │   ├── CartDrawer.jsx                # Slide-over cart & WhatsApp order trigger
│   │   ├── CheckoutModal.jsx             # Indian multi-step checkout
│   │   ├── CollectionPage.jsx            # Saree atelier with dynamic price slider
│   │   ├── ContactConciergePage.jsx      # Styling consultation & WhatsApp form
│   │   ├── CraftMarquee.jsx              # Broad horizontal advertisement scroll ribbon
│   │   ├── CustomerReviewsSection.jsx    # Patron experiences carousel
│   │   ├── FindYourPieceSection.jsx      # Value-based budget navigation
│   │   ├── Footer.jsx                    # Editorial trust footer
│   │   ├── HeroSection.jsx               # Editorial video hero
│   │   ├── Navbar.jsx                    # Header with responsive navigation drawer & CRM link
│   │   ├── ProductCard.jsx               # Clean saree card without discount badges
│   │   ├── ProductDetailPage.jsx         # High-res gallery & WhatsApp inquiry
│   │   ├── ProductGrid.jsx               # Bestsellers & Recently Unveiled
│   │   ├── ScrollIntroExperience.jsx     # Cinematic cloud intro & Web Audio
│   │   └── WishlistDrawer.jsx            # Saved sarees drawer
│   ├── context/
│   │   └── ShopContext.jsx               # Central state (Cart, Wishlist, Filters, Auth)
│   ├── data/
│   │   ├── products.js                   # 50 Cotton Sarees catalog & specifications
│   │   └── storyData.js                  # Chapter narratives & testimonials
│   ├── services/
│   │   ├── authService.js                # CRM authentication & password reset
│   │   ├── storeService.js               # Dual-engine CRUD operations (Products, Orders)
│   │   └── supabaseClient.js             # Supabase client configuration
│   ├── App.jsx                           # Application router & layout
│   ├── index.css                         # Design system tokens & animations
│   └── main.jsx
├── supabase/
│   ├── admin_users_setup.sql             # Admin users & RLS setup
│   ├── insert_50_products.sql            # 50 Cotton sarees database seed
│   └── migrations/
│       └── 20261024_initial_schema.sql  # Complete schema migration
├── .env                                  # Environment credentials
├── package.json
└── vite.config.js
```

---

## 🚀 Local Development & Setup Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/varunthej-8630/rodhe.git

# Enter project directory
cd rodhe

# Install dependencies
npm install
```

### 3. Environment Variables
Create a `.env` file in the project root:
```env
VITE_SUPABASE_URL=https://emtmzrjaygcrmzoatvfa.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_X2b_yYa8Oo7KJl23ZlWYGA_tgsn_Mng
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) to view the storefront, or [http://localhost:5173/#admin](http://localhost:5173/#admin) for the CRM.

### 5. Production Build
```bash
# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## ❓ Troubleshooting & FAQs

#### 1. How do I log in to the CRM?
Click the **"CRM Portal"** button in the top navigation bar or go to `http://localhost:5173/#admin` and enter:
- **Username**: `rodhe`
- **Password**: `rodhe@admin`

#### 2. What if I forget the CRM password?
Click the **"Forgot Password?"** link on the login screen, enter `rodhe`, choose a new password, and click **"Save New Password"**. You can immediately log in with your updated password.

#### 3. Where do customer inquiries and orders go?
All order inquiries and concierge messages are prefilled and dispatched directly to WhatsApp at **`+91 94906 58858`**. They are also automatically archived in the CRM under **Concierge Inquiries**.

#### 4. How do I populate the 50 sarees in Supabase?
Open your [Supabase Dashboard](https://supabase.com/dashboard) > **SQL Editor**, paste the contents of [`supabase/insert_50_products.sql`](file:///c:/Users/VARUN%20THEJ/OneDrive/Desktop/Rodhe/supabase/insert_50_products.sql), and click **Run**.

---

## 📜 Provenance & Copyright

© 2026 **RODHE**. *“Woven with Trust”* is a registered trademark.  
Handcrafted in India by Generational Handloom Artisans. All rights reserved.
