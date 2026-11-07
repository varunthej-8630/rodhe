# 06. BUSINESS LOGIC & CONTRADICTION AUDIT — RODHE
## Commercial Rules, Catalog Consistency & Documentation Conflicts

---

## 1. Contradiction Matrix

Every contradiction identified across the codebase, documentation, and business rules has been analyzed below:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              RODHE CONTRADICTION MATRIX                                │
├────┬─────────────────────────────┬────────────────────────────────┬────────────────────┤
│ ID │ Discrepancy                 │ Code vs Documentation          │ Owner Approval?    │
├────┼─────────────────────────────┼────────────────────────────────┼────────────────────┤
│ C1 │ ₹500–₹2,000 vs ₹8,000 Slider│ ShopContext: priceMax = 8000   │ REQUIRED           │
│ C2 │ CSV Template Prices         │ Sample CSV: ₹5,400 to ₹6,200   │ Internal Correction│
│ C3 │ Discount Badges vs Honesty  │ check constraint vs clean UI   │ Resolved in UI     │
│ C4 │ 100% Cotton vs Silk Blends  │ Chanderi silk / Tussar in CSV  │ REQUIRED           │
│ C5 │ 6.5m Length vs Blouse Piece │ Saree length phrasing          │ Internal Correction│
│ C6 │ 10 vs 11 Database Tables    │ README claims 10, SQL has 11   │ Internal Correction│
│ C7 │ LocalStorage vs Supabase    │ "Dual Engine" masking RLS block│ Technical Fix      │
│ C8 │ Visual Payment vs Gateway   │ UI radios with no real backend │ REQUIRED           │
│ C9 │ wa.me vs Business API       │ Simple URL labeled "API"       │ Internal Correction│
│ C10│ Registered Trademark (®)    │ Claimed without registration   │ REQUIRED           │
│ C11│ Free Shipping ₹2,999        │ Unreachable on single purchase │ REQUIRED           │
│ C12│ Declared vs Locked Tooling  │ Oxlint ^1.88.0 locked at 1.89  │ Verified           │
└────┴─────────────────────────────┴────────────────────────────────┴────────────────────┘
```

---

## 2. In-Depth Contradiction Analysis

### 2.1 Contradiction 1: Saree Price Bracket (₹500–₹2,000) vs ₹8,000 Slider
- **Existing Documentation**: Explicitly states: *"Catalog Price Floor & Ceiling: Saree prices are strictly calibrated within the ₹500 to ₹2,000 price bracket."*
- **Actual Code Implementation**: In [`src/context/ShopContext.jsx`](file:///c:/Users/VARUN%20THEJ/OneDrive/Desktop/Rodhe/src/context/ShopContext.jsx), line 96: `const [priceMax, setPriceMax] = useState(8000);` and in [`src/components/CollectionPage.jsx`](file:///c:/Users/VARUN%20THEJ/OneDrive/Desktop/Rodhe/src/components/CollectionPage.jsx), the slider ceiling is `8000`.
- **Inconsistency**: Because all 50 sarees in `src/data/products.js` are priced between ₹590 and ₹1,750, more than 75% of the slider scale (from ₹2,001 to ₹8,000) is completely vacant space where no products exist.
- **Impact**: Patrons dragging the slider above ₹2,000 see empty results, giving an impression of catalog deficiency.
- **Recommended Correction**: Calibrate the price slider range to `min: 500`, `max: 2000`, with step increments of ₹100.
- **Owner Confirmation Required?**: **YES** (Confirm whether future luxury collections will exceed ₹2,000).

### 2.2 Contradiction 2: CSV Importer Sample Prices Violate Price Bracket
- **Existing Documentation**: Documents strict ₹500–₹2,000 pricing.
- **Actual Code Implementation**: In [`src/components/admin/AdminBulkImport.jsx`](file:///c:/Users/VARUN%20THEJ/OneDrive/Desktop/Rodhe/src/components/admin/AdminBulkImport.jsx), line 25:
  ```csv
  "Vanamali Forest Olive Chanderi",RODHE-OLV-001,6200,5400,"Chanderi Weave"...
  "Raktika Madder Red Bagru Saree",RODHE-MAD-002,4800,3950...
  "Hemangi Muted Gold Tussar Saree",RODHE-GLD-003,7400,6200...
  ```
- **Inconsistency**: The sample CSV template downloadable by the store owner contains selling prices of ₹5,400, ₹3,950, and ₹6,200.
- **Impact**: If an administrator uploads the template, it injects items that violate the brand's stated pricing philosophy.
- **Recommended Correction**: Update the CSV template sample rows to ₹950, ₹1,250, and ₹1,650.
- **Owner Confirmation Required?**: NO (Internal consistency fix).

### 2.3 Contradiction 3: Pure Cotton Hallmarks vs Silk & Tussar Inclusions
- **Existing Documentation**: Claims: *"100% Pure Indian Cotton"*.
- **Actual Code Implementation**: Several sarees and the CSV template refer to *"Tussar Cotton Silk"*, *"Handwoven Cotton Silk"*, and *"Gossamer cotton-silk translucent drapes"*.
- **Inconsistency**: Silk is an animal fiber (sericulture), whereas the brand story heavily emphasizes rain-fed agricultural plant cotton.
- **Impact**: Vegan, purist, or cruelty-free consumers may complain if a saree marketed under "100% Pure Indian Cotton" contains silkworm filament.
- **Recommended Correction**: Explicitly classify textiles into two clear lines: "100% Pure Cotton" vs "Cotton-Silk Chanderi Blends".
- **Owner Confirmation Required?**: **YES** (Confirm actual yarn composition with weavers).

### 2.4 Contradiction 4: 6.5-Metre Dimensions vs Included Blouse Piece
- **Existing Documentation**: Mentions: *"Length: 6.5 meters (including 80 cm blouse piece)"*.
- **Actual Product Reality**: In traditional Indian textiles, a standard saree is 5.5 meters, accompanied by an 80cm (0.8m) to 1.0m blouse cut, totaling 6.3m to 6.5m. Some product descriptions phrasing suggests 6.5 meters *plus* a separate blouse piece.
- **Impact**: Customer misunderstanding regarding unstitched running fabric vs pre-cut separate fabric.
- **Recommended Correction**: Standardize product specification phrasing: *"Total Fabric Length: 6.5 meters (5.7m saree drape + 0.8m unstitched running blouse fabric)"*.
- **Owner Confirmation Required?**: NO.

### 2.5 Contradiction 5: WhatsApp "Business API" Claim vs Click-to-Chat Deep Link
- **Existing Documentation**: Claims: *"WhatsApp Business API Integration"*.
- **Actual Code Implementation**: Uses `https://wa.me/919490658858?text=...`.
- **Inconsistency**: `wa.me` links are client-side URI schemes (Click-to-Chat). The official Meta WhatsApp Business Cloud API involves REST webhooks, phone number IDs, server-side payload dispatches, and message templates.
- **Impact**: Misleads stakeholders regarding automated conversational bots or delivery tracking over WhatsApp.
- **Recommended Correction**: Accurately describe as *"Direct WhatsApp Concierge Click-to-Chat Integration"*.
- **Owner Confirmation Required?**: NO.

### 2.6 Contradiction 6: Registered Trademark Claims (®)
- **Existing Documentation**: Claims: *"RODHE. 'Woven with Trust' is a registered trademark."*
- **Actual Reality**: No trademark application number, registration certificate, or jurisdiction filing exists in the repository.
- **Legal Risk**: Under Section 107 of the Indian Trade Marks Act, 1999, falsely stating that a trademark is registered when it is not is a criminal offense punishable with imprisonment and fines.
- **Recommended Correction**: Replace "registered trademark" with "trademark" or "all rights reserved" until official registration is obtained from the Controller General of Patents, Designs and Trade Marks (CGPDTM).
- **Owner Confirmation Required?**: **YES** (Verify whether an active TM application or registration number exists).

### 2.7 Contradiction 7: Free Shipping Threshold (₹2,999) vs Price Bracket (₹500–₹2,000)
- **Existing Documentation**: Free shipping on orders ₹2,999+.
- **Actual Impact**: Because the maximum saree price is ₹2,000, **zero customers purchasing a single saree can ever qualify for free shipping**. A customer is forced to purchase at least two or three sarees to reach the threshold.
- **Recommended Correction**: Provide business owner options:
  - Option A: Lower the free shipping threshold to ₹1,499 or ₹1,999 so high-tier single saree purchases qualify.
  - Option B: Keep ₹2,999 as an intentional incentive for multi-saree basket building.
- **Owner Confirmation Required?**: **YES**.

