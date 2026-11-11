/**
 * RODHE Direct UPI Payment Configuration & Helpers
 *
 * Uses ONLY the merchant/payee UPI IDs and untouched static QR images
 * verified directly against the supplied QR payloads.
 */

export const PAYMENT_STATUS = {
  CREATED: 'CREATED',
  PENDING: 'PENDING',
  AWAITING_VERIFICATION: 'AWAITING_VERIFICATION',
  PAID: 'PAID',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
  REFUNDED: 'REFUNDED'
};

export const UPI_PAYMENT_WINDOW_MINUTES = 30;

export const UPI_PAYMENT_METHODS = {
  upi_phonepe: {
    id: 'upi_phonepe',
    slug: 'phonepe',
    name: 'PhonePe',
    shortLabel: 'PhonePe UPI',
    vpa: 'rayapati.krupakar@ibl',
    payeeName: 'KRUPAKAR RAYAPATI',
    rawPayeeParam: 'KRUPAKAR  RAYAPATI',
    qrImage: '/assets/upi/phonepe-qr.jpg',
    decodedUri: 'upi://pay?pa=rayapati.krupakar@ibl&pn=KRUPAKAR%20%20RAYAPATI&mc=0000&mode=02&purpose=00',
    qrType: 'static',
    isCommercialMerchant: false,
    accentColor: '#5F259F',
    badgeText: 'Scan or Pay via PhonePe'
  },
  upi_gpay: {
    id: 'upi_gpay',
    slug: 'gpay',
    name: 'Google Pay',
    shortLabel: 'Google Pay (GPay)',
    vpa: 'rayapatikrupakar-3@oksbi',
    payeeName: 'Rayapati Krupakar',
    rawPayeeParam: 'Rayapati Krupakar',
    qrImage: '/assets/upi/gpay-qr.jpg',
    decodedUri: 'upi://pay?pa=rayapatikrupakar-3@oksbi&pn=Rayapati%20Krupakar&aid=uGICAgID1gcjFPg',
    qrType: 'static',
    isCommercialMerchant: false,
    accentColor: '#1A73E8',
    badgeText: 'Scan or Pay via Google Pay'
  },
  upi_paytm: {
    id: 'upi_paytm',
    slug: 'paytm',
    name: 'Paytm',
    shortLabel: 'Paytm UPI',
    vpa: '9177900684@ptsbi',
    payeeName: 'KRUPAKAR RAYAPATI',
    rawPayeeParam: 'KRUPAKAR  RAYAPATI',
    qrImage: '/assets/upi/paytm-qr.jpg',
    decodedUri: 'upi://pay?pa=9177900684@ptsbi&pn=KRUPAKAR%20%20RAYAPATI',
    qrType: 'static',
    isCommercialMerchant: false,
    accentColor: '#00BAF2',
    badgeText: 'Scan or Pay via Paytm'
  }
};

export const UPI_METHOD_LIST = [
  UPI_PAYMENT_METHODS.upi_phonepe,
  UPI_PAYMENT_METHODS.upi_gpay,
  UPI_PAYMENT_METHODS.upi_paytm
];

export function getUpiMethodConfig(methodId) {
  if (!methodId) return UPI_PAYMENT_METHODS.upi_phonepe;
  const norm = String(methodId).toLowerCase().trim();
  if (norm === 'phonepe' || norm === 'upi_phonepe') return UPI_PAYMENT_METHODS.upi_phonepe;
  if (norm === 'gpay' || norm === 'googlepay' || norm === 'google_pay' || norm === 'upi_gpay') {
    return UPI_PAYMENT_METHODS.upi_gpay;
  }
  if (norm === 'paytm' || norm === 'upi_paytm') return UPI_PAYMENT_METHODS.upi_paytm;
  return UPI_PAYMENT_METHODS[norm] || UPI_PAYMENT_METHODS.upi_phonepe;
}

export function isUpiMethod(methodId) {
  const norm = String(methodId || '').toLowerCase().trim();
  return ['upi', 'upi_phonepe', 'upi_gpay', 'upi_paytm', 'phonepe', 'gpay', 'paytm'].includes(norm);
}

/**
 * Generates an encoded standard NPCI UPI intent URI + optional app-specific deep links.
 * Opening an intent link never proves payment completion.
 */
export function buildUpiIntentUrls({ methodId, amount, orderNumber, note }) {
  const method = getUpiMethodConfig(methodId);
  const numericAmount = Number(amount || 0);
  const formattedAmount = numericAmount > 0 ? numericAmount.toFixed(2) : '0.00';
  const cleanOrderRef = String(orderNumber || '').replace(/[^A-Za-z0-9_-]/g, '');
  const txNote = String(note || `RODHE Order ${cleanOrderRef}`).trim().slice(0, 80);

  const params = new URLSearchParams();
  params.set('pa', method.vpa);
  params.set('pn', method.payeeName);
  if (numericAmount > 0) {
    params.set('am', formattedAmount);
  }
  params.set('cu', 'INR');
  if (cleanOrderRef) {
    params.set('tr', cleanOrderRef);
  }
  if (txNote) {
    params.set('tn', txNote);
  }

  const query = params.toString();
  const standardUrl = `upi://pay?${query}`;

  let appSpecificUrl = standardUrl;
  if (method.id === 'upi_phonepe') {
    appSpecificUrl = `phonepe://pay?${query}`;
  } else if (method.id === 'upi_gpay') {
    appSpecificUrl = `tez://upi/pay?${query}`;
  } else if (method.id === 'upi_paytm') {
    appSpecificUrl = `paytmmp://pay?${query}`;
  }

  return {
    method,
    standardUrl,
    appSpecificUrl,
    formattedAmount,
    txRef: cleanOrderRef,
    txNote
  };
}

/**
 * Validates customer-entered UPI UTR / transaction reference.
 * Standard NPCI UPI UTRs are 12 numeric digits, while some bank/wallet
 * refs may use 10-35 alphanumeric characters.
 * Note: Validating format only allows recording `AWAITING_VERIFICATION` — NEVER `PAID`.
 */
export function normalizeAndValidateUtr(rawValue) {
  const cleaned = String(rawValue || '').trim().toUpperCase();
  if (!cleaned) {
    return { valid: false, value: '', error: 'Please enter the 12-digit UPI Transaction / UTR number.' };
  }
  if (!/^[A-Z0-9_-]{8,35}$/.test(cleaned)) {
    return {
      valid: false,
      value: cleaned,
      error: 'Enter a valid UPI / UTR reference (8–35 letters or digits, usually a 12-digit number).'
    };
  }
  if (/^(0+|12345678+|TEST.*|DUMMY.*|SAMPLE.*)$/i.test(cleaned)) {
    return {
      valid: false,
      value: cleaned,
      error: 'Please enter the actual UTR reference from your UPI app payment receipt.'
    };
  }
  return { valid: true, value: cleaned, error: '' };
}

export function normalizePaymentStatus(rawStatus) {
  const s = String(rawStatus || '').trim();
  const upper = s.toUpperCase();
  if (upper === 'CREATED') return PAYMENT_STATUS.CREATED;
  if (upper === 'PENDING' || upper === 'PENDING_PAYMENT' || upper === 'PENDING_COD') {
    return PAYMENT_STATUS.PENDING;
  }
  if (upper === 'AWAITING_VERIFICATION' || upper === 'AUTHORIZED') {
    return PAYMENT_STATUS.AWAITING_VERIFICATION;
  }
  if (upper === 'PAID' || upper === 'CAPTURED') return PAYMENT_STATUS.PAID;
  if (upper === 'FAILED') return PAYMENT_STATUS.FAILED;
  if (upper === 'CANCELLED') return PAYMENT_STATUS.CANCELLED;
  if (upper === 'EXPIRED') return PAYMENT_STATUS.EXPIRED;
  if (upper === 'REFUNDED' || upper === 'REFUND_PENDING') return PAYMENT_STATUS.REFUNDED;
  return PAYMENT_STATUS.PENDING;
}

export function getPaymentStatusMeta(rawStatus) {
  const status = normalizePaymentStatus(rawStatus);
  switch (status) {
    case PAYMENT_STATUS.PAID:
      return {
        status,
        label: 'Paid — Verified by RODHE',
        shortLabel: 'PAID',
        bg: 'rgba(82, 91, 58, 0.14)',
        color: '#3F472B',
        border: 'rgba(82, 91, 58, 0.35)'
      };
    case PAYMENT_STATUS.AWAITING_VERIFICATION:
      return {
        status,
        label: 'Awaiting Payment Verification',
        shortLabel: 'AWAITING VERIFICATION',
        bg: 'rgba(184, 141, 74, 0.16)',
        color: '#8E6628',
        border: 'rgba(184, 141, 74, 0.45)'
      };
    case PAYMENT_STATUS.FAILED:
      return {
        status,
        label: 'Payment Verification Failed / Mismatch',
        shortLabel: 'FAILED',
        bg: 'rgba(201, 130, 120, 0.16)',
        color: '#8A2A20',
        border: 'rgba(201, 130, 120, 0.45)'
      };
    case PAYMENT_STATUS.EXPIRED:
      return {
        status,
        label: 'Payment Window Expired — Retry Available',
        shortLabel: 'EXPIRED',
        bg: 'rgba(75, 48, 36, 0.12)',
        color: '#6F4E3E',
        border: 'rgba(75, 48, 36, 0.3)'
      };
    case PAYMENT_STATUS.CANCELLED:
      return {
        status,
        label: 'Cancelled',
        shortLabel: 'CANCELLED',
        bg: 'rgba(143, 114, 99, 0.14)',
        color: '#6F4E3E',
        border: 'rgba(143, 114, 99, 0.3)'
      };
    case PAYMENT_STATUS.REFUNDED:
      return {
        status,
        label: 'Refunded',
        shortLabel: 'REFUNDED',
        bg: 'rgba(38, 66, 90, 0.12)',
        color: '#26425A',
        border: 'rgba(38, 66, 90, 0.3)'
      };
    case PAYMENT_STATUS.CREATED:
      return {
        status,
        label: 'Order Created — Payment Pending',
        shortLabel: 'CREATED',
        bg: 'rgba(234, 218, 181, 0.35)',
        color: '#4B3024',
        border: 'rgba(184, 141, 74, 0.35)'
      };
    case PAYMENT_STATUS.PENDING:
    default:
      return {
        status: PAYMENT_STATUS.PENDING,
        label: 'Pending Payment — Not Yet Verified',
        shortLabel: 'PENDING',
        bg: 'rgba(184, 141, 74, 0.14)',
        color: '#8E6628',
        border: 'rgba(184, 141, 74, 0.35)'
      };
  }
}

export function formatPaymentMethodLabel(methodId) {
  const norm = String(methodId || '').toLowerCase().trim();
  if (norm === 'upi_phonepe' || norm === 'phonepe') return 'PhonePe (UPI)';
  if (norm === 'upi_gpay' || norm === 'gpay') return 'Google Pay (UPI)';
  if (norm === 'upi_paytm' || norm === 'paytm') return 'Paytm (UPI)';
  if (norm === 'whatsapp') return 'WhatsApp Concierge';
  if (norm === 'cod') return 'Cash on Delivery';
  return 'UPI';
}

export function maskUpiId(vpa) {
  const clean = String(vpa || '').trim();
  const [local, domain] = clean.split('@');
  if (!local || !domain) return clean;
  if (local.length <= 4) return `${local[0]}***@${domain}`;
  return `${local.slice(0, 3)}***${local.slice(-2)}@${domain}`;
}

