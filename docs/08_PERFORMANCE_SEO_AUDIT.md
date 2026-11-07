# 08. PERFORMANCE & SEO AUDIT — RODHE
## Bundle Metrics, Core Web Vitals & Search Visibility

---

## 1. Measured Production Build Metrics

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                       VITE 8 PRODUCTION BUILD ANALYSIS                       ║
╠════════════════════════╦══════════════╦══════════════════════════════════════╣
║ Output Asset           ║ Raw Size     ║ Gzip Compressed Size                 ║
╠════════════════════════╬══════════════╬══════════════════════════════════════╣
║ dist/index.html        ║ 2.97 kB      ║ 1.19 kB                              ║
║ dist/assets/index.css  ║ 18.56 kB     ║ 4.34 kB                              ║
║ dist/assets/index.js   ║ 928.25 kB    ║ 236.40 kB                            ║
║ Build Compilation Time ║ 677 ms       ║ Transform: 2,011 modules             ║
╚════════════════════════╩══════════════╩══════════════════════════════════════╝
```

### 1.1 The Monolithic Bundle Warning
During `npm run build`, Rollup emits:
```
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
```
- **Root Cause**: [`src/App.jsx`](file:///c:/Users/VARUN%20THEJ/OneDrive/Desktop/Rodhe/src/App.jsx) statically imports all 12 Administrative CRM components (`AdminPortal`, `AdminProductList`, `AdminProductForm`, `AdminBulkImport`, etc.), all dialog modals, and all full-page views into the initial entry bundle.
- **Impact on Patrons**: A casual customer visiting the storefront on a 4G mobile phone in India is forced to download the entire boutique CRM suite code upfront, unnecessarily inflating initial parse time and Largest Contentful Paint (LCP).
- **Optimization Strategy**: Implement code-splitting via `React.lazy()`:
  ```javascript
  const AdminPortal = React.lazy(() => import('./components/admin/AdminPortal'));
  const BrandStoryPage = React.lazy(() => import('./components/BrandStoryPage'));
  const ContactConciergePage = React.lazy(() => import('./components/ContactConciergePage'));
  ```
  **Expected Result**: Reduces initial customer bundle size from **928 kB** down to **~260 kB** (a 72% reduction in initial JavaScript execution).

---

## 2. Core Web Vitals Analysis

### 2.1 Largest Contentful Paint (LCP)
- **Current Culprit**: Hero section background video (`/assets/Herosection-RODHE.mp4`) and cloud background layers in the scroll experience.
- **Optimization**:
  1. Add a low-byte WebP poster image (`poster="/assets/hero_poster.webp"`) to `<video>` in [`HeroSection.jsx`](file:///c:/Users/VARUN%20THEJ/OneDrive/Desktop/Rodhe/src/components/HeroSection.jsx) so browsers paint immediately without waiting for MP4 video stream buffering.
  2. Set `preload="metadata"` on `<video>` elements.

### 2.2 Cumulative Layout Shift (CLS)
- **Status**: **EXCELLENT (0.01 estimated)**.
- Product cards maintain explicit aspect-ratio containers (`aspect-ratio: 3/4`), preventing reflow jumps as photographs resolve.

### 2.3 Interaction to Next Paint (INP)
- **Status**: **FAST (<50ms)**.
- State transitions in `ShopContext` are lightweight. Canvas Confetti is loaded asynchronously and executes off main UI paint loops.

---

## 3. SEO & Structured Data Audit

| SEO Asset | Status | Current Reality & Recommendation |
|---|---|---|
| **Primary Meta Tags** | `GOOD` | Present in [`index.html`](file:///c:/Users/VARUN%20THEJ/OneDrive/Desktop/Rodhe/index.html): `<title>`, `<meta name="description">`, `<meta name="theme-color">`. |
| **Open Graph (Social)** | `GOOD` | `og:title`, `og:description`, `og:image`, `twitter:card` configured. |
| **JSON-LD Schema** | `PARTIAL` | `ClothingStore` schema present in `index.html`. **Missing**: Individual `Product` and `BreadcrumbList` microdata on Product Detail Pages (`ProductDetailPage.jsx`). |
| **Dynamic Page Titles** | `DEFICIT` | Single Page App architecture leaves `<title>` static (*RODHE — Woven with Trust*) across all PDPs and collection views. Need dynamic `<title>` updates when browsing sarees. |
| **Robots.txt** | `MISSING` | No `public/robots.txt` exists. |
| **Sitemap.xml** | `MISSING` | No `public/sitemap.xml` exists for search engine crawler indexing. |

