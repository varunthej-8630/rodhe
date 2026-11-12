import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Trash2,
  Save,
  FileDown,
  FileSpreadsheet,
  FolderOpen,
  Copy,
  Search,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  IndianRupee
} from 'lucide-react';
import {
  DEFAULT_BATCH_QUANTITY,
  MAX_BATCH_NAME_LENGTH,
  MAX_COST_NAME_LENGTH,
  MAX_EXPENSE_LINES_PER_SECTION,
  QUICK_ADD_SUGGESTIONS,
  createBlankBatchDraft,
  createPlannerLine,
  calculateMoneyBatch,
  formatIndianInteger,
  formatPaiseCurrency,
  formatSharePercentage,
  getBatchSnapshotKey,
  validateBatchForSave
} from '../../utils/moneyPlannerCalc';
import {
  downloadMoneyPlannerCsv,
  downloadMoneyPlannerPdf
} from '../../utils/moneyPlannerExports';
import { moneyPlannerService } from '../../services/moneyPlannerService';

const CHART_PALETTE = [
  '#4B3024',
  '#B88D4A',
  '#C98278',
  '#525B3A',
  '#8F7263',
  '#6D4C41'
];

const BATCHES_PAGE_SIZE = 6;

function MoneyBreakdownDonut({ breakdown, totalPaise, quantity = 0, setupTotalPaise = 0, perSareeBatchTotalPaise = 0, setupSharePercent = 0, perSareeSharePercent = 0, hasCalculationIssue = false, issueMessage = '' }) {
  const positiveSegments = breakdown.filter((item) => item.contributionPaise > 0);
  if (hasCalculationIssue) {
    return (
      <div
        style={{
          padding: '1.15rem',
          borderRadius: '4px',
          backgroundColor: '#FDF4F2',
          border: '1px dashed rgba(158, 60, 43, 0.45)',
          textAlign: 'center',
          color: '#9E3C2B',
          fontSize: '0.84rem',
          fontWeight: 600
        }}
      >
        {issueMessage || 'Fix invalid numbers below to view where your money goes.'}
      </div>
    );
  }
  if (totalPaise <= 0 || positiveSegments.length === 0) {
    return (
      <div
        style={{
          padding: '1.25rem',
          borderRadius: '4px',
          backgroundColor: '#FAF6EE',
          border: '1px dashed rgba(184, 141, 74, 0.45)',
          textAlign: 'center',
          color: '#6F4E3E',
          fontSize: '0.84rem'
        }}
      >
        Add your first cost to see where your money goes.
      </div>
    );
  }

  const size = 152;
  const strokeWidth = 22;
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;

  const donutSegments = positiveSegments.reduce((acc, item, idx) => {
    const startFraction = acc.length === 0 ? 0 : acc[acc.length - 1].endFraction;
    const fraction = item.contributionPaise / totalPaise;
    acc.push({
      item,
      idx,
      dashLength: fraction * circumference,
      dashOffset: -startFraction * circumference,
      endFraction: startFraction + fraction,
      strokeColor: CHART_PALETTE[idx % CHART_PALETTE.length]
    });
    return acc;
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.15rem', flexWrap: 'wrap' }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label="Expense breakdown chart"
          style={{ flexShrink: 0 }}
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#EFE6D8"
            strokeWidth={strokeWidth}
          />
          {donutSegments.map(({ item, idx, dashLength, dashOffset, strokeColor }) => (
            <circle
              key={`${item.id}-${idx}`}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLength} ${circumference}`}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${center} ${center})`}
            />
          ))}
          <text
            x="50%"
            y="47%"
            textAnchor="middle"
            fill="#8F7263"
            fontSize="9"
            fontWeight="700"
            letterSpacing="0.8"
          >
            LARGEST
          </text>
          <text
            x="50%"
            y="60%"
            textAnchor="middle"
            fill="#4B3024"
            fontSize="14"
            fontWeight="700"
          >
            {formatSharePercentage(positiveSegments[0].sharePercent)}
          </text>
        </svg>

        <div style={{ flex: 1, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8F7263' }}>
            Cost split
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.84rem', color: '#4B3024' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
              <span>Setup money:</span>
              <strong style={{ whiteSpace: 'nowrap' }}>
                {formatPaiseCurrency(setupTotalPaise, { symbol: '₹' })}{' '}
                ({formatSharePercentage(setupSharePercent)})
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
              <span>Per-saree money:</span>
              <strong style={{ whiteSpace: 'nowrap' }}>
                {formatPaiseCurrency(perSareeBatchTotalPaise, { symbol: '₹' })}{' '}
                ({formatSharePercentage(perSareeSharePercent)})
              </strong>
            </div>
          </div>

          <div
            aria-hidden="true"
            style={{
              height: '8px',
              width: '100%',
              backgroundColor: '#EFE6D8',
              borderRadius: '999px',
              overflow: 'hidden',
              display: 'flex',
              marginTop: '0.25rem'
            }}
          >
            <div
              style={{
                width: `${setupSharePercent}%`,
                backgroundColor: '#B88D4A'
              }}
            />
            <div
              style={{
                width: `${perSareeSharePercent}%`,
                backgroundColor: '#4B3024'
              }}
            />
          </div>
        </div>
      </div>

      {/* Sorted Legend + Horizontal Share Bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {positiveSegments.map((item, idx) => {
          const barColor = CHART_PALETTE[idx % CHART_PALETTE.length];
          const typeText = item.kind === 'setup' ? 'Spent once (setup)' : 'Spent on every saree';
          return (
            <div
              key={`legend-${item.id}-${idx}`}
              style={{
                padding: '0.6rem 0.75rem',
                backgroundColor: item.isBiggestExpense ? '#FAF3E6' : '#FFFDF9',
                border: item.isBiggestExpense ? '1px solid rgba(184, 141, 74, 0.55)' : '1px solid rgba(75, 48, 36, 0.1)',
                borderRadius: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', minWidth: 0 }}>
                <span
                  aria-hidden="true"
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '2px',
                    backgroundColor: barColor,
                    flexShrink: 0
                  }}
                />
                <span style={{ fontWeight: 600, fontSize: '0.84rem', color: '#4B3024', wordBreak: 'break-word' }}>
                  {item.displayName}
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    padding: '0.1rem 0.45rem',
                    borderRadius: '3px',
                    backgroundColor: item.kind === 'setup' ? 'rgba(184, 141, 74, 0.16)' : 'rgba(75, 48, 36, 0.08)',
                    color: '#4B3024',
                    fontWeight: 600
                  }}
                >
                  {typeText}
                </span>
                {item.isBiggestExpense && (
                  <span
                    style={{
                      fontSize: '0.68rem',
                      padding: '0.1rem 0.45rem',
                      borderRadius: '3px',
                      backgroundColor: '#9E3C2B',
                      color: '#FAF6EE',
                      fontWeight: 700,
                      letterSpacing: '0.04em'
                    }}
                  >
                    {item.isBiggestTie ? 'Biggest expense (Tie)' : 'Biggest expense'}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#8F7263' }}>
                  {item.kind === 'per_saree' && quantity > 0
                    ? `${formatPaiseCurrency(item.amountPaise, { symbol: '₹' })} × ${formatIndianInteger(quantity)}`
                    : 'Paid once for batch'}
                </span>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#4B3024', whiteSpace: 'nowrap' }}>
                  {formatPaiseCurrency(item.contributionPaise, { symbol: '₹' })}{' '}
                  <span style={{ fontWeight: 500, color: '#6F4E3E', fontSize: '0.78rem' }}>
                    ({formatSharePercentage(item.sharePercent)})
                  </span>
                </div>
              </div>
              <div
                aria-hidden="true"
                style={{
                  height: '6px',
                  width: '100%',
                  backgroundColor: '#EFE6D8',
                  borderRadius: '999px',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, Math.max(2, item.sharePercent))}%`,
                    backgroundColor: barColor,
                    borderRadius: '999px'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const MoneyPlanner = ({ registerNavigationGuard }) => {
  const [draft, setDraft] = useState(() => createBlankBatchDraft());
  const [savedSnapshotKey, setSavedSnapshotKey] = useState(() => getBatchSnapshotKey(createBlankBatchDraft()));
  const [isSellingCalcOpen, setIsSellingCalcOpen] = useState(false);

  const [savedBatches, setSavedBatches] = useState([]);
  const [totalSavedCount, setTotalSavedCount] = useState(0);
  const [batchesPage, setBatchesPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [statusNotice, setStatusNotice] = useState('');
  const [batchErrorBanner, setBatchErrorBanner] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Unsaved-changes protection dialog state
  const [pendingAction, setPendingAction] = useState(null);

  const lastQuickChipRef = useRef({ key: '', timestamp: 0 });
  const initialBlankSnapshot = useMemo(() => getBatchSnapshotKey({
    name: '',
    quantity: String(DEFAULT_BATCH_QUANTITY),
    profitPercent: '',
    setupLines: [{ name: 'Initial investment / setup', amount: '' }],
    perSareeLines: [
      { name: 'Material', amount: '' },
      { name: 'Rolling (saree hem finishing)', amount: '' },
      { name: 'Processing', amount: '' }
    ]
  }), []);

  const currentSnapshotKey = useMemo(() => getBatchSnapshotKey(draft), [draft]);
  const isDirty = useMemo(() => {
    if (draft.id || draft.isTemplateCopy) {
      return currentSnapshotKey !== savedSnapshotKey;
    }
    return currentSnapshotKey !== savedSnapshotKey && currentSnapshotKey !== initialBlankSnapshot;
  }, [draft.id, draft.isTemplateCopy, currentSnapshotKey, savedSnapshotKey, initialBlankSnapshot]);

  const calc = useMemo(() => calculateMoneyBatch({
    quantity: draft.quantity,
    setupLines: draft.setupLines,
    perSareeLines: draft.perSareeLines,
    profitPercent: isSellingCalcOpen || String(draft.profitPercent || '').trim() !== '' ? draft.profitPercent : null
  }), [draft.quantity, draft.setupLines, draft.perSareeLines, draft.profitPercent, isSellingCalcOpen]);

  const loadBatches = useCallback(async (search = searchQuery, page = batchesPage) => {
    setIsLoadingBatches(true);
    setBatchErrorBanner('');
    try {
      const res = await moneyPlannerService.listBatches({
        search,
        page,
        pageSize: BATCHES_PAGE_SIZE
      });
      setSavedBatches(res.items || []);
      setTotalSavedCount(res.totalCount || 0);
    } catch (err) {
      setBatchErrorBanner(err?.message || 'Unable to load saved batches.');
    } finally {
      setIsLoadingBatches(false);
    }
  }, [searchQuery, batchesPage]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const res = await moneyPlannerService.listBatches({
          search: searchQuery,
          page: batchesPage,
          pageSize: BATCHES_PAGE_SIZE
        });
        if (!active) return;
        setSavedBatches(res.items || []);
        setTotalSavedCount(res.totalCount || 0);
        setBatchErrorBanner('');
      } catch (err) {
        if (!active) return;
        setBatchErrorBanner(err?.message || 'Unable to load saved batches.');
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [searchQuery, batchesPage]);

  // Browser close/refresh protection when unsaved changes exist
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Register navigation guard with AdminPortal for CRM sidebar/Storefront/Logout clicks
  useEffect(() => {
    if (!registerNavigationGuard) return undefined;
    registerNavigationGuard((proceedCallback) => {
      if (!isDirty) {
        return true;
      }
      setPendingAction({
        type: 'navigate',
        label: 'leave Money Planner',
        execute: proceedCallback
      });
      return false;
    });
    return () => registerNavigationGuard(null);
  }, [registerNavigationGuard, isDirty]);

  const updateLine = (kind, lineId, field, value) => {
    setSaveError('');
    setStatusNotice('');
    setDraft((prev) => {
      const key = kind === 'setup' ? 'setupLines' : 'perSareeLines';
      return {
        ...prev,
        [key]: prev[key].map((line) => (line.id === lineId ? { ...line, [field]: value } : line))
      };
    });
  };

  const addLine = (kind, presetName = '') => {
    setSaveError('');
    setStatusNotice('');
    setDraft((prev) => {
      const key = kind === 'setup' ? 'setupLines' : 'perSareeLines';
      if (prev[key].length >= MAX_EXPENSE_LINES_PER_SECTION) {
        setSaveError(`You can add up to ${MAX_EXPENSE_LINES_PER_SECTION} lines in each section.`);
        return prev;
      }
      return {
        ...prev,
        [key]: [...prev[key], createPlannerLine(presetName, kind, '')]
      };
    });
  };

  const removeLine = (kind, lineId) => {
    setSaveError('');
    setStatusNotice('');
    setDraft((prev) => {
      const key = kind === 'setup' ? 'setupLines' : 'perSareeLines';
      return {
        ...prev,
        [key]: prev[key].filter((line) => line.id !== lineId)
      };
    });
  };

  const handleQuickAddChip = useCallback((chip) => {
    const now = performance.now();
    const tapKey = `${chip.label}-${chip.defaultKind}`;
    if (lastQuickChipRef.current.key === tapKey && now - lastQuickChipRef.current.timestamp < 280) {
      return;
    }
    lastQuickChipRef.current = { key: tapKey, timestamp: now };
    setSaveError('');
    setStatusNotice('');
    setDraft((prev) => {
      const kind = chip.defaultKind;
      const key = kind === 'setup' ? 'setupLines' : 'perSareeLines';
      if (prev[key].length >= MAX_EXPENSE_LINES_PER_SECTION) {
        setSaveError(`You can add up to ${MAX_EXPENSE_LINES_PER_SECTION} lines in each section.`);
        return prev;
      }
      return {
        ...prev,
        [key]: [...prev[key], createPlannerLine(chip.label, kind, '')]
      };
    });
  }, []);

  const handleSaveBatch = async () => {
    setSaveError('');
    setStatusNotice('');

    const validation = validateBatchForSave({
      name: draft.name,
      quantity: draft.quantity,
      setupLines: draft.setupLines,
      perSareeLines: draft.perSareeLines,
      profitPercent: isSellingCalcOpen || String(draft.profitPercent || '').trim() !== '' ? draft.profitPercent : null
    });

    if (!validation.valid) {
      setSaveError(validation.errors[0]);
      return false;
    }

    setIsSaving(true);
    try {
      const saved = await moneyPlannerService.saveBatch({
        ...draft,
        profitPercent: isSellingCalcOpen || String(draft.profitPercent || '').trim() !== '' ? draft.profitPercent : ''
      });
      const syncedDraft = {
        ...saved,
        isTemplateCopy: false
      };
      setDraft(syncedDraft);
      setSavedSnapshotKey(getBatchSnapshotKey(syncedDraft));
      setStatusNotice(`Batch "${saved.name}" saved safely.`);
      await loadBatches(searchQuery, 1);
      setBatchesPage(1);
      return true;
    } catch (err) {
      setSaveError(err?.message || 'Your batch could not be saved. Please try again.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const applyNewBlankBatch = () => {
    const blank = createBlankBatchDraft();
    setDraft(blank);
    setSavedSnapshotKey(getBatchSnapshotKey(blank));
    setIsSellingCalcOpen(false);
    setSaveError('');
    setStatusNotice('');
  };

  const applyOpenBatch = async (batchId) => {
    setSaveError('');
    setStatusNotice('');
    try {
      const loaded = await moneyPlannerService.getBatch(batchId);
      setDraft(loaded);
      setSavedSnapshotKey(getBatchSnapshotKey(loaded));
      setIsSellingCalcOpen(String(loaded.profitPercent || '').trim() !== '');
      setStatusNotice(`Opened "${loaded.name}".`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSaveError(err?.message || 'Could not open saved batch.');
    }
  };

  const applyUseAsTemplate = async (batchId) => {
    setSaveError('');
    setStatusNotice('');
    try {
      const loaded = await moneyPlannerService.getBatch(batchId);
      const templateDraft = {
        id: null,
        name: `${loaded.name} (Copy)`,
        quantity: loaded.quantity,
        profitPercent: loaded.profitPercent || '',
        setupLines: (loaded.setupLines || []).map((l) => createPlannerLine(l.name, 'setup', l.amount)),
        perSareeLines: (loaded.perSareeLines || []).map((l) => createPlannerLine(l.name, 'per_saree', l.amount)),
        updatedAt: null,
        isTemplateCopy: true
      };
      setDraft(templateDraft);
      setSavedSnapshotKey(getBatchSnapshotKey(templateDraft));
      setIsSellingCalcOpen(String(templateDraft.profitPercent || '').trim() !== '');
      setStatusNotice(`Started new unsaved batch from "${loaded.name}". Original batch will not be changed.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSaveError(err?.message || 'Could not copy batch as template.');
    }
  };

  const guardActionIfDirty = (actionInfo) => {
    if (!isDirty) {
      actionInfo.execute();
      return;
    }
    setPendingAction(actionInfo);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await moneyPlannerService.deleteBatch(deleteTarget.id);
      if (draft.id === deleteTarget.id) {
        applyNewBlankBatch();
      }
      setDeleteTarget(null);
      setStatusNotice(`Deleted "${deleteTarget.name}".`);
      const nextPage = savedBatches.length === 1 && batchesPage > 1 ? batchesPage - 1 : batchesPage;
      setBatchesPage(nextPage);
      await loadBatches(searchQuery, nextPage);
    } catch (err) {
      setBatchErrorBanner(err?.message || 'Could not delete batch.');
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportPdf = () => {
    setSaveError('');
    if (!calc.isValid) {
      setSaveError('Please fix invalid inputs before downloading PDF.');
      return;
    }
    downloadMoneyPlannerPdf({
      batchName: draft.name || 'RODHE Batch Estimate',
      quantity: draft.quantity,
      setupLines: draft.setupLines,
      perSareeLines: draft.perSareeLines,
      profitPercent: isSellingCalcOpen || String(draft.profitPercent || '').trim() !== '' ? draft.profitPercent : null
    });
  };

  const handleExportCsv = () => {
    setSaveError('');
    if (!calc.isValid) {
      setSaveError('Please fix invalid inputs before downloading Excel/CSV.');
      return;
    }
    downloadMoneyPlannerCsv({
      batchName: draft.name || 'RODHE Batch Estimate',
      quantity: draft.quantity,
      setupLines: draft.setupLines,
      perSareeLines: draft.perSareeLines,
      profitPercent: isSellingCalcOpen || String(draft.profitPercent || '').trim() !== '' ? draft.profitPercent : null
    });
  };

  const totalPages = Math.max(1, Math.ceil(totalSavedCount / BATCHES_PAGE_SIZE));

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Action Header */}
      <div
        style={{
          backgroundColor: '#FFFDF9',
          border: '1px solid rgba(184, 141, 74, 0.3)',
          borderRadius: '4px',
          padding: '1.25rem 1.4rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.45rem, 3vw, 1.8rem)', color: '#4B3024', margin: 0 }}>
              Money Planner
            </h2>
            {isDirty && (
              <span
                role="status"
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(184, 141, 74, 0.2)',
                  color: '#4B3024',
                  border: '1px solid #B88D4A'
                }}
              >
                Unsaved changes
              </span>
            )}
            {draft.isTemplateCopy && (
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '999px',
                  backgroundColor: '#F4ECE1',
                  color: '#6F4E3E',
                  border: '1px solid rgba(75, 48, 36, 0.2)'
                }}
              >
                New batch from template
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.84rem', color: '#6F4E3E', margin: '0.25rem 0 0 0' }}>
            Plan how much money you need for a batch of sarees and what each saree costs you.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => guardActionIfDirty({
              type: 'new',
              label: 'start a fresh blank batch',
              execute: applyNewBlankBatch
            })}
            style={{
              minHeight: '44px',
              padding: '0.55rem 0.95rem',
              backgroundColor: 'transparent',
              border: '1px solid rgba(75, 48, 36, 0.25)',
              borderRadius: '4px',
              color: '#4B3024',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            New batch
          </button>

          <button
            type="button"
            onClick={handleExportPdf}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              minHeight: '44px',
              padding: '0.55rem 0.95rem',
              backgroundColor: '#FAF6EE',
              border: '1px solid rgba(184, 141, 74, 0.45)',
              borderRadius: '4px',
              color: '#4B3024',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <FileDown size={16} />
            <span>Download PDF</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              minHeight: '44px',
              padding: '0.55rem 0.95rem',
              backgroundColor: '#FAF6EE',
              border: '1px solid rgba(184, 141, 74, 0.45)',
              borderRadius: '4px',
              color: '#4B3024',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <FileSpreadsheet size={16} />
            <span>Download Excel/CSV</span>
          </button>

          <button
            type="button"
            onClick={handleSaveBatch}
            disabled={isSaving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              minHeight: '44px',
              padding: '0.55rem 1.25rem',
              backgroundColor: '#4B3024',
              border: 'none',
              borderRadius: '4px',
              color: '#FAF6EE',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.7 : 1
            }}
          >
            <Save size={16} />
            <span>{isSaving ? 'Saving...' : 'Save batch'}</span>
          </button>
        </div>
      </div>

      {/* Inline Feedback & Alerts */}
      {saveError && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.85rem 1rem',
            backgroundColor: 'rgba(181, 67, 50, 0.08)',
            border: '1px solid rgba(181, 67, 50, 0.35)',
            borderRadius: '4px',
            color: '#9E3C2B',
            fontSize: '0.86rem',
            fontWeight: 500
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{saveError}</span>
        </div>
      )}

      {statusNotice && !saveError && (
        <div
          role="status"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.8rem 1rem',
            backgroundColor: 'rgba(82, 91, 58, 0.1)',
            border: '1px solid rgba(82, 91, 58, 0.35)',
            borderRadius: '4px',
            color: '#3F472B',
            fontSize: '0.86rem',
            fontWeight: 500
          }}
        >
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <span>{statusNotice}</span>
        </div>
      )}

      {/* Unsaved-Changes Protection Banner */}
      {pendingAction && (
        <div
          role="dialog"
          aria-label="Unsaved batch changes confirmation"
          style={{
            backgroundColor: '#FAF3E6',
            border: '2px solid #B88D4A',
            borderRadius: '4px',
            padding: '1rem 1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            boxShadow: '0 8px 24px rgba(75, 48, 36, 0.12)'
          }}
        >
          <div>
            <div style={{ fontWeight: 700, color: '#4B3024', fontSize: '0.94rem' }}>
              You have unsaved changes in this batch
            </div>
            <div style={{ fontSize: '0.82rem', color: '#6F4E3E', marginTop: '0.2rem' }}>
              Save your work before you {pendingAction.label}, or discard your edits.
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={async () => {
                const ok = await handleSaveBatch();
                if (ok) {
                  const fn = pendingAction.execute;
                  setPendingAction(null);
                  fn();
                }
              }}
              style={{
                minHeight: '44px',
                padding: '0.5rem 1rem',
                backgroundColor: '#4B3024',
                color: '#FAF6EE',
                border: 'none',
                borderRadius: '4px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Save changes
            </button>
            <button
              type="button"
              onClick={() => {
                const fn = pendingAction.execute;
                setPendingAction(null);
                fn();
              }}
              style={{
                minHeight: '44px',
                padding: '0.5rem 1rem',
                backgroundColor: '#9E3C2B',
                color: '#FAF6EE',
                border: 'none',
                borderRadius: '4px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Discard changes
            </button>
            <button
              type="button"
              onClick={() => setPendingAction(null)}
              style={{
                minHeight: '44px',
                padding: '0.5rem 1rem',
                backgroundColor: '#FFFDF9',
                color: '#4B3024',
                border: '1px solid rgba(75, 48, 36, 0.25)',
                borderRadius: '4px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Stay on this page
            </button>
          </div>
        </div>
      )}

      {/* Main Responsive Two-Column Workspace (Results first on mobile, Sticky right on desktop) */}
      <div className="money-planner-grid">
        {/* LEFT COLUMN: STEP 1 & STEP 2 */}
        <div className="money-planner-inputs-col" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* STEP 1: BATCH DETAILS */}
          <section
            aria-label="Step 1: Batch details"
            style={{
              backgroundColor: '#FFFDF9',
              border: '1px solid rgba(75, 48, 36, 0.14)',
              borderRadius: '4px',
              padding: '1.35rem'
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B88D4A', marginBottom: '0.35rem' }}>
              Step 1
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: '#4B3024', margin: '0 0 1rem 0' }}>
              Batch details
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '1rem' }}>
              <div>
                <label
                  htmlFor="mp-batch-name"
                  style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#4B3024', marginBottom: '0.4rem' }}
                >
                  Batch name
                </label>
                <input
                  id="mp-batch-name"
                  type="text"
                  maxLength={MAX_BATCH_NAME_LENGTH}
                  placeholder="Example: December Mulmul Collection"
                  value={draft.name}
                  onChange={(e) => {
                    setSaveError('');
                    setStatusNotice('');
                    setDraft((prev) => ({ ...prev, name: e.target.value }));
                  }}
                  style={{
                    width: '100%',
                    minHeight: '44px',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '4px',
                    border: '1px solid rgba(75, 48, 36, 0.25)',
                    backgroundColor: '#FFFDF9',
                    color: '#4B3024',
                    fontSize: '0.92rem'
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="mp-batch-quantity"
                  style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#4B3024', marginBottom: '0.4rem' }}
                >
                  How many sarees are you making?
                </label>
                <input
                  id="mp-batch-quantity"
                  type="text"
                  inputMode="numeric"
                  value={draft.quantity}
                  onChange={(e) => {
                    setSaveError('');
                    setStatusNotice('');
                    setDraft((prev) => ({ ...prev, quantity: e.target.value }));
                  }}
                  aria-invalid={!calc.quantityValidation.valid}
                  style={{
                    width: '100%',
                    minHeight: '44px',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '4px',
                    border: calc.quantityValidation.valid
                      ? '1px solid rgba(75, 48, 36, 0.25)'
                      : '1.5px solid #9E3C2B',
                    backgroundColor: '#FFFDF9',
                    color: '#4B3024',
                    fontSize: '0.96rem',
                    fontWeight: 700
                  }}
                />
                {!calc.quantityValidation.valid && (
                  <p role="alert" style={{ color: '#9E3C2B', fontSize: '0.78rem', fontWeight: 600, margin: '0.35rem 0 0 0' }}>
                    {calc.quantityValidation.error}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* STEP 2: ADD THE MONEY YOU SPEND */}
          <section
            aria-label="Step 2: Add the money you spend"
            style={{
              backgroundColor: '#FFFDF9',
              border: '1px solid rgba(75, 48, 36, 0.14)',
              borderRadius: '4px',
              padding: '1.35rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem'
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B88D4A', marginBottom: '0.35rem' }}>
                Step 2
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: '#4B3024', margin: 0 }}>
                Add the money you spend
              </h3>
            </div>

            {/* BOX A: Money you spend once (setup) */}
            <div
              style={{
                padding: '1.1rem',
                borderRadius: '4px',
                backgroundColor: '#FAF6EE',
                border: '1px solid rgba(184, 141, 74, 0.32)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#4B3024', margin: '0 0 0.25rem 0' }}>
                    Money you spend once (setup)
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: '#6F4E3E', margin: 0 }}>
                    Money spent before making the sarees. You usually pay this once for the batch.
                  </p>
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#4B3024', whiteSpace: 'nowrap' }}>
                  Setup total: {formatPaiseCurrency(calc.setupTotalPaise, { symbol: '₹' })}
                </div>
              </div>

              {draft.setupLines.length === 0 ? (
                <div style={{ padding: '0.75rem', backgroundColor: '#FFFDF9', borderRadius: '4px', border: '1px dashed rgba(75, 48, 36, 0.2)', fontSize: '0.82rem', color: '#6F4E3E' }}>
                  No one-time setup expenses yet. Tap &ldquo;+ Add cost&rdquo; if you spend money once before weaving or printing.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {draft.setupLines.map((line, idx) => {
                    const parsedLine = calc.setupLines[idx];
                    return (
                      <div key={line.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div className="money-line-row">
                          <input
                            type="text"
                            maxLength={MAX_COST_NAME_LENGTH}
                            aria-label={`Setup cost name ${idx + 1}`}
                            placeholder="For example: Wooden blocks, design prep"
                            value={line.name}
                            onChange={(e) => updateLine('setup', line.id, 'name', e.target.value)}
                            style={{
                              minHeight: '44px',
                              padding: '0.55rem 0.75rem',
                              borderRadius: '4px',
                              border: '1px solid rgba(75, 48, 36, 0.22)',
                              backgroundColor: '#FFFDF9',
                              color: '#4B3024',
                              fontSize: '0.88rem'
                            }}
                          />
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <span aria-hidden="true" style={{ position: 'absolute', left: '0.7rem', color: '#8F7263', fontWeight: 600, fontSize: '0.88rem' }}>
                              ₹
                            </span>
                            <input
                              type="text"
                              inputMode="decimal"
                              aria-label={`Setup cost amount ${idx + 1}`}
                              placeholder="0"
                              value={line.amount}
                              onChange={(e) => updateLine('setup', line.id, 'amount', e.target.value)}
                              aria-invalid={parsedLine && !parsedLine.isValidAmount}
                              style={{
                                width: '100%',
                                minHeight: '44px',
                                padding: '0.55rem 0.75rem 0.55rem 1.55rem',
                                borderRadius: '4px',
                                border: parsedLine && !parsedLine.isValidAmount
                                  ? '1.5px solid #9E3C2B'
                                  : '1px solid rgba(75, 48, 36, 0.22)',
                                backgroundColor: '#FFFDF9',
                                color: '#4B3024',
                                fontSize: '0.9rem',
                                fontWeight: 600
                              }}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeLine('setup', line.id)}
                            aria-label={`Remove setup cost ${line.name || idx + 1}`}
                            style={{
                              minHeight: '44px',
                              minWidth: '44px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '4px',
                              border: '1px solid rgba(158, 60, 43, 0.25)',
                              backgroundColor: '#FFFDF9',
                              color: '#9E3C2B',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        {parsedLine && !parsedLine.isValidAmount && (
                          <span role="alert" style={{ fontSize: '0.76rem', color: '#9E3C2B', fontWeight: 600 }}>
                            {parsedLine.amountError}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div>
                <button
                  type="button"
                  onClick={() => addLine('setup', '')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    minHeight: '44px',
                    padding: '0.5rem 0.9rem',
                    backgroundColor: '#FFFDF9',
                    border: '1px solid rgba(75, 48, 36, 0.25)',
                    borderRadius: '4px',
                    color: '#4B3024',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <span>+ Add cost</span>
                </button>
              </div>
            </div>

            {/* BOX B: Money you spend on every saree */}
            <div
              style={{
                padding: '1.1rem',
                borderRadius: '4px',
                backgroundColor: '#FAF6EE',
                border: '1px solid rgba(75, 48, 36, 0.16)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#4B3024', margin: '0 0 0.25rem 0' }}>
                    Money you spend on every saree
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: '#6F4E3E', margin: 0 }}>
                    Money spent separately for each saree you make.
                  </p>
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#4B3024', textAlign: 'right' }}>
                  <div>Per saree: {formatPaiseCurrency(calc.perSareeUnitTotalPaise, { symbol: '₹' })}</div>
                  {calc.quantityValidation.valid && (
                    <div style={{ fontSize: '0.74rem', fontWeight: 600, color: '#6F4E3E', marginTop: '0.12rem' }}>
                      × {formatIndianInteger(calc.quantity)} {calc.quantity === 1 ? 'saree' : 'sarees'} ={' '}
                      {formatPaiseCurrency(calc.perSareeUnitTotalPaise * calc.quantity, { symbol: '₹' })}
                    </div>
                  )}
                </div>
              </div>

              {draft.perSareeLines.length === 0 ? (
                <div style={{ padding: '0.75rem', backgroundColor: '#FFFDF9', borderRadius: '4px', border: '1px dashed rgba(75, 48, 36, 0.2)', fontSize: '0.82rem', color: '#6F4E3E' }}>
                  No per-saree costs yet. Tap &ldquo;+ Add cost&rdquo; or use a quick-add chip below.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {draft.perSareeLines.map((line, idx) => {
                    const parsedLine = calc.perSareeLines[idx];
                    return (
                      <div key={line.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div className="money-line-row">
                          <input
                            type="text"
                            maxLength={MAX_COST_NAME_LENGTH}
                            aria-label={`Per-saree cost name ${idx + 1}`}
                            placeholder="For example: Cotton, dyeing, finishing"
                            value={line.name}
                            onChange={(e) => updateLine('per_saree', line.id, 'name', e.target.value)}
                            style={{
                              minHeight: '44px',
                              padding: '0.55rem 0.75rem',
                              borderRadius: '4px',
                              border: '1px solid rgba(75, 48, 36, 0.22)',
                              backgroundColor: '#FFFDF9',
                              color: '#4B3024',
                              fontSize: '0.88rem'
                            }}
                          />
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <span aria-hidden="true" style={{ position: 'absolute', left: '0.7rem', color: '#8F7263', fontWeight: 600, fontSize: '0.88rem' }}>
                              ₹
                            </span>
                            <input
                              type="text"
                              inputMode="decimal"
                              aria-label={`Per-saree cost amount ${idx + 1}`}
                              placeholder="0"
                              value={line.amount}
                              onChange={(e) => updateLine('per_saree', line.id, 'amount', e.target.value)}
                              aria-invalid={parsedLine && !parsedLine.isValidAmount}
                              style={{
                                width: '100%',
                                minHeight: '44px',
                                padding: '0.55rem 0.75rem 0.55rem 1.55rem',
                                borderRadius: '4px',
                                border: parsedLine && !parsedLine.isValidAmount
                                  ? '1.5px solid #9E3C2B'
                                  : '1px solid rgba(75, 48, 36, 0.22)',
                                backgroundColor: '#FFFDF9',
                                color: '#4B3024',
                                fontSize: '0.9rem',
                                fontWeight: 600
                              }}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeLine('per_saree', line.id)}
                            aria-label={`Remove per-saree cost ${line.name || idx + 1}`}
                            style={{
                              minHeight: '44px',
                              minWidth: '44px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '4px',
                              border: '1px solid rgba(158, 60, 43, 0.25)',
                              backgroundColor: '#FFFDF9',
                              color: '#9E3C2B',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        {parsedLine && !parsedLine.isValidAmount && (
                          <span role="alert" style={{ fontSize: '0.76rem', color: '#9E3C2B', fontWeight: 600 }}>
                            {parsedLine.amountError}
                          </span>
                        )}
                        {parsedLine && parsedLine.isValidAmount && parsedLine.amountPaise > 0 && calc.quantityValidation.valid && (
                          <span style={{ fontSize: '0.73rem', color: '#6F4E3E' }}>
                            Batch contribution: {formatPaiseCurrency(parsedLine.amountPaise, { symbol: '₹' })} × {formatIndianInteger(calc.quantity)} ={' '}
                            <strong>{formatPaiseCurrency(parsedLine.amountPaise * calc.quantity, { symbol: '₹' })}</strong>
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div>
                <button
                  type="button"
                  onClick={() => addLine('per_saree', '')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    minHeight: '44px',
                    padding: '0.5rem 0.9rem',
                    backgroundColor: '#FFFDF9',
                    border: '1px solid rgba(75, 48, 36, 0.25)',
                    borderRadius: '4px',
                    color: '#4B3024',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <span>+ Add cost</span>
                </button>
              </div>
            </div>

            {/* QUICK-ADD CHIPS */}
            <div>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#6F4E3E', marginBottom: '0.5rem' }}>
                Quick-add common saree expenses:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {QUICK_ADD_SUGGESTIONS.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => handleQuickAddChip(chip)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      minHeight: '44px',
                      padding: '0.45rem 0.85rem',
                      borderRadius: '999px',
                      border: '1px solid rgba(184, 141, 74, 0.5)',
                      backgroundColor: '#FFFDF9',
                      color: '#4B3024',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Sparkles size={13} color="#B88D4A" />
                    <span>+ {chip.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN (STICKY DESKTOP / TOP SUMMARY MOBILE): RESULTS PANEL */}
        <aside className="money-planner-results-col" aria-label="Live money calculation results">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* Main Results Card */}
            <div
              style={{
                backgroundColor: '#FFFDF9',
                border: '1.5px solid rgba(184, 141, 74, 0.55)',
                borderRadius: '4px',
                padding: '1.35rem',
                boxShadow: '0 10px 28px rgba(75, 48, 36, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.1rem'
              }}
            >
              {/* RESULT 1 & RESULT 2 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.85rem' }}>
                <div
                  style={{
                    padding: '1rem',
                    borderRadius: '4px',
                    backgroundColor: '#FAF6EE',
                    border: '1px solid rgba(75, 48, 36, 0.14)'
                  }}
                >
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6F4E3E', marginBottom: '0.35rem' }}>
                    Total money you need
                  </div>
                  <div
                    data-testid="total-money-needed"
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: 'clamp(1.45rem, 3vw, 1.9rem)',
                      fontWeight: 700,
                      color: calc.hasCalculationIssue ? '#9E3C2B' : '#4B3024',
                      lineHeight: 1.15
                    }}
                  >
                    {calc.hasCalculationIssue ? '—' : formatPaiseCurrency(calc.totalMoneyPaise, { symbol: '₹' })}
                  </div>
                  {!calc.hasCalculationIssue && calc.hasAnyPositiveCost && (
                    <div style={{ fontSize: '0.72rem', color: '#6F4E3E', marginTop: '0.35rem', lineHeight: 1.35 }}>
                      {formatPaiseCurrency(calc.setupTotalPaise, { symbol: '₹' })} setup +{' '}
                      {formatPaiseCurrency(calc.perSareeBatchTotalPaise, { symbol: '₹' })} batch
                    </div>
                  )}
                </div>

                <div
                  style={{
                    padding: '1rem',
                    borderRadius: '4px',
                    backgroundColor: '#2A1A13',
                    border: '2px solid #B88D4A',
                    color: '#FAF6EE'
                  }}
                >
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#EADAB5', marginBottom: '0.35rem' }}>
                    Cost of one saree
                  </div>
                  <div
                    data-testid="cost-of-one-saree"
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: 'clamp(1.6rem, 3.2vw, 2.05rem)',
                      fontWeight: 700,
                      color: '#EADAB5',
                      lineHeight: 1.15
                    }}
                  >
                    {calc.hasCalculationIssue ? '—' : formatPaiseCurrency(calc.costOfOneSareePaise, { symbol: '₹' })}
                  </div>
                  {!calc.hasCalculationIssue && calc.hasAnyPositiveCost && (
                    <div style={{ fontSize: '0.72rem', color: '#EADAB5', opacity: 0.9, marginTop: '0.35rem', lineHeight: 1.35 }}>
                      {formatPaiseCurrency(calc.perSareeUnitTotalPaise, { symbol: '₹' })} per-saree +{' '}
                      {formatPaiseCurrency(calc.setupSharePerSareePaise, { symbol: '₹' })} setup share
                    </div>
                  )}
                </div>
              </div>

              {/* RESULT 3: Plain-English Sentence */}
              <div
                role={calc.hasCalculationIssue ? 'alert' : 'status'}
                aria-live="polite"
                data-testid="plain-english-summary"
                style={{
                  padding: '0.85rem 1rem',
                  backgroundColor: calc.hasCalculationIssue ? '#FDF4F2' : '#F4ECE1',
                  borderLeft: `4px solid ${calc.hasCalculationIssue ? '#9E3C2B' : '#B88D4A'}`,
                  borderRadius: '2px',
                  fontSize: '0.94rem',
                  fontWeight: 600,
                  color: calc.hasCalculationIssue ? '#9E3C2B' : '#4B3024',
                  lineHeight: 1.5
                }}
              >
                {calc.plainEnglishSummary}
              </div>

              {/* RESULT 4 & RESULT 5: Where Your Money Goes + Cost Split */}
              <div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: '#4B3024', margin: '0 0 0.75rem 0' }}>
                  Where your money goes
                </h3>
                <MoneyBreakdownDonut
                  breakdown={calc.breakdown}
                  totalPaise={calc.totalMoneyPaise}
                  quantity={calc.quantity}
                  setupTotalPaise={calc.setupTotalPaise}
                  perSareeBatchTotalPaise={calc.perSareeBatchTotalPaise}
                  setupSharePercent={calc.setupSharePercent}
                  perSareeSharePercent={calc.perSareeSharePercent}
                  hasCalculationIssue={calc.hasCalculationIssue}
                  issueMessage={calc.plainEnglishSummary}
                />
              </div>
            </div>

            {/* OPTIONAL SELLING PRICE CALCULATOR (Collapsed by Default) */}
            <div
              style={{
                backgroundColor: '#FFFDF9',
                border: '1px solid rgba(75, 48, 36, 0.16)',
                borderRadius: '4px',
                overflow: 'hidden'
              }}
            >
              <button
                type="button"
                aria-expanded={isSellingCalcOpen}
                onClick={() => setIsSellingCalcOpen((prev) => !prev)}
                style={{
                  width: '100%',
                  minHeight: '48px',
                  padding: '0.85rem 1.15rem',
                  backgroundColor: '#FAF6EE',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  color: '#4B3024',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <IndianRupee size={16} color="#B88D4A" />
                  <span>Want to see a selling price?</span>
                </span>
                {isSellingCalcOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {isSellingCalcOpen && (
                <div style={{ padding: '1.1rem 1.15rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', borderTop: '1px solid rgba(75, 48, 36, 0.1)' }}>
                  <div>
                    <label
                      htmlFor="mp-profit-percent"
                      style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#4B3024', marginBottom: '0.35rem' }}
                    >
                      Desired profit percentage
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        id="mp-profit-percent"
                        type="text"
                        inputMode="decimal"
                        placeholder="30"
                        value={draft.profitPercent}
                        onChange={(e) => {
                          setSaveError('');
                          setStatusNotice('');
                          setDraft((prev) => ({ ...prev, profitPercent: e.target.value }));
                        }}
                        aria-invalid={!calc.profitValidation.valid}
                        style={{
                          width: '140px',
                          minHeight: '44px',
                          padding: '0.55rem 0.8rem',
                          borderRadius: '4px',
                          border: calc.profitValidation.valid
                            ? '1px solid rgba(75, 48, 36, 0.25)'
                            : '1.5px solid #9E3C2B',
                          backgroundColor: '#FFFDF9',
                          color: '#4B3024',
                          fontSize: '0.94rem',
                          fontWeight: 700
                        }}
                      />
                      <span style={{ fontWeight: 700, color: '#6F4E3E' }}>%</span>
                      {String(draft.profitPercent || '').trim() === '' && (
                        <button
                          type="button"
                          onClick={() => setDraft((prev) => ({ ...prev, profitPercent: '30' }))}
                          style={{
                            minHeight: '44px',
                            padding: '0.4rem 0.75rem',
                            backgroundColor: '#FAF6EE',
                            border: '1px solid rgba(184, 141, 74, 0.45)',
                            borderRadius: '4px',
                            color: '#4B3024',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Try 30%
                        </button>
                      )}
                    </div>
                    {!calc.profitValidation.valid && (
                      <p role="alert" style={{ color: '#9E3C2B', fontSize: '0.78rem', fontWeight: 600, margin: '0.35rem 0 0 0' }}>
                        {calc.profitValidation.error}
                      </p>
                    )}
                  </div>

                  {!calc.hasCalculationIssue && calc.sellingPricePaise !== null && calc.profitValidation.hasValue && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                      {/* Method 1: Profit added on top of cost (Markup) */}
                      <div
                        data-testid="selling-price-result"
                        style={{
                          padding: '0.85rem 1rem',
                          borderRadius: '4px',
                          backgroundColor: '#FAF6EE',
                          border: '1px solid rgba(184, 141, 74, 0.42)',
                          color: '#4B3024',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.3rem'
                        }}
                      >
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8A6224' }}>
                          Method 1 • {calc.profitValidation.percent}% Profit Added on Cost (Markup)
                        </div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 600, lineHeight: 1.45 }}>
                          Sell each saree at{' '}
                          <strong>{formatPaiseCurrency(calc.sellingPricePaise, { symbol: '₹' })}</strong>{' '}
                          to earn{' '}
                          <strong>{formatPaiseCurrency(calc.profitPerSareePaise, { symbol: '₹' })}</strong>{' '}
                          profit per saree.
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#6F4E3E', lineHeight: 1.4 }}>
                          If all {formatIndianInteger(calc.quantity)} sarees sell: Total revenue{' '}
                          <strong>{formatPaiseCurrency(calc.markupBatchRevenuePaise, { symbol: '₹' })}</strong> • Total batch profit{' '}
                          <strong>{formatPaiseCurrency(calc.markupBatchProfitPaise, { symbol: '₹' })}</strong>{' '}
                          {calc.sellingPricePaise > 0 && `(${formatSharePercentage(calc.effectiveSellingMarginPercent)} of selling price)`}
                        </div>
                      </div>

                      {/* Method 2: Margin on Selling Price */}
                      <div
                        data-testid="margin-selling-price-result"
                        style={{
                          padding: '0.85rem 1rem',
                          borderRadius: '4px',
                          backgroundColor: '#FFFDF9',
                          border: '1px solid rgba(75, 48, 36, 0.2)',
                          color: '#4B3024',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.3rem'
                        }}
                      >
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#525B3A' }}>
                          Method 2 • {calc.profitValidation.percent}% Profit Margin on Selling Price
                        </div>
                        {calc.marginSupported && calc.marginSellingPricePaise !== null ? (
                          <>
                            <div style={{ fontSize: '0.92rem', fontWeight: 600, lineHeight: 1.45 }}>
                              Sell each saree at{' '}
                              <strong>{formatPaiseCurrency(calc.marginSellingPricePaise, { symbol: '₹' })}</strong>{' '}
                              to keep{' '}
                              <strong>{formatPaiseCurrency(calc.marginProfitPerSareePaise, { symbol: '₹' })}</strong>{' '}
                              profit ({calc.profitValidation.percent}% of selling price).
                            </div>
                            <div style={{ fontSize: '0.76rem', color: '#6F4E3E', lineHeight: 1.4 }}>
                              If all {formatIndianInteger(calc.quantity)} sarees sell: Total revenue{' '}
                              <strong>{formatPaiseCurrency(calc.marginBatchRevenuePaise, { symbol: '₹' })}</strong> • Total batch profit{' '}
                              <strong>{formatPaiseCurrency(calc.marginBatchProfitPaise, { symbol: '₹' })}</strong>
                            </div>
                          </>
                        ) : (
                          <div style={{ fontSize: '0.8rem', color: '#6F4E3E', lineHeight: 1.45 }}>
                            Selling price margin must be under 100% of selling price (at {calc.profitValidation.percent}%, Method 1 above applies as cost markup).
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <p style={{ fontSize: '0.76rem', color: '#8F7263', margin: 0, lineHeight: 1.45 }}>
                    Choose whichever method matches how you price sarees. Both exclude GST, shipping, or marketplace fees.
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* SAVED BATCHES SECTION */}
      <section
        aria-label="Saved batches"
        style={{
          backgroundColor: '#FFFDF9',
          border: '1px solid rgba(75, 48, 36, 0.14)',
          borderRadius: '4px',
          padding: '1.35rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: '#4B3024', margin: 0 }}>
              Saved batches ({totalSavedCount})
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#6F4E3E', margin: '0.2rem 0 0 0' }}>
              Reopen previous saree batch plans, copy one as a starting point, or remove old drafts.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', minWidth: '230px' }}>
              <Search
                size={15}
                color="#8F7263"
                style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="search"
                aria-label="Search batches"
                placeholder="Search batches..."
                value={searchQuery}
                onChange={(e) => {
                  setBatchesPage(1);
                  setSearchQuery(e.target.value);
                }}
                style={{
                  width: '100%',
                  minHeight: '44px',
                  padding: '0.5rem 0.85rem 0.5rem 2.2rem',
                  borderRadius: '4px',
                  border: '1px solid rgba(75, 48, 36, 0.22)',
                  backgroundColor: '#FAF6EE',
                  color: '#4B3024',
                  fontSize: '0.86rem'
                }}
              />
            </div>

            <button
              type="button"
              onClick={() => loadBatches(searchQuery, batchesPage)}
              aria-label="Refresh saved batches"
              style={{
                minHeight: '44px',
                minWidth: '44px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#FAF6EE',
                border: '1px solid rgba(75, 48, 36, 0.2)',
                borderRadius: '4px',
                color: '#4B3024',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {batchErrorBanner && (
          <div
            role="alert"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              padding: '0.8rem 1rem',
              borderRadius: '4px',
              backgroundColor: 'rgba(181, 67, 50, 0.08)',
              border: '1px solid rgba(181, 67, 50, 0.3)',
              color: '#9E3C2B',
              fontSize: '0.84rem'
            }}
          >
            <AlertCircle size={16} />
            <span>{batchErrorBanner}</span>
          </div>
        )}

        {/* Delete Confirmation Prompt */}
        {deleteTarget && (
          <div
            role="dialog"
            aria-label="Confirm delete batch"
            style={{
              padding: '1rem 1.15rem',
              backgroundColor: '#FDF4F2',
              border: '1.5px solid #9E3C2B',
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.85rem'
            }}
          >
            <div style={{ fontSize: '0.88rem', color: '#4B3024', fontWeight: 600 }}>
              Delete this batch? This cannot be undone. ({deleteTarget.name})
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                style={{
                  minHeight: '44px',
                  padding: '0.45rem 1rem',
                  backgroundColor: '#9E3C2B',
                  color: '#FAF6EE',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {isDeleting ? 'Deleting...' : 'Confirm delete'}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                style={{
                  minHeight: '44px',
                  padding: '0.45rem 1rem',
                  backgroundColor: '#FFFDF9',
                  color: '#4B3024',
                  border: '1px solid rgba(75, 48, 36, 0.25)',
                  borderRadius: '4px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {isLoadingBatches ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: '#6F4E3E', fontSize: '0.88rem' }}>
            Loading saved batches...
          </div>
        ) : savedBatches.length === 0 ? (
          <div
            style={{
              padding: '1.75rem',
              textAlign: 'center',
              backgroundColor: '#FAF6EE',
              border: '1px dashed rgba(184, 141, 74, 0.4)',
              borderRadius: '4px',
              color: '#6F4E3E',
              fontSize: '0.88rem'
            }}
          >
            {searchQuery.trim()
              ? `No saved batches matched "${searchQuery}".`
              : 'No saved batches yet. Enter your saree batch costs above and tap "Save batch".'}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 295px), 1fr))', gap: '0.9rem' }}>
            {savedBatches.map((item) => {
              const isCurrent = draft.id === item.id;
              const dateText = item.updatedAt || item.createdAt
                ? new Date(item.updatedAt || item.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })
                : '';

              return (
                <article
                  key={item.id}
                  style={{
                    padding: '1rem',
                    borderRadius: '4px',
                    backgroundColor: isCurrent ? '#FAF3E6' : '#FAF6EE',
                    border: isCurrent ? '1.5px solid #B88D4A' : '1px solid rgba(75, 48, 36, 0.14)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.85rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.12rem', color: '#4B3024', margin: 0, wordBreak: 'break-word' }}>
                        {item.name}
                      </h4>
                      {isCurrent && (
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.45rem', backgroundColor: '#B88D4A', color: '#2A1A13', borderRadius: '3px', flexShrink: 0 }}>
                          Open now
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#8F7263', marginTop: '0.25rem' }}>
                      Updated {dateText} • {formatIndianInteger(Number(item.quantity))} sarees
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid rgba(75, 48, 36, 0.1)' }}>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#8F7263', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Total needed
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#4B3024' }}>
                          {formatPaiseCurrency(Math.round(Number(item.totalMoneyNeeded || 0) * 100), { symbol: '₹' })}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#8F7263', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Per saree
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#4B3024' }}>
                          {formatPaiseCurrency(Math.round(Number(item.costPerSaree || 0) * 100), { symbol: '₹' })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => guardActionIfDirty({
                        type: 'open',
                        label: `open "${item.name}"`,
                        execute: () => applyOpenBatch(item.id)
                      })}
                      style={{
                        flex: 1,
                        minHeight: '44px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.3rem',
                        padding: '0.45rem 0.65rem',
                        backgroundColor: '#4B3024',
                        color: '#FAF6EE',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <FolderOpen size={14} />
                      <span>Open</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => guardActionIfDirty({
                        type: 'template',
                        label: `start a template from "${item.name}"`,
                        execute: () => applyUseAsTemplate(item.id)
                      })}
                      style={{
                        flex: 1,
                        minHeight: '44px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.3rem',
                        padding: '0.45rem 0.65rem',
                        backgroundColor: '#FFFDF9',
                        color: '#4B3024',
                        border: '1px solid rgba(75, 48, 36, 0.25)',
                        borderRadius: '4px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <Copy size={14} />
                      <span>Use as template</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      aria-label={`Delete ${item.name}`}
                      style={{
                        minHeight: '44px',
                        minWidth: '44px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0.45rem 0.65rem',
                        backgroundColor: '#FFFDF9',
                        color: '#9E3C2B',
                        border: '1px solid rgba(158, 60, 43, 0.3)',
                        borderRadius: '4px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={14} />
                      <span className="mp-sr-sm">Delete</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#6F4E3E' }}>
              Page {batchesPage} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                disabled={batchesPage <= 1}
                onClick={() => setBatchesPage((p) => Math.max(1, p - 1))}
                style={{
                  minHeight: '44px',
                  padding: '0.45rem 0.9rem',
                  backgroundColor: '#FAF6EE',
                  border: '1px solid rgba(75, 48, 36, 0.2)',
                  borderRadius: '4px',
                  color: '#4B3024',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: batchesPage <= 1 ? 'not-allowed' : 'pointer',
                  opacity: batchesPage <= 1 ? 0.5 : 1
                }}
              >
                Previous
              </button>
              <button
                type="button"
                disabled={batchesPage >= totalPages}
                onClick={() => setBatchesPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  minHeight: '44px',
                  padding: '0.45rem 0.9rem',
                  backgroundColor: '#FAF6EE',
                  border: '1px solid rgba(75, 48, 36, 0.2)',
                  borderRadius: '4px',
                  color: '#4B3024',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: batchesPage >= totalPages ? 'not-allowed' : 'pointer',
                  opacity: batchesPage >= totalPages ? 0.5 : 1
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      <style>{`
        .money-planner-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(350px, 0.92fr);
          gap: 1.25rem;
          align-items: start;
        }
        .money-planner-results-col {
          position: sticky;
          top: 84px;
        }
        .money-line-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 150px 44px;
          gap: 0.5rem;
          align-items: center;
        }
        .mp-sr-sm {
          margin-left: 0.3rem;
        }
        @media (max-width: 1023px) {
          .money-planner-grid {
            grid-template-columns: minmax(0, 1fr);
          }
          .money-planner-results-col {
            position: static;
            order: -1;
          }
        }
        @media (max-width: 560px) {
          .money-line-row {
            grid-template-columns: minmax(0, 1fr) auto;
          }
          .money-line-row > input:first-child {
            grid-column: 1 / -1;
          }
        }
      `}</style>
    </div>
  );
};
