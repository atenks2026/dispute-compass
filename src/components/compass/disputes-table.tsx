'use client';

/**
 * Dispute Compass — disputes list backed by AG Grid (Community).
 * Sponsor-tool integration: AG Grid provides sorting, quick filtering,
 * column pinning and keyboard navigation over the dispute portfolio.
 */

import { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeQuartz, type ColDef, type CellClassParams } from 'ag-grid-community';
import type { DeadlineWindow, Dispute } from '@/lib/types';

ModuleRegistry.registerModules([AllCommunityModule]);

export interface RowData extends Dispute {
  urgencyRank: number;
  nextDeadlineLabel: string;
  nextDeadlineDays: number;
  nextDeadlineKind: DeadlineWindow['kind'] | 'NONE';
}

export function toRowData(d: Dispute, deadlines: DeadlineWindow[]): RowData {
  const active = deadlines.filter((w) => w.daysRemaining >= 0).sort((a, b) => a.daysRemaining - b.daysRemaining);
  const next = active[0];
  return {
    ...d,
    urgencyRank: next ? Math.min(next.daysRemaining, 99) : 999,
    nextDeadlineLabel: next ? next.label : 'No active deadline',
    nextDeadlineDays: next ? next.daysRemaining : -1,
    nextDeadlineKind: next ? next.kind : 'NONE',
  };
}

const urgencyDot = (days: number) => (days < 0 ? 'bg-neutral-300' : days <= 2 ? 'bg-red-500' : days <= 5 ? 'bg-amber-500' : 'bg-emerald-500');

export function DeadlineDot({ days }: { days: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${urgencyDot(days)}`} aria-hidden />
      <span>{days < 0 ? '—' : `${days} d`}</span>
    </div>
  );
}

const theme = themeQuartz.withParams({
  accentColor: '#059669',
  headerBackgroundColor: '#f5f5f4',
  headerTextColor: '#44403c',
  rowHoverColor: '#ecfdf5',
  borderColor: '#e7e5e4',
  fontFamily: 'inherit',
  fontSize: 13,
  headerHeight: 38,
  rowHeight: 42,
});

interface Props {
  disputes: RowData[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function DisputesTable({ disputes, selectedId, onSelect }: Props) {
  const columnDefs = useMemo<ColDef<RowData>[]>(
    () => [
      {
        headerName: 'Case',
        field: 'dispute_id',
        pinned: 'left',
        width: 130,
        cellClass: (p: CellClassParams<RowData>) =>
          `font-medium cursor-pointer ${p.data?.dispute_id === selectedId ? 'text-emerald-700' : 'text-stone-800'}`,
      },
      {
        headerName: 'Reason',
        field: 'reason',
        flex: 1,
        minWidth: 170,
        valueFormatter: (p) => String(p.value || '').replaceAll('_', ' ').toLowerCase(),
      },
      {
        headerName: 'Amount',
        field: 'amount',
        width: 110,
        valueGetter: (p) => `${p.data?.amount.currency} ${Number(p.data?.amount.value || 0).toLocaleString('en-US')}`,
        cellClass: 'tabular-nums',
      },
      {
        headerName: 'Stage',
        field: 'stage',
        width: 150,
        valueFormatter: (p) => String(p.value || '').replaceAll('_', ' '),
      },
      {
        headerName: 'Next deadline',
        colId: 'deadline',
        width: 130,
        sortIndex: 0,
        sort: 'asc',
        valueGetter: (p) => (p.data && p.data.nextDeadlineDays >= 0 ? p.data.nextDeadlineDays : 999),
        cellRenderer: (p: { data?: RowData }) => (p.data ? <DeadlineDot days={p.data.nextDeadlineDays} /> : null),
        comparator: (a: number, b: number) => a - b,
      },
      {
        headerName: 'Status',
        field: 'status',
        width: 190,
        valueFormatter: (p) => String(p.value || '').replaceAll('_', ' '),
      },
      {
        headerName: 'Source',
        field: 'source',
        width: 110,
        valueFormatter: (p) => (p.value === 'DEMO' ? 'Demo case' : 'Live sandbox'),
      },
    ],
    [selectedId],
  );

  return (
    <div className="h-[420px] w-full lg:h-[520px]" role="grid" aria-label="Disputes">
      <AgGridReact<RowData>
        theme={theme}
        rowData={disputes}
        columnDefs={columnDefs}
        rowSelection={{ mode: 'singleRow', checkboxes: false, enableClickSelection: true }}
        getRowId={(p) => p.data!.dispute_id}
        onRowClicked={(e) => e.data && onSelect(e.data.dispute_id)}
        rowClassRules={{
          'bg-emerald-50/70': (p) => p.data?.dispute_id === selectedId,
        }}
        defaultColDef={{ resizable: true, sortable: true, filter: false }}
        animateRows={false}
        suppressCellFocus
        enableCellTextSelection
      />
    </div>
  );
}
