/**
 * RODHE CRM — Money Planner Calculation Engine
 * Independent, framework-agnostic, integer-paise precision financial math.
 * Avoids floating-point drift, NaN, Infinity, undefined, or negative zero.
 */

export const DEFAULT_BATCH_QUANTITY = 30;
export const MAX_BATCH_QUANTITY = 100000;
export const MAX_LINE_RUPEES = 10000000; // ₹1,00,00,000 (1 Crore) per single line
export const MAX_LINE_PAISE = MAX_LINE_RUPEES * 100;
export const MAX_EXPENSE_LINES_PER_SECTION = 40;
export const MAX_TOTAL_LINES = 80;
export const MAX_PROFIT_PERCENT = 1000;
export const MAX_BATCH_NAME_LENGTH = 120;
export const MAX_COST_NAME_LENGTH = 80;

export const QUICK_ADD_SUGGESTIONS = [
  { label: 'Labour', defaultKind: 'per_saree' },
  { label: 'Dyeing', defaultKind: 'per_saree' },
  { label: 'Block printing', defaultKind: 'per_saree' },
  { label: 'Packing', defaultKind: 'per_saree' },
  { label: 'Transport', defaultKind: 'setup' },
  { label: 'Other', defaultKind: 'per_saree' }
];

export const DEFAULT_SETUP_LINES = [
  { id: 'setup-initial', name: 'Initial investment / setup', amount: '', kind: 'setup' }
];

export const DEFAULT_PER_SAREE_LINES = [
  { id: 'saree-material', name: 'Material', amount: '', kind: 'per_saree' },
  { id: 'saree-rolling', name: 'Rolling (saree hem finishing)', amount: '', kind: 'per_saree' },
  { id: 'saree-processing', name: 'Processing', amount: '', kind: 'per_saree' }
];

export function createPlannerLine(name = '', kind = 'per_saree', amount = '') {
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  return {
    id: `${kind}-${Date.now()}-${randomSuffix}`,
    name: String(name || ''),
    amount: amount === undefined || amount === null ? '' : String(amount),
    kind: kind === 'setup' ? 'setup' : 'per_saree'
  };
}

export function createBlankBatchDraft() {
  return {
    id: null,
    name: '',
    quantity: String(DEFAULT_BATCH_QUANTITY),
    profitPercent: '',
    setupLines: [createPlannerLine('Initial investment / setup', 'setup', '')],
    perSareeLines: [
      createPlannerLine('Material', 'per_saree', ''),
      createPlannerLine('Rolling (saree hem finishing)', 'per_saree', ''),
      createPlannerLine('Processing', 'per_saree', '')
    ],
    updatedAt: null,
    isTemplateCopy: false
  };
}

/**
 * Validates batch quantity (whole numbers, >= 1, <= MAX_BATCH_QUANTITY).
 */
export function validateQuantityInput(rawQuantity) {
  if (rawQuantity === null || rawQuantity === undefined) {
    return { valid: false, quantity: 0, error: 'Please enter a number.' };
  }
  const str = String(rawQuantity).trim();
  if (!str) {
    return { valid: false, quantity: 0, error: 'Please enter a number.' };
  }
  if (/^-\d/.test(str)) {
    return { valid: false, quantity: 0, error: 'Quantity must be at least 1.' };
  }
  if (/^\d+\.\d+$/.test(str)) {
    return { valid: false, quantity: 0, error: 'Please enter a whole number without decimals.' };
  }
  if (!/^\d+$/.test(str)) {
    return { valid: false, quantity: 0, error: 'Please enter a number.' };
  }
  const num = Number.parseInt(str, 10);
  if (!Number.isSafeInteger(num) || num < 1) {
    return { valid: false, quantity: 0, error: 'Quantity must be at least 1.' };
  }
  if (num > MAX_BATCH_QUANTITY) {
    return {
      valid: false,
      quantity: 0,
      error: `Quantity cannot exceed ${formatIndianInteger(MAX_BATCH_QUANTITY)} sarees in one batch.`
    };
  }
  return { valid: true, quantity: num, error: '' };
}

/**
 * Parses a numeric/string rupee input directly into exact integer paise (zero float drift).
 * Blank inputs normalize safely to 0 paise.
 */
export function parseRupeesToPaise(rawAmount) {
  if (rawAmount === null || rawAmount === undefined) {
    return { valid: true, paise: 0, rupees: 0, isEmpty: true, error: '' };
  }
  const normalized = String(rawAmount).replace(/,/g, '').trim();
  if (normalized === '') {
    return { valid: true, paise: 0, rupees: 0, isEmpty: true, error: '' };
  }
  if (normalized.startsWith('-')) {
    return { valid: false, paise: 0, rupees: 0, isEmpty: false, error: 'Amount cannot be negative.' };
  }
  if (!/^\d+(?:\.\d*)?$/.test(normalized)) {
    return { valid: false, paise: 0, rupees: 0, isEmpty: false, error: 'Please enter a valid number.' };
  }

  const parts = normalized.split('.');
  const wholeStr = parts[0] || '0';
  const fracStr = parts[1] ?? '';

  if (fracStr.length > 2) {
    return {
      valid: false,
      paise: 0,
      rupees: 0,
      isEmpty: false,
      error: 'Use at most two decimal places (for example, 150.50).'
    };
  }

  if (wholeStr.length > 10) {
    return {
      valid: false,
      paise: 0,
      rupees: 0,
      isEmpty: false,
      error: `Maximum amount is ${formatPaiseCurrency(MAX_LINE_PAISE)} per line.`
    };
  }

  const whole = Number.parseInt(wholeStr, 10);
  const fracPadded = (fracStr + '00').slice(0, 2);
  const paiseFraction = Number.parseInt(fracPadded, 10);
  const totalPaise = whole * 100 + paiseFraction;

  if (!Number.isSafeInteger(totalPaise) || totalPaise > MAX_LINE_PAISE) {
    return {
      valid: false,
      paise: 0,
      rupees: 0,
      isEmpty: false,
      error: `Maximum amount is ${formatPaiseCurrency(MAX_LINE_PAISE)} per line.`
    };
  }

  return {
    valid: true,
    paise: totalPaise,
    rupees: totalPaise / 100,
    isEmpty: false,
    error: ''
  };
}

/**
 * Parses profit percentage (markup on cost, >= 0, <= MAX_PROFIT_PERCENT, max 2 decimals)
 * into basis points (100 = 1.00%). Blank is optional/unconfigured.
 */
export function validateProfitPercentInput(rawProfit) {
  if (rawProfit === null || rawProfit === undefined) {
    return { valid: true, hasValue: false, percent: null, basisPoints: 0, error: '' };
  }
  const clean = String(rawProfit).replace(/%/g, '').trim();
  if (clean === '') {
    return { valid: true, hasValue: false, percent: null, basisPoints: 0, error: '' };
  }
  if (clean.startsWith('-')) {
    return {
      valid: false,
      hasValue: true,
      percent: null,
      basisPoints: 0,
      error: 'Profit percentage cannot be negative.'
    };
  }
  if (!/^\d+(?:\.\d*)?$/.test(clean)) {
    return {
      valid: false,
      hasValue: true,
      percent: null,
      basisPoints: 0,
      error: 'Please enter a valid number for profit percentage.'
    };
  }
  const parts = clean.split('.');
  const frac = parts[1] ?? '';
  if (frac.length > 2) {
    return {
      valid: false,
      hasValue: true,
      percent: null,
      basisPoints: 0,
      error: 'Use at most two decimal places for profit percentage.'
    };
  }
  const whole = Number.parseInt(parts[0] || '0', 10);
  const fracBps = Number.parseInt((frac + '00').slice(0, 2), 10);
  const basisPoints = whole * 100 + fracBps;

  if (!Number.isSafeInteger(basisPoints) || basisPoints > MAX_PROFIT_PERCENT * 100) {
    return {
      valid: false,
      hasValue: true,
      percent: null,
      basisPoints: 0,
      error: `Profit percentage cannot exceed ${MAX_PROFIT_PERCENT}%.`
    };
  }
  return {
    valid: true,
    hasValue: true,
    percent: basisPoints / 100,
    basisPoints,
    error: ''
  };
}

/**
 * Half-up integer division for positive paise values (guarantees zero float rounding error).
 */
export function divideRoundHalfUp(numeratorPaise, divisor) {
  if (!Number.isFinite(divisor) || divisor <= 0 || !Number.isFinite(numeratorPaise) || numeratorPaise <= 0) {
    return 0;
  }
  const n = Math.trunc(numeratorPaise);
  const d = Math.trunc(divisor);
  const quotient = Math.floor(n / d);
  const remainder = n % d;
  return remainder * 2 >= d ? quotient + 1 : quotient;
}

export function formatIndianInteger(intVal) {
  const safe = Number.isFinite(intVal) ? Math.max(0, Math.trunc(intVal)) : 0;
  return new Intl.NumberFormat('en-IN').format(safe);
}

/**
 * Formats integer paise in unmistakable Indian grouping (e.g. "Rs 1,23,456.50" or "₹1,23,456.50").
 * Uses pure integer split so 0 / negative zero never glitches.
 */
export function formatPaiseCurrency(paise, { symbol = 'Rs ', showZeroDecimals = true } = {}) {
  const numeric = Number(paise);
  const safePaise = Number.isFinite(numeric) && numeric > 0 ? Math.trunc(numeric) : 0;
  const rupeesPart = Math.floor(safePaise / 100);
  const paisePart = safePaise % 100;
  const formattedWhole = formatIndianInteger(rupeesPart);
  if (!showZeroDecimals && paisePart === 0) {
    return `${symbol}${formattedWhole}`;
  }
  return `${symbol}${formattedWhole}.${String(paisePart).padStart(2, '0')}`;
}

export function formatPaiseForSentence(paise, symbol = 'Rs ') {
  const safePaise = Number.isFinite(paise) && paise > 0 ? Math.trunc(paise) : 0;
  const hasPaise = safePaise % 100 !== 0;
  return formatPaiseCurrency(safePaise, { symbol, showZeroDecimals: hasPaise });
}

export function formatSharePercentage(percentValue, decimals = 1) {
  const num = Number(percentValue);
  if (!Number.isFinite(num) || num <= 0) return '0%';
  const rounded = num.toFixed(decimals);
  return `${rounded.endsWith('.0') && decimals === 1 ? rounded.slice(0, -2) : rounded}%`;
}

/**
 * Core Financial Engine: single source of truth for Money Planner totals,
 * per-saree cost, breakdown shares, cost split, biggest expense(s), and selling estimate.
 */
export function calculateMoneyBatch({
  quantity: rawQuantity,
  setupLines = [],
  perSareeLines = [],
  profitPercent = null
}) {
  const qtyValidation = validateQuantityInput(rawQuantity);
  const effectiveQty = qtyValidation.valid ? qtyValidation.quantity : 0;

  let hasLineError = false;
  const normalizedSetup = (Array.isArray(setupLines) ? setupLines : []).map((line, index) => {
    const parsed = parseRupeesToPaise(line?.amount);
    if (!parsed.valid) hasLineError = true;
    const rawName = String(line?.name ?? '').trim();
    const displayName = rawName || `One-time cost ${index + 1}`;
    const paise = parsed.valid ? parsed.paise : 0;
    return {
      id: line?.id || `setup-${index}`,
      name: rawName,
      displayName,
      kind: 'setup',
      sortOrder: index,
      rawAmount: line?.amount ?? '',
      amountPaise: paise,
      amountRupees: paise / 100,
      contributionPaise: paise,
      contributionRupees: paise / 100,
      isValidAmount: parsed.valid,
      amountError: parsed.error
    };
  });

  const normalizedPerSaree = (Array.isArray(perSareeLines) ? perSareeLines : []).map((line, index) => {
    const parsed = parseRupeesToPaise(line?.amount);
    if (!parsed.valid) hasLineError = true;
    const rawName = String(line?.name ?? '').trim();
    const displayName = rawName || `Per-saree cost ${index + 1}`;
    const unitPaise = parsed.valid ? parsed.paise : 0;
    const contributionPaise = unitPaise * effectiveQty;
    return {
      id: line?.id || `per_saree-${index}`,
      name: rawName,
      displayName,
      kind: 'per_saree',
      sortOrder: index,
      rawAmount: line?.amount ?? '',
      amountPaise: unitPaise,
      amountRupees: unitPaise / 100,
      contributionPaise,
      contributionRupees: contributionPaise / 100,
      isValidAmount: parsed.valid,
      amountError: parsed.error
    };
  });

  const setupTotalPaise = normalizedSetup.reduce((acc, item) => acc + item.amountPaise, 0);
  const perSareeUnitTotalPaise = normalizedPerSaree.reduce((acc, item) => acc + item.amountPaise, 0);
  const perSareeBatchTotalPaise = perSareeUnitTotalPaise * effectiveQty;
  const totalMoneyPaise = setupTotalPaise + perSareeBatchTotalPaise;
  const costOfOneSareePaise = effectiveQty > 0 ? divideRoundHalfUp(totalMoneyPaise, effectiveQty) : 0;

  // Compute sorted expense breakdown (descending contribution, preserving original order on tie)
  const allItems = [...normalizedSetup, ...normalizedPerSaree].map((item) => {
    const sharePercent = totalMoneyPaise > 0 && effectiveQty > 0
      ? (item.contributionPaise / totalMoneyPaise) * 100
      : (totalMoneyPaise > 0 && item.kind === 'setup' ? (item.contributionPaise / totalMoneyPaise) * 100 : 0);
    return {
      ...item,
      sharePercent
    };
  });

  const positiveItems = allItems.filter((item) => item.contributionPaise > 0);
  const maxContributionPaise = positiveItems.reduce(
    (max, item) => (item.contributionPaise > max ? item.contributionPaise : max),
    0
  );
  const tieCount = maxContributionPaise > 0
    ? positiveItems.filter((item) => item.contributionPaise === maxContributionPaise).length
    : 0;

  const sortedBreakdown = [...allItems]
    .sort((a, b) => {
      if (b.contributionPaise !== a.contributionPaise) {
        return b.contributionPaise - a.contributionPaise;
      }
      if (a.kind !== b.kind) {
        return a.kind === 'per_saree' ? -1 : 1;
      }
      return a.sortOrder - b.sortOrder;
    })
    .map((item) => ({
      ...item,
      isBiggestExpense: maxContributionPaise > 0 && item.contributionPaise === maxContributionPaise,
      isBiggestTie: maxContributionPaise > 0 && item.contributionPaise === maxContributionPaise && tieCount > 1
    }));

  const setupSharePercent = totalMoneyPaise > 0 ? (setupTotalPaise / totalMoneyPaise) * 100 : 0;
  const perSareeSharePercent = totalMoneyPaise > 0 ? (perSareeBatchTotalPaise / totalMoneyPaise) * 100 : 0;

  // Selling price calculator (markup on cost)
  const profitValidation = validateProfitPercentInput(profitPercent);
  let sellingPricePaise = null;
  let profitPerSareePaise = null;
  if (profitValidation.valid && profitValidation.hasValue && effectiveQty > 0 && totalMoneyPaise > 0) {
    sellingPricePaise = divideRoundHalfUp(
      costOfOneSareePaise * (10000 + profitValidation.basisPoints),
      10000
    );
    profitPerSareePaise = sellingPricePaise - costOfOneSareePaise;
  } else if (profitValidation.valid && profitValidation.hasValue && effectiveQty > 0) {
    sellingPricePaise = 0;
    profitPerSareePaise = 0;
  }

  const biggestExpenses = sortedBreakdown.filter((item) => item.isBiggestExpense);
  const hasAnyPositiveCost = totalMoneyPaise > 0;

  const plainEnglishSummary = !qtyValidation.valid
    ? qtyValidation.error
    : !hasAnyPositiveCost
      ? 'Add your first cost to see how much money you need.'
      : `To make ${formatIndianInteger(effectiveQty)} ${effectiveQty === 1 ? 'saree' : 'sarees'}, you need ${formatPaiseForSentence(totalMoneyPaise, '₹')}. Each saree costs you ${formatPaiseForSentence(costOfOneSareePaise, '₹')}.`;

  return {
    isValid: qtyValidation.valid && !hasLineError && profitValidation.valid,
    quantityValidation: qtyValidation,
    profitValidation,
    quantity: effectiveQty,
    hasAnyPositiveCost,
    hasLineError,
    setupTotalPaise,
    setupTotalRupees: setupTotalPaise / 100,
    perSareeUnitTotalPaise,
    perSareeUnitTotalRupees: perSareeUnitTotalPaise / 100,
    perSareeBatchTotalPaise,
    perSareeBatchTotalRupees: perSareeBatchTotalPaise / 100,
    totalMoneyPaise,
    totalMoneyRupees: totalMoneyPaise / 100,
    costOfOneSareePaise,
    costOfOneSareeRupees: costOfOneSareePaise / 100,
    setupSharePercent,
    perSareeSharePercent,
    setupLines: normalizedSetup,
    perSareeLines: normalizedPerSaree,
    breakdown: sortedBreakdown,
    biggestExpenses,
    biggestExpenseTieCount: tieCount,
    sellingPricePaise,
    sellingPriceRupees: sellingPricePaise !== null ? sellingPricePaise / 100 : null,
    profitPerSareePaise,
    profitPerSareeRupees: profitPerSareePaise !== null ? profitPerSareePaise / 100 : null,
    plainEnglishSummary
  };
}

/**
 * Validates and prepares a clean batch payload for backend persistence / verification.
 */
export function validateBatchForSave({
  name,
  quantity,
  setupLines = [],
  perSareeLines = [],
  profitPercent = null
}) {
  const errors = [];
  const trimmedName = String(name || '').trim();
  if (!trimmedName) {
    errors.push('Please enter a batch name (for example, December Mulmul Collection).');
  } else if (trimmedName.length > MAX_BATCH_NAME_LENGTH) {
    errors.push(`Batch name cannot exceed ${MAX_BATCH_NAME_LENGTH} characters.`);
  }

  const qtyResult = validateQuantityInput(quantity);
  if (!qtyResult.valid) {
    errors.push(qtyResult.error);
  }

  const totalLineCount = (setupLines?.length || 0) + (perSareeLines?.length || 0);
  if (totalLineCount > MAX_TOTAL_LINES) {
    errors.push(`You can add at most ${MAX_TOTAL_LINES} cost lines per batch.`);
  }

  const profitResult = validateProfitPercentInput(profitPercent);
  if (!profitResult.valid) {
    errors.push(profitResult.error);
  }

  const sanitizedLines = [];
  const validateGroup = (lines, kind) => {
    lines.forEach((line, idx) => {
      const lineName = String(line?.name ?? '').trim();
      const parsedAmount = parseRupeesToPaise(line?.amount);
      if (!parsedAmount.valid) {
        errors.push(`${lineName || 'Cost line'}: ${parsedAmount.error}`);
        return;
      }
      if (lineName.length > MAX_COST_NAME_LENGTH) {
        errors.push(`Cost name "${lineName.slice(0, 24)}..." cannot exceed ${MAX_COST_NAME_LENGTH} characters.`);
        return;
      }
      // Skip completely blank optional rows (empty name AND empty/zero amount),
      // while preserving named zero rows or priced unnamed rows so user choices persist cleanly.
      const isBlankOptionalRow = !lineName && parsedAmount.isEmpty;
      if (!isBlankOptionalRow) {
        sanitizedLines.push({
          name: lineName || (kind === 'setup' ? `One-time cost ${idx + 1}` : `Per-saree cost ${idx + 1}`),
          kind,
          amount: Number((parsedAmount.paise / 100).toFixed(2)),
          amountPaise: parsedAmount.paise,
          sortOrder: sanitizedLines.length
        });
      }
    });
  };

  validateGroup(Array.isArray(setupLines) ? setupLines : [], 'setup');
  validateGroup(Array.isArray(perSareeLines) ? perSareeLines : [], 'per_saree');

  const computed = calculateMoneyBatch({
    quantity: qtyResult.valid ? qtyResult.quantity : 1,
    setupLines: sanitizedLines.filter((l) => l.kind === 'setup').map((l) => ({ ...l, amount: l.amount.toFixed(2) })),
    perSareeLines: sanitizedLines.filter((l) => l.kind === 'per_saree').map((l) => ({ ...l, amount: l.amount.toFixed(2) })),
    profitPercent: profitResult.hasValue ? profitResult.percent : null
  });

  return {
    valid: errors.length === 0,
    errors,
    payload: {
      name: trimmedName,
      quantity: qtyResult.quantity,
      profitPercent: profitResult.hasValue ? profitResult.percent : null,
      lines: sanitizedLines,
      computed
    }
  };
}

/**
 * Canonical snapshot serializer used for reliable dirty-state comparison.
 */
export function getBatchSnapshotKey(draft) {
  if (!draft) return '';
  const normalizeRows = (rows) =>
    (Array.isArray(rows) ? rows : []).map((row) => ({
      name: String(row?.name ?? '').trim(),
      amount: String(row?.amount ?? '').trim()
    }));
  return JSON.stringify({
    name: String(draft.name ?? '').trim(),
    quantity: String(draft.quantity ?? '').trim(),
    profitPercent: String(draft.profitPercent ?? '').trim(),
    setupLines: normalizeRows(draft.setupLines),
    perSareeLines: normalizeRows(draft.perSareeLines)
  });
}
