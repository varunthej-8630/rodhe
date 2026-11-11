/**
 * RODHE CRM — Money Planner Exports (Formula-Safe Excel/CSV & Multi-Page Vector PDF 1.4)
 * Pure client-side generators with zero external dependencies and zero PII leakage.
 */

import {
  calculateMoneyBatch,
  formatIndianInteger,
  formatPaiseCurrency,
  formatSharePercentage
} from './moneyPlannerCalc.js';

const FORMULA_INJECTION_REGEX = /^[\s\t\r\n]*[=+\-@]/;

/**
 * Neutralizes spreadsheet formula injection (=, +, -, @, leading control chars)
 * on text cells while leaving clean numeric fields untouched.
 */
export function sanitizeCsvTextCell(value) {
  const raw = String(value ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const neutralized = FORMULA_INJECTION_REGEX.test(raw) ? `'${raw}` : raw;
  if (/[",\n]/.test(neutralized)) {
    return `"${neutralized.replace(/"/g, '""')}"`;
  }
  return neutralized;
}

export function sanitizeCsvNumericCell(numValue, decimals = 2) {
  const num = Number(numValue);
  if (!Number.isFinite(num) || num < 0) return (0).toFixed(decimals);
  return num.toFixed(decimals);
}

export function buildSafeFilename(batchName, ext) {
  const base = String(batchName || 'rodhe-batch-estimate')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  const stamp = new Date().toISOString().slice(0, 10);
  return `rodhe-money-planner-${base || 'batch'}-${stamp}.${ext}`;
}

/**
 * Builds Excel-friendly UTF-8 CSV with numeric columns, formula-injection safety,
 * and complete summary rows at the bottom.
 */
export function buildMoneyPlannerCsv({
  batchName,
  quantity,
  setupLines = [],
  perSareeLines = [],
  profitPercent = null
}) {
  const calc = calculateMoneyBatch({ quantity, setupLines, perSareeLines, profitPercent });
  const safeBatchName = String(batchName || 'Untitled Batch').trim() || 'Untitled Batch';

  const header = [
    'Batch name',
    'Quantity',
    'Cost name',
    'Cost type',
    'Amount per unit (INR)',
    'Total contribution (INR)',
    'Percentage share (%)'
  ].map(sanitizeCsvTextCell).join(',');

  const rows = [header];

  calc.breakdown.forEach((item) => {
    const unitAmount = item.amountRupees;
    const costTypeLabel = item.kind === 'setup' ? 'Spent once (setup)' : 'Spent on every saree';
    const costName = item.isBiggestExpense
      ? `${item.displayName} (Biggest expense)`
      : item.displayName;

    rows.push([
      sanitizeCsvTextCell(safeBatchName),
      String(calc.quantity),
      sanitizeCsvTextCell(costName),
      sanitizeCsvTextCell(costTypeLabel),
      sanitizeCsvNumericCell(unitAmount, 2),
      sanitizeCsvNumericCell(item.contributionRupees, 2),
      sanitizeCsvNumericCell(item.sharePercent, 2)
    ].join(','));
  });

  rows.push('');
  rows.push([sanitizeCsvTextCell('BATCH SUMMARY'), sanitizeCsvTextCell('Metric'), sanitizeCsvTextCell('Amount / Value (INR or %)')].join(','));
  rows.push([sanitizeCsvTextCell(safeBatchName), sanitizeCsvTextCell('Number of sarees'), String(calc.quantity)].join(','));
  rows.push([sanitizeCsvTextCell(safeBatchName), sanitizeCsvTextCell('Setup total (INR)'), sanitizeCsvNumericCell(calc.setupTotalRupees, 2)].join(','));
  rows.push([sanitizeCsvTextCell(safeBatchName), sanitizeCsvTextCell('Per-saree total per unit (INR)'), sanitizeCsvNumericCell(calc.perSareeUnitTotalRupees, 2)].join(','));
  rows.push([sanitizeCsvTextCell(safeBatchName), sanitizeCsvTextCell('Per-saree money for batch (INR)'), sanitizeCsvNumericCell(calc.perSareeBatchTotalRupees, 2)].join(','));
  rows.push([sanitizeCsvTextCell(safeBatchName), sanitizeCsvTextCell('Total money required (INR)'), sanitizeCsvNumericCell(calc.totalMoneyRupees, 2)].join(','));
  rows.push([sanitizeCsvTextCell(safeBatchName), sanitizeCsvTextCell('Cost of one saree (INR)'), sanitizeCsvNumericCell(calc.costOfOneSareeRupees, 2)].join(','));
  rows.push([
    sanitizeCsvTextCell(safeBatchName),
    sanitizeCsvTextCell('Biggest expense'),
    sanitizeCsvTextCell(
      calc.biggestExpenses.length > 0
        ? calc.biggestExpenses.map((b) => `${b.displayName} (Rs ${sanitizeCsvNumericCell(b.contributionRupees, 2)})`).join(' & ')
        : 'None'
    )
  ].join(','));

  if (calc.sellingPricePaise !== null && calc.profitValidation.hasValue) {
    rows.push([
      sanitizeCsvTextCell(safeBatchName),
      sanitizeCsvTextCell('Profit percentage on cost (%)'),
      sanitizeCsvNumericCell(calc.profitValidation.percent, 2)
    ].join(','));
    rows.push([
      sanitizeCsvTextCell(safeBatchName),
      sanitizeCsvTextCell('Estimated selling price per saree (INR)'),
      sanitizeCsvNumericCell(calc.sellingPriceRupees, 2)
    ].join(','));
    rows.push([
      sanitizeCsvTextCell(safeBatchName),
      sanitizeCsvTextCell('Estimated profit per saree (INR)'),
      sanitizeCsvNumericCell(calc.profitPerSareeRupees, 2)
    ].join(','));
  }

  return rows.join('\r\n');
}

export function downloadMoneyPlannerCsv(params) {
  const csvBody = buildMoneyPlannerCsv(params);
  const bom = '\uFEFF';
  const blob = new Blob([bom, csvBody], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', buildSafeFilename(params?.batchName, 'csv'));
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ============================================================================
// Pure Multi-Page Vector PDF 1.4 Writer (Standard WinAnsi Helvetica Fonts)
// ============================================================================

function toPdfSafeAscii(text) {
  return String(text ?? '')
    .replace(/\u20B9/g, 'Rs ')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapePdfString(text) {
  return toPdfSafeAscii(text)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wrapPdfLines(text, maxChars = 72) {
  const clean = toPdfSafeAscii(text);
  if (!clean) return [''];
  const words = clean.split(' ');
  const lines = [];
  let current = '';

  words.forEach((word) => {
    if (word.length > maxChars) {
      if (current) {
        lines.push(current);
        current = '';
      }
      for (let i = 0; i < word.length; i += maxChars) {
        lines.push(word.slice(i, i + maxChars));
      }
      return;
    }
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  });
  if (current) lines.push(current);
  return lines;
}

/**
 * Generates an A4 multi-page PDF summary document (`Uint8Array` of `%PDF-1.4`)
 * cleanly separating RODHE branding, totals, setup & per-saree lists, breakdown shares,
 * Biggest Expense callout, and optional selling estimate with zero customer/CRM PII.
 */
export function buildMoneyPlannerPdfBytes({
  batchName,
  quantity,
  setupLines = [],
  perSareeLines = [],
  profitPercent = null,
  dateLabel = null
}) {
  const calc = calculateMoneyBatch({ quantity, setupLines, perSareeLines, profitPercent });
  const titleName = String(batchName || 'Untitled Batch').trim() || 'Untitled Batch';
  const generatedDate = dateLabel || new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const marginX = 46;
  const contentWidth = pageWidth - marginX * 2;
  const bottomLimit = 56;

  const pagesOps = [];
  let ops = [];
  let cursorY = 795;

  const startNewPage = () => {
    if (ops.length > 0) {
      pagesOps.push(ops);
    }
    ops = [];
    cursorY = 790;
    // Compact continuation header on page 2+
    ops.push(`0.294 0.188 0.141 rg`);
    ops.push(`BT /F2 9 Tf ${marginX} ${cursorY} Td (${escapePdfString(`RODHE - Batch Cost Summary (${titleName})`)}) Tj ET`);
    ops.push(`0.561 0.447 0.388 rg`);
    ops.push(`BT /F1 8.5 Tf ${pageWidth - marginX - 110} ${cursorY} Td (${escapePdfString(`Date: ${generatedDate}`)}) Tj ET`);
    cursorY -= 12;
    ops.push(`0.722 0.553 0.290 RG 0.8 w ${marginX} ${cursorY} m ${pageWidth - marginX} ${cursorY} l S`);
    cursorY -= 24;
  };

  const ensureSpace = (neededHeight) => {
    if (cursorY - neededHeight < bottomLimit) {
      startNewPage();
    }
  };

  const drawText = (x, y, text, { font = 'F1', size = 10, color = '0.294 0.188 0.141' } = {}) => {
    ops.push(`${color} rg`);
    ops.push(`BT /${font} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${escapePdfString(text)}) Tj ET`);
  };

  const drawRightText = (rightX, y, text, { font = 'F1', size = 10, color = '0.294 0.188 0.141' } = {}) => {
    const safe = toPdfSafeAscii(text);
    const estCharWidth = size * (font === 'F2' ? 0.54 : 0.50);
    const x = Math.max(marginX, rightX - safe.length * estCharWidth);
    drawText(x, y, safe, { font, size, color });
  };

  const drawRect = (x, y, w, h, { fill, stroke, lineWidth = 0.75 } = {}) => {
    if (fill) ops.push(`${fill} rg ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
    if (stroke) ops.push(`${stroke} RG ${lineWidth} w ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S`);
  };

  // --- PAGE 1 HEADER BANNER ---
  drawRect(marginX, 742, contentWidth, 62, { fill: '0.165 0.102 0.075' });
  drawText(marginX + 16, 780, 'RODHE - WOVEN WITH TRUST', { font: 'F2', size: 12.5, color: '0.918 0.855 0.710' });
  drawText(marginX + 16, 761, 'Money Planner | Handcrafted Saree Batch Cost Estimate', { font: 'F1', size: 9.5, color: '0.831 0.675 0.408' });
  drawRightText(pageWidth - marginX - 16, 761, `Date: ${generatedDate}`, { font: 'F1', size: 9, color: '0.918 0.855 0.710' });

  cursorY = 720;

  // --- BATCH NAME & QUANTITY ---
  drawText(marginX, cursorY, 'BATCH PLAN DETAILS', { font: 'F2', size: 8.5, color: '0.722 0.553 0.290' });
  cursorY -= 16;

  const batchNameLines = wrapPdfLines(`Batch: ${titleName}`, 64);
  batchNameLines.forEach((line) => {
    ensureSpace(18);
    drawText(marginX, cursorY, line, { font: 'F2', size: 14, color: '0.294 0.188 0.141' });
    cursorY -= 18;
  });

  drawText(marginX, cursorY, `Sarees to make: ${formatIndianInteger(calc.quantity)} sarees`, {
    font: 'F1',
    size: 10.5,
    color: '0.435 0.306 0.243'
  });
  cursorY -= 22;

  // --- PRIMARY RESULTS SUMMARY BOX ---
  ensureSpace(94);
  const summaryTop = cursorY;
  drawRect(marginX, summaryTop - 84, contentWidth, 84, { fill: '0.980 0.965 0.933', stroke: '0.722 0.553 0.290', lineWidth: 1 });

  drawText(marginX + 14, summaryTop - 20, 'TOTAL MONEY YOU NEED', { font: 'F2', size: 8.5, color: '0.561 0.447 0.388' });
  drawText(marginX + 14, summaryTop - 40, formatPaiseCurrency(calc.totalMoneyPaise, { symbol: 'Rs ' }), {
    font: 'F2',
    size: 15.5,
    color: '0.294 0.188 0.141'
  });

  drawText(marginX + 270, summaryTop - 20, 'COST OF ONE SAREE', { font: 'F2', size: 8.5, color: '0.722 0.553 0.290' });
  drawText(marginX + 270, summaryTop - 40, formatPaiseCurrency(calc.costOfOneSareePaise, { symbol: 'Rs ' }), {
    font: 'F2',
    size: 16.5,
    color: '0.294 0.188 0.141'
  });

  const splitSentence = `Setup money: ${formatPaiseCurrency(calc.setupTotalPaise, { symbol: 'Rs ' })} (${formatSharePercentage(calc.setupSharePercent)})  |  Per-saree money: ${formatPaiseCurrency(calc.perSareeBatchTotalPaise, { symbol: 'Rs ' })} (${formatSharePercentage(calc.perSareeSharePercent)})`;
  drawText(marginX + 14, summaryTop - 68, splitSentence, { font: 'F1', size: 9, color: '0.322 0.357 0.227' });

  cursorY = summaryTop - 104;

  // --- PLAIN-ENGLISH SUMMARY ---
  const summaryLines = wrapPdfLines(calc.plainEnglishSummary, 84);
  summaryLines.forEach((line) => {
    ensureSpace(16);
    drawText(marginX, cursorY, line, { font: 'F2', size: 10, color: '0.294 0.188 0.141' });
    cursorY -= 15;
  });
  cursorY -= 10;

  // --- SECTION HELPER ---
  const drawSectionHeader = (title, subtitle) => {
    ensureSpace(34);
    drawRect(marginX, cursorY - 20, contentWidth, 20, { fill: '0.957 0.925 0.882' });
    drawText(marginX + 8, cursorY - 14, title, { font: 'F2', size: 9.5, color: '0.294 0.188 0.141' });
    if (subtitle) {
      drawRightText(pageWidth - marginX - 8, cursorY - 14, subtitle, { font: 'F1', size: 8.5, color: '0.561 0.447 0.388' });
    }
    cursorY -= 32;
  };

  // --- 1. MONEY YOU SPEND ONCE (SETUP) ---
  drawSectionHeader(
    'MONEY YOU SPEND ONCE (SETUP)',
    `Setup total: ${formatPaiseCurrency(calc.setupTotalPaise, { symbol: 'Rs ' })}`
  );
  if (calc.setupLines.length === 0) {
    ensureSpace(18);
    drawText(marginX + 8, cursorY, 'No one-time setup expenses added.', { font: 'F1', size: 9.5, color: '0.561 0.447 0.388' });
    cursorY -= 18;
  } else {
    calc.setupLines.forEach((line) => {
      const wrapped = wrapPdfLines(line.displayName, 54);
      ensureSpace(wrapped.length * 14 + 6);
      wrapped.forEach((wLine, idx) => {
        drawText(marginX + 8, cursorY, wLine, { font: 'F1', size: 9.5 });
        if (idx === 0) {
          drawRightText(pageWidth - marginX - 8, cursorY, formatPaiseCurrency(line.amountPaise, { symbol: 'Rs ' }), {
            font: 'F2',
            size: 9.5
          });
        }
        cursorY -= 14;
      });
      cursorY -= 2;
    });
  }
  cursorY -= 10;

  // --- 2. MONEY YOU SPEND ON EVERY SAREE ---
  drawSectionHeader(
    'MONEY YOU SPEND ON EVERY SAREE',
    `Per saree: ${formatPaiseCurrency(calc.perSareeUnitTotalPaise, { symbol: 'Rs ' })} | Batch: ${formatPaiseCurrency(calc.perSareeBatchTotalPaise, { symbol: 'Rs ' })}`
  );
  if (calc.perSareeLines.length === 0) {
    ensureSpace(18);
    drawText(marginX + 8, cursorY, 'No per-saree expenses added.', { font: 'F1', size: 9.5, color: '0.561 0.447 0.388' });
    cursorY -= 18;
  } else {
    calc.perSareeLines.forEach((line) => {
      const wrapped = wrapPdfLines(line.displayName, 44);
      ensureSpace(wrapped.length * 14 + 6);
      wrapped.forEach((wLine, idx) => {
        drawText(marginX + 8, cursorY, wLine, { font: 'F1', size: 9.5 });
        if (idx === 0) {
          const amountNote = `${formatPaiseCurrency(line.amountPaise, { symbol: 'Rs ' })} x ${formatIndianInteger(calc.quantity)} = ${formatPaiseCurrency(line.contributionPaise, { symbol: 'Rs ' })}`;
          drawRightText(pageWidth - marginX - 8, cursorY, amountNote, { font: 'F2', size: 9.2 });
        }
        cursorY -= 14;
      });
      cursorY -= 2;
    });
  }
  cursorY -= 12;

  // --- 3. WHERE YOUR MONEY GOES (BREAKDOWN SORTED BY CONTRIBUTION) ---
  const biggestLabel = calc.biggestExpenses.length > 0
    ? `Biggest expense: ${calc.biggestExpenses.map((b) => b.displayName).join(' & ')}`
    : 'No expenses recorded';
  drawSectionHeader('WHERE YOUR MONEY GOES', biggestLabel.slice(0, 52));

  if (calc.breakdown.length === 0) {
    ensureSpace(18);
    drawText(marginX + 8, cursorY, 'Add costs to view expense breakdown.', { font: 'F1', size: 9.5, color: '0.561 0.447 0.388' });
    cursorY -= 18;
  } else {
    calc.breakdown.forEach((item) => {
      const kindTag = item.kind === 'setup' ? 'Spent once (setup)' : 'Spent on every saree';
      const biggestTag = item.isBiggestExpense ? ' [BIGGEST EXPENSE]' : '';
      const wrapped = wrapPdfLines(`${item.displayName} (${kindTag})${biggestTag}`, 50);
      ensureSpace(wrapped.length * 14 + 6);
      wrapped.forEach((wLine, idx) => {
        drawText(marginX + 8, cursorY, wLine, {
          font: item.isBiggestExpense ? 'F2' : 'F1',
          size: 9.2,
          color: item.isBiggestExpense ? '0.620 0.235 0.169' : '0.294 0.188 0.141'
        });
        if (idx === 0) {
          const rightText = `${formatPaiseCurrency(item.contributionPaise, { symbol: 'Rs ' })} (${formatSharePercentage(item.sharePercent)})`;
          drawRightText(pageWidth - marginX - 8, cursorY, rightText, { font: 'F2', size: 9.2 });
        }
        cursorY -= 14;
      });
      cursorY -= 2;
    });
  }

  // --- 4. OPTIONAL ESTIMATED SELLING PRICE ---
  if (calc.sellingPricePaise !== null && calc.profitValidation.hasValue) {
    cursorY -= 10;
    ensureSpace(74);
    const estTop = cursorY;
    drawRect(marginX, estTop - 64, contentWidth, 64, { fill: '0.980 0.965 0.933', stroke: '0.514 0.369 0.278', lineWidth: 0.6 });
    drawText(marginX + 12, estTop - 16, `ESTIMATED SELLING PRICE (PROFIT ${calc.profitValidation.percent}% ON COST)`, {
      font: 'F2',
      size: 8.8,
      color: '0.561 0.447 0.388'
    });
    drawText(
      marginX + 12,
      estTop - 34,
      `Sell each saree at ${formatPaiseCurrency(calc.sellingPricePaise, { symbol: 'Rs ' })} to earn ${formatPaiseCurrency(calc.profitPerSareePaise, { symbol: 'Rs ' })} profit per saree.`,
      { font: 'F2', size: 10, color: '0.294 0.188 0.141' }
    );
    drawText(
      marginX + 12,
      estTop - 52,
      'Note: Estimated markup on manufacturing cost only (excludes GST, marketplace fees, or extra shipping).',
      { font: 'F1', size: 8, color: '0.561 0.447 0.388' }
    );
    cursorY = estTop - 74;
  }

  if (ops.length > 0) {
    pagesOps.push(ops);
  }

  // Add page footer numbers cleanly across all pages
  const totalPages = pagesOps.length;
  pagesOps.forEach((pOps, idx) => {
    const footerY = 26;
    pOps.push(`0.561 0.447 0.388 rg`);
    pOps.push(`BT /F1 8 Tf ${marginX} ${footerY} Td (${escapePdfString('RODHE Internal Cost Estimate - Confidential Batch Plan')}) Tj ET`);
    const pageLabel = `Page ${idx + 1} of ${totalPages}`;
    pOps.push(`BT /F1 8 Tf ${(pageWidth - marginX - 58).toFixed(2)} ${footerY} Td (${escapePdfString(pageLabel)}) Tj ET`);
  });

  // Assemble valid PDF 1.4 object table
  const objects = [];
  const addObject = (body) => {
    objects.push(body);
    return objects.length; // 1-indexed object number
  };

  const fontRegularId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  const fontBoldId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');

  const pageIds = [];
  const pagesTreePlaceholderIdx = objects.length; // reserve index cleanly
  objects.push(null);
  const pagesTreeObjNum = pagesTreePlaceholderIdx + 1;

  pagesOps.forEach((pOps) => {
    const streamData = pOps.join('\n');
    const contentId = addObject(`<< /Length ${streamData.length} >>\nstream\n${streamData}\nendstream`);
    const pageId = addObject(
      `<< /Type /Page /Parent ${pagesTreeObjNum} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>`
    );
    pageIds.push(pageId);
  });

  objects[pagesTreePlaceholderIdx] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
  const catalogObjNum = addObject(`<< /Type /Catalog /Pages ${pagesTreeObjNum} 0 R >>`);

  let pdfStr = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((body, idx) => {
    offsets.push(pdfStr.length);
    pdfStr += `${idx + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefStart = pdfStr.length;
  pdfStr += `xref\n0 ${objects.length + 1}\n`;
  pdfStr += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    pdfStr += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdfStr += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObjNum} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  const bytes = new Uint8Array(pdfStr.length);
  for (let i = 0; i < pdfStr.length; i++) {
    bytes[i] = pdfStr.charCodeAt(i) & 0xff;
  }
  return bytes;
}

export function downloadMoneyPlannerPdf(params) {
  const bytes = buildMoneyPlannerPdfBytes(params);
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', buildSafeFilename(params?.batchName, 'pdf'));
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
