/**
 * RODHE CRM — Money Planner Persistence Service
 * Enforces owner/admin authentication, organization isolation, server-authoritative
 * financial recomputation, optimistic concurrency detection, and friendly errors.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient.js';
import { authService } from './authService.js';
import {
  calculateMoneyBatch,
  validateBatchForSave,
  createPlannerLine
} from '../utils/moneyPlannerCalc.js';

function mapMoneyPlannerError(err, defaultMessage = 'Your batch could not be saved. Please try again.') {
  const code = String(err?.code || '');
  const msg = String(err?.message || '');

  if (code === '40001' || msg.includes('CONFLICT:')) {
    return new Error('This batch has been updated elsewhere. Refresh it before saving your changes.');
  }
  if (code === '42501' || msg.toLowerCase().includes('unauthorized')) {
    return new Error('Administrator sign-in is required to access Money Planner.');
  }
  if (code === 'P0002' || msg.toLowerCase().includes('another organization')) {
    return new Error('This batch could not be found in your organization.');
  }
  if (code === 'PGRST202' || code === 'PGRST205' || msg.includes('Could not find the function') || msg.includes('does not exist')) {
    return new Error('Money Planner database tables are not installed on Supabase yet. Please execute migration 20261112_crm_money_planner.sql in SQL Editor.');
  }
  if (code === '22023') {
    return new Error(msg || 'Please review the highlighted batch inputs and try again.');
  }
  if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('timeout')) {
    return new Error('Network connection interrupted. Your batch could not be saved. Please try again.');
  }
  return new Error(defaultMessage);
}

function hydrateBatchRecord(row, lines = []) {
  const setupLines = [];
  const perSareeLines = [];

  (Array.isArray(lines) ? lines : [])
    .slice()
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
    .forEach((line) => {
      const amountVal = line.amount !== undefined && line.amount !== null ? Number(line.amount).toFixed(2) : '';
      const entry = {
        id: line.id || createPlannerLine(line.name, line.kind, amountVal).id,
        name: line.name || '',
        amount: amountVal === '0.00' ? '0' : amountVal.replace(/\.00$/, ''),
        kind: line.kind === 'setup' ? 'setup' : 'per_saree'
      };
      if (entry.kind === 'setup') {
        setupLines.push(entry);
      } else {
        perSareeLines.push(entry);
      }
    });

  return {
    id: row.id,
    name: row.name,
    quantity: String(row.quantity ?? 30),
    profitPercent:
      row.profit_percent !== null && row.profit_percent !== undefined
        ? String(row.profit_percent).replace(/\.00$/, '')
        : '',
    setupTotal: Number(row.setup_total ?? 0),
    perSareeTotal: Number(row.per_saree_total ?? 0),
    totalMoneyNeeded: Number(row.total_money_needed ?? 0),
    costPerSaree: Number(row.cost_per_saree ?? 0),
    estimatedSellingPrice:
      row.estimated_selling_price !== null && row.estimated_selling_price !== undefined
        ? Number(row.estimated_selling_price)
        : null,
    lineCount: Number(row.line_count ?? lines.length),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    setupLines,
    perSareeLines,
    isTemplateCopy: false
  };
}

/**
 * Isolated offline/test-mode store mirroring exact Postgres RPC semantics
 * (never bypassed when unauthenticated).
 */
export function createMemoryBatchRepository() {
  const store = [];

  const recomputeTotals = (payload) => {
    const setupLines = payload.lines.filter((l) => l.kind === 'setup').map((l) => ({ ...l, amount: l.amount.toFixed(2) }));
    const perSareeLines = payload.lines.filter((l) => l.kind === 'per_saree').map((l) => ({ ...l, amount: l.amount.toFixed(2) }));
    const calc = calculateMoneyBatch({
      quantity: payload.quantity,
      setupLines,
      perSareeLines,
      profitPercent: payload.profitPercent
    });
    return calc;
  };

  return {
    async list({ search = '', page = 1, pageSize = 10, session }) {
      if (!session?.id || !session?.organizationId) {
        const e = new Error('Unauthorized: Admin privileges required.');
        e.code = '42501';
        throw e;
      }
      const cleanSearch = String(search || '').trim().toLowerCase();
      const filtered = store
        .filter((b) => b.organization_id === session.organizationId)
        .filter((b) => !cleanSearch || b.name.toLowerCase().includes(cleanSearch))
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

      const safePage = Math.max(1, Number(page) || 1);
      const safeSize = Math.min(Math.max(1, Number(pageSize) || 10), 50);
      const start = (safePage - 1) * safeSize;
      const items = filtered.slice(start, start + safeSize).map((b) => ({
        ...b,
        line_count: b.lines.length
      }));
      return {
        items,
        total_count: filtered.length,
        page: safePage,
        page_size: safeSize
      };
    },

    async get({ batchId, session }) {
      if (!session?.id || !session?.organizationId) {
        const e = new Error('Unauthorized: Admin privileges required.');
        e.code = '42501';
        throw e;
      }
      const found = store.find((b) => b.id === batchId && b.organization_id === session.organizationId);
      if (!found) {
        const e = new Error('Batch not found or belongs to another organization.');
        e.code = 'P0002';
        throw e;
      }
      return { batch: found, lines: found.lines };
    },

    async save({ batchId = null, payload, expectedUpdatedAt = null, session }) {
      if (!session?.id || !session?.organizationId) {
        const e = new Error('Unauthorized: Admin privileges required.');
        e.code = '42501';
        throw e;
      }
      const calc = recomputeTotals(payload);
      const nowIso = new Date().toISOString();

      if (!batchId) {
        const newId = `batch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const newBatch = {
          id: newId,
          organization_id: session.organizationId,
          created_by: session.id,
          name: payload.name,
          quantity: payload.quantity,
          profit_percent: payload.profitPercent,
          setup_total: Number(calc.setupTotalRupees.toFixed(2)),
          per_saree_total: Number(calc.perSareeUnitTotalRupees.toFixed(2)),
          total_money_needed: Number(calc.totalMoneyRupees.toFixed(2)),
          cost_per_saree: Number(calc.costOfOneSareeRupees.toFixed(2)),
          estimated_selling_price: calc.sellingPriceRupees !== null ? Number(calc.sellingPriceRupees.toFixed(2)) : null,
          created_at: nowIso,
          updated_at: nowIso,
          lines: payload.lines.map((l, idx) => ({
            id: `line-${newId}-${idx}`,
            batch_id: newId,
            organization_id: session.organizationId,
            name: l.name,
            kind: l.kind,
            amount: Number(l.amount.toFixed(2)),
            sort_order: idx,
            created_at: nowIso,
            updated_at: nowIso
          }))
        };
        store.unshift(newBatch);
        return { batch: newBatch, lines: newBatch.lines };
      }

      const existingIdx = store.findIndex((b) => b.id === batchId);
      if (existingIdx < 0 || store[existingIdx].organization_id !== session.organizationId) {
        const e = new Error('Batch not found or belongs to another organization.');
        e.code = 'P0002';
        throw e;
      }

      const current = store[existingIdx];
      if (expectedUpdatedAt && current.updated_at !== expectedUpdatedAt) {
        const e = new Error('CONFLICT: This batch has been updated elsewhere. Refresh it before saving your changes.');
        e.code = '40001';
        throw e;
      }

      const nextUpdatedIso = new Date(Math.max(Date.now(), new Date(current.updated_at).getTime() + 1)).toISOString();
      const updated = {
        ...current,
        name: payload.name,
        quantity: payload.quantity,
        profit_percent: payload.profitPercent,
        setup_total: Number(calc.setupTotalRupees.toFixed(2)),
        per_saree_total: Number(calc.perSareeUnitTotalRupees.toFixed(2)),
        total_money_needed: Number(calc.totalMoneyRupees.toFixed(2)),
        cost_per_saree: Number(calc.costOfOneSareeRupees.toFixed(2)),
        estimated_selling_price: calc.sellingPriceRupees !== null ? Number(calc.sellingPriceRupees.toFixed(2)) : null,
        updated_at: nextUpdatedIso,
        lines: payload.lines.map((l, idx) => ({
          id: `line-${batchId}-${Date.now()}-${idx}`,
          batch_id: batchId,
          organization_id: session.organizationId,
          name: l.name,
          kind: l.kind,
          amount: Number(l.amount.toFixed(2)),
          sort_order: idx,
          created_at: current.created_at,
          updated_at: nextUpdatedIso
        }))
      };
      store[existingIdx] = updated;
      return { batch: updated, lines: updated.lines };
    },

    async remove({ batchId, session }) {
      if (!session?.id || !session?.organizationId) {
        const e = new Error('Unauthorized: Admin privileges required.');
        e.code = '42501';
        throw e;
      }
      const idx = store.findIndex((b) => b.id === batchId && b.organization_id === session.organizationId);
      if (idx < 0) {
        const e = new Error('Batch not found or belongs to another organization.');
        e.code = 'P0002';
        throw e;
      }
      store.splice(idx, 1);
      return { success: true, id: batchId };
    }
  };
}

const defaultMemoryRepo = createMemoryBatchRepository();

async function resolveVerifiedSession(injectedSession = null) {
  if (injectedSession?.id && injectedSession?.organizationId) {
    return injectedSession;
  }
  const session = await authService.getCurrentSession();
  if (!session?.id) {
    return null;
  }
  return {
    ...session,
    organizationId: session.organizationId || '11111111-1111-4111-8111-111111111111'
  };
}

export const moneyPlannerService = {
  async listBatches({ search = '', page = 1, pageSize = 10, _testRepo = null, _testSession = null } = {}) {
    const verifiedSession = await resolveVerifiedSession(_testSession);
    if (!verifiedSession) {
      throw new Error('Administrator sign-in is required to view saved batches.');
    }

    if (isSupabaseConfigured && supabase && !_testRepo) {
      try {
        const { data, error } = await supabase.rpc('list_money_batches', {
          p_search: String(search || '').trim(),
          p_page: Math.max(1, Number(page) || 1),
          p_page_size: Math.min(Math.max(1, Number(pageSize) || 10), 50)
        });
        if (error) throw error;
        const rows = Array.isArray(data?.items) ? data.items : [];
        return {
          items: rows.map((row) => hydrateBatchRecord(row, [])),
          totalCount: Number(data?.total_count ?? rows.length),
          page: Number(data?.page ?? page),
          pageSize: Number(data?.page_size ?? pageSize)
        };
      } catch (err) {
        throw mapMoneyPlannerError(err, 'Unable to load saved batches. Please try again.');
      }
    }

    const repo = _testRepo || defaultMemoryRepo;
    try {
      const data = await repo.list({ search, page, pageSize, session: verifiedSession });
      return {
        items: (data.items || []).map((row) => hydrateBatchRecord(row, [])),
        totalCount: Number(data.total_count ?? 0),
        page: Number(data.page ?? page),
        pageSize: Number(data.page_size ?? pageSize)
      };
    } catch (err) {
      throw mapMoneyPlannerError(err, 'Unable to load saved batches. Please try again.');
    }
  },

  async getBatch(batchId, { _testRepo = null, _testSession = null } = {}) {
    const verifiedSession = await resolveVerifiedSession(_testSession);
    if (!verifiedSession) {
      throw new Error('Administrator sign-in is required to open a batch.');
    }
    if (!batchId) {
      throw new Error('Missing batch identifier.');
    }

    if (isSupabaseConfigured && supabase && !_testRepo) {
      try {
        const { data, error } = await supabase.rpc('get_money_batch', {
          p_batch_id: batchId
        });
        if (error) throw error;
        if (!data?.batch) {
          throw new Error('Batch not found.');
        }
        return hydrateBatchRecord(data.batch, data.lines || []);
      } catch (err) {
        throw mapMoneyPlannerError(err, 'Could not open this batch. Please try again.');
      }
    }

    const repo = _testRepo || defaultMemoryRepo;
    try {
      const data = await repo.get({ batchId, session: verifiedSession });
      return hydrateBatchRecord(data.batch, data.lines || []);
    } catch (err) {
      throw mapMoneyPlannerError(err, 'Could not open this batch. Please try again.');
    }
  },

  async saveBatch(draft, { _testRepo = null, _testSession = null } = {}) {
    const verifiedSession = await resolveVerifiedSession(_testSession);
    if (!verifiedSession) {
      throw new Error('Administrator sign-in is required to save batches.');
    }

    const validation = validateBatchForSave({
      name: draft?.name,
      quantity: draft?.quantity,
      setupLines: draft?.setupLines,
      perSareeLines: draft?.perSareeLines,
      profitPercent: draft?.profitPercent
    });

    if (!validation.valid) {
      throw new Error(validation.errors[0] || 'Please fix the highlighted fields before saving.');
    }

    const { payload } = validation;
    const rpcLines = payload.lines.map((line, index) => ({
      name: line.name,
      kind: line.kind,
      amount: line.amount.toFixed(2),
      sort_order: index
    }));

    if (isSupabaseConfigured && supabase && !_testRepo) {
      try {
        const { data, error } = await supabase.rpc('save_money_batch_atomic', {
          p_batch_id: draft?.id || null,
          p_name: payload.name,
          p_quantity: payload.quantity,
          p_profit_percent: payload.profitPercent !== null ? Number(payload.profitPercent.toFixed(2)) : null,
          p_lines: rpcLines,
          p_expected_updated_at: draft?.id ? (draft.updatedAt || null) : null
        });
        if (error) throw error;
        if (!data?.batch) {
          throw new Error('Your batch could not be saved. Please try again.');
        }
        return hydrateBatchRecord(data.batch, data.lines || []);
      } catch (err) {
        throw mapMoneyPlannerError(err, 'Your batch could not be saved. Please try again.');
      }
    }

    const repo = _testRepo || defaultMemoryRepo;
    try {
      const data = await repo.save({
        batchId: draft?.id || null,
        payload,
        expectedUpdatedAt: draft?.id ? (draft.updatedAt || null) : null,
        session: verifiedSession
      });
      return hydrateBatchRecord(data.batch, data.lines || []);
    } catch (err) {
      throw mapMoneyPlannerError(err, 'Your batch could not be saved. Please try again.');
    }
  },

  async deleteBatch(batchId, { _testRepo = null, _testSession = null } = {}) {
    const verifiedSession = await resolveVerifiedSession(_testSession);
    if (!verifiedSession) {
      throw new Error('Administrator sign-in is required to delete a batch.');
    }
    if (!batchId) {
      throw new Error('Missing batch identifier.');
    }

    if (isSupabaseConfigured && supabase && !_testRepo) {
      try {
        const { data, error } = await supabase.rpc('delete_money_batch', {
          p_batch_id: batchId
        });
        if (error) throw error;
        return { success: Boolean(data?.success ?? true), id: batchId };
      } catch (err) {
        throw mapMoneyPlannerError(err, 'Could not delete this batch. Please try again.');
      }
    }

    const repo = _testRepo || defaultMemoryRepo;
    try {
      return await repo.remove({ batchId, session: verifiedSession });
    } catch (err) {
      throw mapMoneyPlannerError(err, 'Could not delete this batch. Please try again.');
    }
  }
};
