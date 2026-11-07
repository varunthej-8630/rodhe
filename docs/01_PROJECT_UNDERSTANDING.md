# 01. PROJECT UNDERSTANDING — RODHE
## Business, Brand & Technical Landscape Analysis

---

## 1. Executive Brand & Business Understanding

**RODHE** (*"Woven with Trust"*) is conceived as an Indian slow-luxury cotton saree brand rooted in traditional artisanal craftsmanship, botanical dyes, unhurried handweaving, and a direct-to-patron digital commerce model.

### 1.1 The Brand Philosophy Chain
$$\text{Nature} \longrightarrow \text{Cotton} \longrightarrow \text{Thread} \longrightarrow \text{Natural Colour} \longrightarrow \text{Handcrafted Patterns} \longrightarrow \text{Saree} \longrightarrow \text{RODHE}$$

- **Artisanal Provenance**: Generational artisan guilds across Bagru, Sanganer, Chanderi, and Kota.
- **Craft Hallmarks**: Teakwood block carving, Dabu mud-resist dyeing, natural indigo leaf fermentation, Madder root crimson, and featherweight handloom mulmuls.
- **Price Architecture Rule**: Documented price positioning is strictly **₹500 to ₹2,000** per saree (an accessible direct-to-artisan model eliminating middlemen).
- **Dual Environment Requirement**:
  1. **Customer-Facing Luxury Storefront**: Editorial, high-touch, tactile experience with procedural audio, fluid transitions, and cultural reverence.
  2. **Boutique CRM & Administrative Portal**: Private administrative suite for inventory tracking, order fulfillment, pricing control, and client communications.

---

## 2. Technical System Landscape

### 2.1 Actual Installed Technology Stack

| Layer | Declared Dependency | Locked Version | Actual Purpose & Status |
|---|---|---|---|
| **Runtime & Core** | `react` (^19.3.1) | **19.3.1** | Component rendering & concurrent mode. |
| **DOM Renderer** | `react-dom` (^19.3.1) | **19.3.1** | Browser mounting & portal rendering. |
| **Bundler / Server** | `vite` (^8.3.4) | **8.3.4** | Modern ESM development server & Rollup production bundler. |
| **Linter** | `oxlint` (^1.88.0) | **1.89.0** | High-performance Rust-based static linting. |
| **Cloud Database SDK** | `@supabase/supabase-js` (^2.118.0) | **2.118.0** | Supabase REST/PostgREST & Auth client. |
| **SSR Adapter** | `@supabase/ssr` (^0.12.7) | **0.12.7** | Isomorphic cookie/session adapter. |
| **Animation Choreography** | `gsap` (^3.15.0) | **3.15.0** | Scroll intro animation & timeline choreography. |
| **Procedural Sound** | Native Web Audio API | **Native** | Oscillator and noise buffer sound synthesizer. |
| **Micro-Delight** | `canvas-confetti` (^1.9.4) | **1.9.4** | Post-order particle confetti effect. |
| **Iconography** | `lucide-react` (^1.59.0) | **1.59.0** | Featherweight vector icons. |
| **CSS Architecture** | Custom CSS & CSS Variables | **Native** | Global design tokens defined in `src/index.css`. |

### 2.2 Application Entry & Routing Lifecycle
1. **Entry Point**: [`src/main.jsx`](file:///c:/Users/VARUN%20THEJ/OneDrive/Desktop/Rodhe/src/main.jsx) mounts `<App />` into `#root`.
2. **State Context**: Wrapped by `<ShopProvider>` ([`src/context/ShopContext.jsx`](file:///c:/Users/VARUN%20THEJ/OneDrive/Desktop/Rodhe/src/context/ShopContext.jsx)).
3. **URL & Hash Router**: [`src/App.jsx`](file:///c:/Users/VARUN%20THEJ/OneDrive/Desktop/Rodhe/src/App.jsx) listens to `window.location.hash` and `pathname` via a `hashchange` listener:
   - `/#admin` $\rightarrow$ Mounts `<AdminPortal />`
   - `/#collections` / `/#shop` $\rightarrow$ Mounts `<CollectionPage />`
   - `/#product/:id` $\rightarrow$ Mounts `<ProductDetailPage />`
   - `/#story` $\rightarrow$ Mounts `<BrandStoryPage />`
   - `/#contact` $\rightarrow$ Mounts `<ContactConciergePage />`
   - Default (`/`) $\rightarrow$ Renders Editorial Homepage sections sequentially.

---

## 3. Data & State Flow Architecture

```
                    ┌───────────────────────────────┐
                    │  src/context/ShopContext.jsx   │
                    │   (Central Reactive State)    │
                    └───────┬───────────────┬───────┘
                            │               │
        ┌───────────────────┴──┐         ┌──┴───────────────────┐
        ▼                      ▼         ▼                      ▼
  [Storefront Views]    [Drawers/Modals] [Admin Suite]     [Local Storage]
  • Hero & Marquee      • CartDrawer     • ProductList     • 'rodhe_cart'
  • ProductGrid         • WishlistDrawer • ProductForm     • 'rodhe_wishlist'
  • CollectionPage      • SearchModal    • Settings        • 'rodhe_db_*'
  • ProductDetail       • CheckoutModal  • Enquiries       • 'rodhe_intro_played'
                            ▲
                            │
              ┌─────────────┴─────────────┐
              │ storeService.js / authSvc │
              └─────────────┬─────────────┘
                            │
               ┌────────────┴────────────┐
               ▼                         ▼
         Authoritative              Supabase Cloud
         LocalStorage               PostgreSQL DB
```

### 3.1 Dual-Engine Reality
- The codebase was intended to query Supabase PostgreSQL.
- However, because write operations are rejected by Supabase RLS (as CRM requests use the unauthenticated `anon` key), the system falls back Authoritatively to `localStorage` under `rodhe_db_*` keys.
- **Implication**: Any product created or edited in the CRM stays inside the store owner's personal browser local storage and is **not synchronized** to visiting customers on other devices.

---

## 4. Key Strengths to Preserve

1. **Aesthetic Tone & Art Direction**: Typography (`Cormorant Garamond`, `Marcellus`, `Plus Jakarta Sans`) and color tokens (`#FAF6EE`, `#4B3024`, `#B88D4A`, `#C98278`) create an authentic Indian slow-luxury atmosphere.
2. **Procedural Web Audio Engine**: Zero-asset sound synthesis in [`ScrollIntroExperience.jsx`](file:///c:/Users/VARUN%20THEJ/OneDrive/Desktop/Rodhe/src/components/ScrollIntroExperience.jsx) produces ambient drones and chimes with zero network payload.
3. **50 Distinct Saree Personas**: Rich curation of Indian botanical dyes and weave stories across Bagru, Shibori, Mulmul, Kota Doria, and Chanderi.
4. **Resilient Normalization Structure**: `storeService.normalizeProduct()` defensively safeguards against crashes from missing properties or malformed price fields.
5. **Fast Build & Clean Tooling**: Vite 8 and Oxlint produce production bundles in under 1 second with 0 build errors.

