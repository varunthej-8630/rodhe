/**
 * RODHE UPI Payment Service
 *
 * Orchestrates order creation, idempotency protection, pending-order session recovery,
 * UPI deep-link intent generation, customer UTR submission (strictly AWAITING_VERIFICATION),
 * retry/app switching, and admin manual reconciliation.
 */

import { storeService } from './storeService.js';
import {
  PAYMENT_STATUS,
  buildUpiIntentUrls,
  getUpiMethodConfig,
  normalizeAndValidateUtr,
  normalizePaymentStatus
} from '../config/upiConfig.js';

const PENDING_UPI_SESSION_KEY = 'rodhe_pending_upi_order';

export const paymentService = {
  getPendingSessionOrder() {
    try {
      if (typeof sessionStorage === 'undefined') return null;
      const raw = sessionStorage.getItem(PENDING_UPI_SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && parsed.orderNumber ? parsed : null;
    } catch {
      return null;
    }
  },

  savePendingSessionOrder(orderSummary) {
    try {
      if (typeof sessionStorage === 'undefined' || !orderSummary?.orderNumber) return;
      sessionStorage.setItem(PENDING_UPI_SESSION_KEY, JSON.stringify(orderSummary));
    } catch {}
  },

  clearPendingSessionOrder() {
    try {
      if (typeof sessionStorage === 'undefined') return;
      sessionStorage.removeItem(PENDING_UPI_SESSION_KEY);
    } catch {}
  },

  async createPendingUpiOrder({
    items,
    customer,
    shippingAddress,
    appliedCoupon,
    giftWrap,
    shippingFee,
    discountAmount,
    upiMethod,
    notes,
    idempotencyKey
  }) {
    const methodCfg = getUpiMethodConfig(upiMethod);

    const created = await storeService.createOrder({
      idempotencyKey,
      customerName: customer.fullName,
      customerEmail: customer.email || '',
      customerPhone: customer.phone,
      shippingAddress,
      items,
      appliedCoupon: appliedCoupon?.code || null,
      discountAmount,
      shippingFee,
      giftWrap: Boolean(giftWrap),
      paymentMethod: methodCfg.id,
      notes
    });

    const sessionRecord = {
      orderId: created.id,
      orderNumber: created.orderNumber,
      grandTotal: created.grandTotal,
      paymentMethod: methodCfg.id,
      paymentStatus: normalizePaymentStatus(created.paymentStatus),
      paymentExpiresAt: created.paymentExpiresAt || created.payment_expires_at,
      utrReference: created.utrReference || '',
      customerName: customer.fullName,
      contact: customer.email || customer.phone,
      customerPhone: customer.phone,
      customerEmail: customer.email || '',
      createdAt: created.createdAt || new Date().toISOString()
    };

    this.savePendingSessionOrder(sessionRecord);
    return {
      order: created,
      sessionRecord,
      intent: buildUpiIntentUrls({
        methodId: methodCfg.id,
        amount: created.grandTotal,
        orderNumber: created.orderNumber
      })
    };
  },

  async submitUtr({ orderNumber, contact, utrReference, upiMethod }) {
    const check = normalizeAndValidateUtr(utrReference);
    if (!check.valid) {
      throw new Error(check.error);
    }

    const res = await storeService.submitUpiReference({
      orderNumber,
      contact,
      utrReference: check.value,
      upiMethod
    });

    const existing = this.getPendingSessionOrder();
    if (existing && existing.orderNumber === orderNumber) {
      this.savePendingSessionOrder({
        ...existing,
        paymentMethod: upiMethod || existing.paymentMethod,
        paymentStatus: PAYMENT_STATUS.AWAITING_VERIFICATION,
        utrReference: check.value
      });
    }

    return res;
  },

  async retryWithMethod({ orderNumber, contact, upiMethod }) {
    const methodCfg = getUpiMethodConfig(upiMethod);
    const res = await storeService.retryUpiPayment({
      orderNumber,
      contact,
      upiMethod: methodCfg.id
    });

    const existing = this.getPendingSessionOrder();
    if (existing && existing.orderNumber === orderNumber) {
      this.savePendingSessionOrder({
        ...existing,
        paymentMethod: methodCfg.id,
        paymentStatus: PAYMENT_STATUS.PENDING,
        paymentExpiresAt: res.payment_expires_at || existing.paymentExpiresAt
      });
    }

    return res;
  },

  async refreshOrderStatus({ orderNumber, contact }) {
    const found = await storeService.lookupOrder(orderNumber, contact);
    if (!found) return null;

    const normalized = normalizePaymentStatus(found.payment_status || found.paymentStatus);
    const existing = this.getPendingSessionOrder();
    if (existing && existing.orderNumber === (found.order_number || found.orderNumber)) {
      if ([PAYMENT_STATUS.PAID, PAYMENT_STATUS.CANCELLED, PAYMENT_STATUS.REFUNDED].includes(normalized)) {
        this.savePendingSessionOrder({
          ...existing,
          paymentStatus: normalized,
          utrReference: found.utr_reference || existing.utrReference
        });
      }
    }
    return found;
  },

  async verifyAdmin({ orderId, action, verifiedUtr, notes, adminEmail }) {
    return storeService.verifyPaymentAdmin({
      orderId,
      action,
      verifiedUtr,
      notes,
      adminEmail
    });
  }
};

