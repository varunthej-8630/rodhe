# 03. MISSING FEATURES & INCOMPLETE CAPABILITIES — RODHE
## Comprehensive Deficit Assessment

---

## 1. Critical Commercial & Transactional Deficits

### 1.1 Complete Absence of Order Persistence
- **Current State**: When a customer clicks "Confirm & Pay" in [`CheckoutModal.jsx`](file:///c:/Users/VARUN%20THEJ/OneDrive/Desktop/Rodhe/src/components/CheckoutModal.jsx), the modal executes a `setTimeout` of 1400ms, fabricates a random `RODHE-IND-XXXXXX` string in React component state, and clears the shopping bag.
- **Missing Elements**:
  - No `orders` table in Supabase or local storage schema.
  - No `order_items` table linking specific saree SKUs, quantities, and prices to the transaction.
  - No record of patron shipping details (street address, city, state, postal PIN code).
  - No order history retrieval mechanism for customers or store administrators.
  - The boutique CRM does **not even have an "Orders" tab**!

### 1.2 Missing Payment Gateway Integration
- **Current State**: The checkout modal offers visual radio buttons for "UPI / QR Code", "Debit & Credit Cards", "Net Banking", and "Cash on Delivery (COD)". Selecting any method and clicking "Confirm & Pay" completes immediately without contacting any bank or gateway.
- **Missing Elements**:
  - No payment SDK (e.g., Razorpay, Cashfree, PayU, Stripe) installed or configured.
  - No server-side payment order generation (`order_id`).
  - No payment signature verification (HMAC SHA-256).
  - No webhook handling for asynchronous payment status (success, failed, abandoned).
  - No true COD workflow with order verification.

### 1.3 Missing Real-Time Inventory Reservation & Stock Deduction
- **Current State**: Products possess a `stock_count` attribute in `src/data/products.js` (e.g. `stockCount: 6`). When an order is placed, `stock_count` is never decremented in the database or `localStorage`.
- **Missing Elements**:
  - No transactional decrement: `UPDATE products SET stock_count = stock_count - :qty WHERE id = :id AND stock_count >= :qty`.
  - No race-condition prevention (two patrons buying the last item simultaneously).
  - An out-of-stock item can be checked out repeatedly.

---

## 2. Customer Account & Authentication Deficits

### 2.1 Simulated Customer Portal
- **Current State**: [`AuthModal.jsx`](file:///c:/Users/VARUN%20THEJ/OneDrive/Desktop/Rodhe/src/components/AuthModal.jsx) provides "Patron Sign In" and "Create Account" forms. Submitting shows a success toast and closes the dialog after 1.2 seconds.
- **Missing Elements**:
  - No call to `supabase.auth.signUp()` or `supabase.auth.signInWithPassword()`.
  - No customer session cookie or JWT token.
  - No `customer_profiles` table to store patron preferences, measurement profiles, or phone numbers.
  - No `customer_addresses` table for multi-address delivery management.
  - No "My Account" or "Order History" view where a customer can review past purchases or tracking numbers.

---

## 3. Boutique CRM Deficits

### 3.1 Missing Order Management & Fulfillment Module
- The CRM sidebar ([`AdminLayout.jsx`](file:///c:/Users/VARUN%20THEJ/OneDrive/Desktop/Rodhe/src/components/admin/AdminLayout.jsx)) contains tabs for Dashboard, Sarees, Merchandising, Banners, Promotions, Stories, Inquiries, and Settings.
- **There is no Orders or Shipments tab!**
- The store owner cannot view orders placed by customers, update shipping tracking numbers (e.g. Bluedart, Delhivery, India Post), mark orders as dispatched, or handle returns/cancellations.

### 3.2 Cloud Sync Disconnect (The Anon Client Trap)
- **Current State**: The CRM operates with the unauthenticated Supabase `anon` key. When the store owner edits a saree or adds stock, Supabase Row Level Security rejects the write because policies require `TO authenticated`.
- **Result**: Changes exist **only in the store owner's personal browser local storage**. Customers visiting the site from another computer or smartphone do not see inventory changes or new products.

---

## 4. Legal, Compliance & Commerce Policy Deficits

### 4.1 Missing Dedicated Policy Documents
In [`Footer.jsx`](file:///c:/Users/VARUN%20THEJ/OneDrive/Desktop/Rodhe/src/components/Footer.jsx), all customer service links route to the generic `contact` concierge form:
- **Privacy Policy**: Missing (Mandatory under Indian IT Act, 2000 and DPDP Act, 2023).
- **Terms of Service**: Missing (Mandatory commercial contract).
- **Shipping & Delivery Policy**: Missing (No stated delivery SLAs or logistics partner details).
- **Returns, Exchange & Cancellation Policy**: Missing (No documented return window, return pickup instructions, or inspection rules).
- **Refund Policy**: Missing (No stated turnaround timeline for UPI/card reversals).

### 4.2 False Trademark Representation
- Footer and documentation assert: *“Woven with Trust” is a registered trademark.*
- No Indian Trade Marks Registry application number or certificate is documented. Under Section 107 of the Trade Marks Act, 1999, falsely representing an unregistered mark as registered is subject to penalties.

---

## 5. Media & Asset Deficits

### 5.1 Shared Stock Photography (Asset Deficit)
- The catalog contains 50 sarees, but only **10 unique JPEG photographs** exist in `public/assets/products/`.
- 40 sarees share identical photography with other distinct sarees (e.g., `saree_ivory_mulmul.jpg` is the primary image for 6 different sarees; `saree_forest_olive.jpg` is the primary image for 6 different sarees).
- Customers viewing different products see duplicate photography, undermining trust in an authentic handloom atelier.

