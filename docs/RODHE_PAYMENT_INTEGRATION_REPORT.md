# RODHE — Payment Gateway Integration & Architecture Report
**slow-luxury Indian cotton sarees | Woven with Trust**  
*Document Version: 1.0.0 — Production Completion Stage*  
*Date: 08 November 2026*  
*Integration Target: Razorpay Standard Checkout & Verified Cash on Delivery (COD)*

---

## 1. Executive Summary

This report outlines the payment handling architecture implemented for RODHE. The system replaces mock client-side captures with a standards-compliant, RBI-aligned digital payments workflow supporting Indian domestic and international patrons.

---

## 2. Supported Payment Methods

| Payment Method | Technical Gateway | Patron Experience | State on Order Placement | Settlement State |
| :--- | :--- | :--- | :---: | :---: |
| **Instant UPI** | Razorpay Standard Checkout | GPay, PhonePe, Paytm, BHIM deep-link / QR | `pending_payment` | `captured` |
| **Credit & Debit Cards** | Razorpay Standard Checkout | Visa, Mastercard, RuPay with 3D Secure OTP | `pending_payment` | `captured` |
| **Net Banking** | Razorpay Standard Checkout | 50+ Indian commercial banks (HDFC, ICICI, SBI) | `pending_payment` | `captured` |
| **Cash on Delivery (COD)** | Atelier Internal Verification | Inspect drape on delivery before handing cash | `pending_cod` | `captured` (on courier receipt) |

---

## 3. Client & SDK Integration Architecture

### 3.1. Razorpay Script Injection
The official Razorpay Standard Checkout SDK is included in `index.html`:
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

### 3.2. Checkout Execution Workflow (`CheckoutModal.jsx`)
When the customer clicks "Pay ₹[Total]" on Step 3:
1. **Verification of Gateway Configuration**:
   The application inspects `import.meta.env.VITE_RAZORPAY_KEY_ID`.
2. **If Razorpay Key Configured**:
   - Opens the branded Razorpay Modal with parameters:
     - `amount`: Calculated in Indian paise ($\text{total} \times 100$).
     - `currency`: `'INR'`.
     - `name`: `'RODHE — Woven with Trust'`.
     - `theme.color`: `'#4B3024'` (signature Slow-Luxury teakwood).
     - `image`: `'/assets/01_Primary_logo_transparent.png'`.
     - `prefill`: Customer name, email, and 10-digit mobile number.
   - **On Success (`handler`)**:
     Receives `razorpay_payment_id`, `razorpay_order_id`, and `razorpay_signature`.
     Submits the verified order payload to `storeService.createOrder()`.
     Database marks payment as `captured` and logs gateway tokens in `payments`.
   - **On Dismiss / Failure (`modal.ondismiss` / `payment.failed`)**:
     Preserves customer's shopping bag, dismisses spinner, and displays a user-friendly error notice without placing a false order.
3. **If in Developer / Test Mode (No Key Configured)**:
   - The application functions in **Hermetic Test Simulation Mode**:
   - Creates the order with status `pending_payment`, and notes: `'Test Mode: Gateway pending merchant activation.'`
   - **Crucially**: Never marks the payment as fake `captured`.

---

## 4. Database Payment Logging (`public.payments`)

Every transactional payment attempt creates an immutable ledger row in `public.payments`:
```sql
INSERT INTO public.payments (
    order_id,
    gateway,
    gateway_order_id,
    gateway_payment_id,
    gateway_signature,
    amount,
    currency,
    status,
    raw_response
) VALUES (
    v_order_id,
    'razorpay',
    p_order->>'gateway_order_id',
    p_order->>'gateway_payment_id',
    p_order->>'gateway_signature',
    v_grand_total,
    'INR',
    v_payment_status,
    v_payment_payload
);
```

---

## 5. Merchant Activation Steps for Live Production

To transition from test simulation to live payments on `rodhe.in`:

### Step 1: Sign up & Complete KYC on Razorpay
1. Sign in to the [Razorpay Merchant Dashboard](https://dashboard.razorpay.com/).
2. Submit business documents (PAN, GSTIN, Bank Account details) for slow-luxury textile e-commerce.
3. Once KYC is approved, switch dashboard from **Test Mode** to **Live Mode**.

### Step 2: Generate API Keys
1. Navigate to **Settings → API Keys**.
2. Click **Generate Live Key**.
3. Copy the **Key ID** (starts with `rzp_live_...`).

### Step 3: Update Production Environment
In the production hosting platform (e.g., Netlify / Vercel / Cloudflare Pages):
```bash
VITE_RAZORPAY_KEY_ID="rzp_live_xxxxxxxxxxxxxx"
```

### Step 4 (Recommended): Webhook Integration
1. In Razorpay Dashboard, go to **Settings → Webhooks**.
2. Add Webhook URL: `https://<your-backend-api>/api/razorpay-webhook`.
3. Select events:
   - `payment.captured`
   - `payment.failed`
   - `refund.processed`
4. Set Webhook Secret and store in backend environment variables.

