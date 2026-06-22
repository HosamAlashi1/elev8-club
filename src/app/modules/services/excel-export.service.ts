import { Injectable } from '@angular/core';
import * as ExcelJS from 'exceljs';

export interface LeadExportRow {
  fullName: string;
  email: string;
  phone?: string;
  country?: string;
  city?: string;
  affiliateName?: string;
  affiliateCode?: string;
  salesName?: string;
  salesMemberName?: string;
  sales_status?: string;
  step: number;
  createdAt: string;
  completedAt?: string;
}

// Brand palette
const GOLD    = 'FFCFAE58';
const DARK    = 'FF1A1A2E';
const LIGHT   = 'FFF8F9FA';
const WHITE   = 'FFFFFFFF';
const BORDER  = 'FFE5E7EB';
const ROW_ALT = 'FFFAFAF8';

const SALES_LABELS: Record<string, string> = {
  new:            'New',
  pre_meeting:    'Pre-Meeting',
  post_meeting:   'Post-Meeting',
  follow_up:      'Follow-up',
  closed:         'Closed',
  not_interested: 'Not Interested',
};

@Injectable({ providedIn: 'root' })
export class ExcelExportService {

  async exportLeads(leads: LeadExportRow[], filename = 'leads'): Promise<void> {
    const wb = new ExcelJS.Workbook();
    wb.creator  = 'Elev8 Club CRM';
    wb.created  = new Date();
    wb.modified = new Date();

    this.buildLeadsSheet(wb, leads);
    this.buildSummarySheet(wb, leads);

    const buffer = await wb.xlsx.writeBuffer();
    this.download(buffer, `${filename}_${this.today()}.xlsx`);
  }

  // ─────────────────────────────────────────────────
  // Sheet 1 — All Leads
  // ─────────────────────────────────────────────────
  private buildLeadsSheet(wb: ExcelJS.Workbook, leads: LeadExportRow[]): void {
    const ws = wb.addWorksheet('Leads', {
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
      properties: { tabColor: { argb: GOLD } }
    });

    // ── Column definitions ──────────────────────────
    ws.columns = [
      { key: 'no',         width: 5  },
      { key: 'name',       width: 24 },
      { key: 'email',      width: 28 },
      { key: 'phone',      width: 16 },
      { key: 'location',   width: 18 },
      { key: 'affiliate',  width: 20 },
      { key: 'code',       width: 10 },
      { key: 'group',      width: 22 },
      { key: 'salesperson',width: 18 },
      { key: 'salesStatus',width: 16 },
      { key: 'status',     width: 13 },
      { key: 'createdAt',  width: 18 },
      { key: 'completedAt',width: 18 },
    ];

    // ── Banner row ──────────────────────────────────
    ws.mergeCells('A1:M1');
    const banner = ws.getCell('A1');
    banner.value = '  ELEV8 CLUB  —  Leads Report';
    banner.font  = { name: 'Calibri', bold: true, size: 16, color: { argb: WHITE } };
    banner.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: DARK } };
    banner.alignment = { vertical: 'middle', horizontal: 'left' };
    ws.getRow(1).height = 38;

    // ── Meta row ────────────────────────────────────
    ws.mergeCells('A2:G2');
    ws.mergeCells('H2:M2');
    const metaLeft  = ws.getCell('A2');
    const metaRight = ws.getCell('H2');
    metaLeft.value  = `  Generated: ${new Date().toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
    metaRight.value = `Total Leads: ${leads.length}  `;
    [metaLeft, metaRight].forEach(c => {
      c.font      = { name: 'Calibri', size: 10, color: { argb: 'FF6B7280' } };
      c.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0EE' } };
      c.alignment = { vertical: 'middle', horizontal: c === metaRight ? 'right' : 'left' };
    });
    ws.getRow(2).height = 22;

    // ── Spacer ───────────────────────────────────────
    ws.getRow(3).height = 6;

    // ── Header row ──────────────────────────────────
    const headers = [
      '#', 'Full Name', 'Email', 'Phone', 'Location',
      'Affiliate', 'Code', 'WA Group', 'Sales Member',
      'Sales Status', 'Status', 'Created At', 'Completed At'
    ];
    const headerRow = ws.addRow(headers);  // row 4
    headerRow.height = 28;
    headerRow.eachCell(cell => {
      cell.font      = { name: 'Calibri', bold: true, size: 10, color: { argb: DARK } };
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: GOLD } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
      cell.border    = this.thinBorder(DARK);
    });

    // ── Data rows ────────────────────────────────────
    leads.forEach((lead, i) => {
      const isAlt = i % 2 === 1;
      const row = ws.addRow([
        i + 1,
        lead.fullName || '',
        lead.email || '',
        lead.phone || '',
        [lead.city, lead.country].filter(Boolean).join(', ') || '',
        lead.affiliateName || '',
        lead.affiliateCode || '',
        lead.salesName || '',
        lead.salesMemberName || '',
        SALES_LABELS[lead.sales_status || ''] || 'New',
        lead.step === 2 ? 'Completed' : 'Pending',
        this.fmt(lead.createdAt),
        lead.completedAt ? this.fmt(lead.completedAt) : '',
      ]);

      row.height = 20;
      const bg = isAlt ? ROW_ALT : WHITE;

      row.eachCell((cell, col) => {
        cell.font      = { name: 'Calibri', size: 10 };
        cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        cell.alignment = { vertical: 'middle', horizontal: col === 1 ? 'center' : 'left' };
        cell.border    = this.thinBorder(BORDER);
      });

      // Colour-code Status column (col 11)
      const statusCell = row.getCell(11);
      if (lead.step === 2) {
        statusCell.font = { name: 'Calibri', size: 10, color: { argb: 'FF166534' }, bold: true };
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
      } else {
        statusCell.font = { name: 'Calibri', size: 10, color: { argb: 'FF92400E' }, bold: true };
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
      }

      // Colour-code Sales Status column (col 10)
      const ssCell = row.getCell(10);
      const ssColors: Record<string, { fg: string; bg: string }> = {
        new:            { fg: 'FF374151', bg: 'FFF3F4F6' },
        pre_meeting:    { fg: 'FF1D4ED8', bg: 'FFDBEAFE' },
        post_meeting:   { fg: 'FF6D28D9', bg: 'FFEDE9FE' },
        follow_up:      { fg: 'FFB45309', bg: 'FFFEF3C7' },
        closed:         { fg: 'FF166534', bg: 'FFDCFCE7' },
        not_interested: { fg: 'FF991B1B', bg: 'FFFEE2E2' },
      };
      const sc = ssColors[lead.sales_status || 'new'] || ssColors['new'];
      ssCell.font = { name: 'Calibri', size: 10, color: { argb: sc.fg }, bold: true };
      ssCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sc.bg } };
    });

    // ── Freeze header ────────────────────────────────
    ws.views = [{ state: 'frozen', ySplit: 4, xSplit: 0, activeCell: 'A5' }];

    // ── Auto-filter ─────────────────────────────────
    ws.autoFilter = { from: 'A4', to: 'M4' };
  }

  // ─────────────────────────────────────────────────
  // Sheet 2 — Summary
  // ─────────────────────────────────────────────────
  private buildSummarySheet(wb: ExcelJS.Workbook, leads: LeadExportRow[]): void {
    const ws = wb.addWorksheet('Summary', {
      properties: { tabColor: { argb: DARK } }
    });
    ws.columns = [{ width: 26 }, { width: 18 }, { width: 16 }];

    // Banner
    ws.mergeCells('A1:C1');
    const b = ws.getCell('A1');
    b.value = '  Summary';
    b.font  = { name: 'Calibri', bold: true, size: 14, color: { argb: WHITE } };
    b.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: DARK } };
    b.alignment = { vertical: 'middle', horizontal: 'left' };
    ws.getRow(1).height = 34;

    // Total
    this.addSummarySection(ws, 3, 'Overview', [
      ['Total Leads',    leads.length],
      ['Completed',      leads.filter(l => l.step === 2).length],
      ['Pending',        leads.filter(l => l.step !== 2).length],
    ]);

    // Sales Status breakdown
    const salesBreakdown = Object.entries(SALES_LABELS).map(([key, label]) => [
      label,
      leads.filter(l => (l.sales_status || 'new') === key).length
    ] as [string, number]);

    this.addSummarySection(ws, 8, 'Sales Status', salesBreakdown);

    // Top affiliates
    const affMap: Record<string, number> = {};
    leads.forEach(l => {
      const n = l.affiliateName || 'None';
      affMap[n] = (affMap[n] || 0) + 1;
    });
    const topAff = Object.entries(affMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => [name, count] as [string, number]);

    this.addSummarySection(ws, 18, 'Top Affiliates', topAff);
  }

  private addSummarySection(ws: ExcelJS.Worksheet, startRow: number, title: string, rows: [string, number][]): void {
    // Section title
    ws.mergeCells(`A${startRow}:C${startRow}`);
    const titleCell = ws.getCell(`A${startRow}`);
    titleCell.value = title;
    titleCell.font  = { name: 'Calibri', bold: true, size: 11, color: { argb: WHITE } };
    titleCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: GOLD } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    ws.getRow(startRow).height = 24;

    // Data rows
    rows.forEach(([label, value], i) => {
      const r  = startRow + 1 + i;
      const bg = i % 2 === 0 ? WHITE : ROW_ALT;
      const labelCell = ws.getCell(`A${r}`);
      const valCell   = ws.getCell(`B${r}`);
      labelCell.value = label;
      valCell.value   = value;
      [labelCell, valCell].forEach(c => {
        c.font      = { name: 'Calibri', size: 10 };
        c.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        c.alignment = { vertical: 'middle', horizontal: c === valCell ? 'center' : 'left', indent: c === labelCell ? 1 : 0 };
        c.border    = this.thinBorder(BORDER);
      });
      valCell.font = { name: 'Calibri', bold: true, size: 11, color: { argb: DARK } };
      ws.getRow(r).height = 20;
    });
  }

  // ─────────────────────────────────────────────────
  private thinBorder(color: string): Partial<ExcelJS.Borders> {
    const s: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: color } };
    return { top: s, left: s, bottom: s, right: s };
  }

  private fmt(ts: string): string {
    if (!ts) return '';
    const d = new Date(ts);
    return isNaN(d.getTime()) ? ts : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  private today(): string {
    return new Date().toISOString().split('T')[0];
  }

  private download(buffer: ArrayBuffer, name: string): void {
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }
}
