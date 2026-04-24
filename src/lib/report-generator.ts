import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  WidthType,
  ShadingType,
  VerticalAlign,
  LevelFormat,
  Header,
  Footer,
  PageNumber,
  PageBreak,
} from "docx";
import { format, parseISO } from "date-fns";

/* ─── Types ────────────────────────────────────────────────── */

export interface ReportData {
  lawyer: { full_name: string; bar_council_no?: string | null };
  client: { full_name: string; phone?: string | null; address?: string | null };
  caseData: {
    title: string;
    case_number?: string | null;
    case_type: string;
    phase: string;
    status: string;
    court_name?: string | null;
    court_type?: string | null;
    fir_date?: string | null;
    fir_number?: string | null;
    offence_max_years?: number | null;
    opposing_party?: string | null;
    notes?: string | null;
    ai_summary?: string | null;
    created_at: string;
  };
  deadlines: Array<{
    title: string;
    deadline_type: string;
    due_date: string;
    urgency: string;
    is_auto_generated: boolean;
    is_completed: boolean;
    notes?: string | null;
  }>;
  hearings: Array<{
    hearing_date: string;
    what_happened: string;
    judge_order?: string | null;
    next_date?: string | null;
    next_action?: string | null;
  }>;
  documents: Array<{
    name: string;
    doc_type: string;
    source: string;
    uploaded_at: string;
  }>;
  researchNotes: Array<{
    query: string;
    content: string;
    citation?: string | null;
    source?: string | null;
    created_at: string;
  }>;
  executiveSummary: string;
  nextSteps: Array<{
    action: string;
    priority: string;
    reason: string;
    deadline_hint?: string | null;
  }>;
  generatedAt: string;
}

/* ─── Theme ────────────────────────────────────────────────── */

const NAVY = "0C1F3F";
const GOLD = "C4972A";
const GOLD_LIGHT = "E8D5A0";
const RED = "C0392B";
const AMBER = "D68910";
const YELLOW = "B7950B";
const GREEN = "1A7A4A";
const GRAY = "64748B";
const LGRAY = "F4F6FA";
const WHITE = "FFFFFF";
const INK = "1A1A2E";
const HAIRLINE = "E0E0E0";

/** Content width in DXA for A4 with 1800/1440 left/right margins. */
const CW = 8666;

/* ─── Helpers ──────────────────────────────────────────────── */

function fmtDate(value?: string | null, fallback = "—"): string {
  if (!value) return fallback;
  try {
    return format(parseISO(value), "dd MMM yyyy");
  } catch {
    return fallback;
  }
}

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function fresh<T>(obj: T): T {
  // docx mutates option objects internally — always hand it a fresh copy.
  return JSON.parse(JSON.stringify(obj)) as T;
}

function hairlineBorders() {
  const side = { style: BorderStyle.SINGLE, size: 1, color: HAIRLINE };
  return {
    top: { ...side },
    bottom: { ...side },
    left: { ...side },
    right: { ...side },
  };
}

function noBorders() {
  const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  return {
    top: { ...none },
    bottom: { ...none },
    left: { ...none },
    right: { ...none },
  };
}

function navyBorders(size = 1) {
  const side = { style: BorderStyle.SINGLE, size, color: NAVY };
  return {
    top: { ...side },
    bottom: { ...side },
    left: { ...side },
    right: { ...side },
  };
}

/* ─── Reusable paragraph helpers ───────────────────────────── */

function sectionHeader(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 400, after: 160 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: GOLD, space: 4 },
    },
    children: [
      new TextRun({
        text,
        bold: true,
        font: "Cambria",
        size: 26,
        color: NAVY,
      }),
    ],
  });
}

function subHeader(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 200, after: 80 },
    children: [
      new TextRun({
        text,
        bold: true,
        font: "Calibri",
        size: 20,
        color: NAVY,
      }),
    ],
  });
}

function bodyPara(
  text: string,
  opts: { size?: number; color?: string; bold?: boolean; align?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {},
): Paragraph {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    alignment: opts.align ?? AlignmentType.JUSTIFIED,
    children: [
      new TextRun({
        text,
        font: "Calibri",
        size: opts.size ?? 22,
        color: opts.color ?? INK,
        bold: opts.bold ?? false,
      }),
    ],
  });
}

function centerPara(text: string, opts: { size?: number; color?: string; bold?: boolean; italic?: boolean; font?: string; spacingBefore?: number; spacingAfter?: number } = {}): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: opts.spacingBefore ?? 0, after: opts.spacingAfter ?? 0 },
    children: [
      new TextRun({
        text,
        bold: opts.bold ?? false,
        italics: opts.italic ?? false,
        font: opts.font ?? "Calibri",
        size: opts.size ?? 20,
        color: opts.color ?? INK,
      }),
    ],
  });
}

function emptyPara(beforeDxa = 0, afterDxa = 0): Paragraph {
  return new Paragraph({ spacing: { before: beforeDxa, after: afterDxa }, children: [] });
}

function divider(): Paragraph {
  return new Paragraph({
    spacing: { before: 200, after: 200 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 2, color: HAIRLINE, space: 6 },
    },
    children: [],
  });
}

function metaRow(label: string, value: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 2200, type: WidthType.DXA },
        shading: { fill: LGRAY, type: ShadingType.CLEAR, color: "auto" },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        borders: hairlineBorders(),
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: label, bold: true, font: "Calibri", size: 20, color: NAVY }),
            ],
          }),
        ],
      }),
      new TableCell({
        width: { size: CW - 2200, type: WidthType.DXA },
        shading: { fill: WHITE, type: ShadingType.CLEAR, color: "auto" },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        borders: hairlineBorders(),
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: value, font: "Calibri", size: 20, color: INK }),
            ],
          }),
        ],
      }),
    ],
  });
}

function urgencyShading(urgency: string): { fill: string; type: typeof ShadingType.CLEAR; color: string } {
  const u = (urgency ?? "").toLowerCase();
  const fill = u === "critical" ? RED : u === "high" ? AMBER : u === "medium" ? YELLOW : LGRAY;
  return { fill, type: ShadingType.CLEAR, color: "auto" };
}

function urgencyTextColor(urgency: string): string {
  const u = (urgency ?? "").toLowerCase();
  if (u === "critical" || u === "high") return WHITE;
  return INK;
}

function headerCell(text: string, widthDxa: number): TableCell {
  return new TableCell({
    width: { size: widthDxa, type: WidthType.DXA },
    shading: { fill: NAVY, type: ShadingType.CLEAR, color: "auto" },
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    borders: navyBorders(1),
    children: [
      new Paragraph({
        children: [
          new TextRun({ text, bold: true, font: "Calibri", size: 20, color: WHITE }),
        ],
      }),
    ],
  });
}

/* ─── Document builder ─────────────────────────────────────── */

export async function generateCaseReportDocx(data: ReportData): Promise<Buffer> {
  const {
    lawyer,
    client,
    caseData,
    deadlines,
    hearings,
    documents,
    researchNotes,
    executiveSummary,
    nextSteps,
    generatedAt,
  } = data;

  const formattedDate = fmtDate(generatedAt);
  const children: Array<Paragraph | Table> = [];

  /* 1. COVER PAGE ─────────────────────────────────────────── */
  children.push(coverAccent());
  children.push(emptyPara(480));
  children.push(
    centerPara(caseData.title, {
      bold: true,
      font: "Cambria",
      size: 28,
      color: NAVY,
      spacingAfter: 120,
    }),
  );
  if (caseData.case_number) {
    children.push(
      centerPara(`Case No. ${caseData.case_number}`, {
        size: 20,
        color: GRAY,
        spacingAfter: 80,
      }),
    );
  }
  if (caseData.court_name) {
    children.push(
      centerPara(caseData.court_name, {
        size: 20,
        color: GRAY,
        spacingAfter: 240,
      }),
    );
  }
  children.push(goldRule());
  children.push(coverInfoTable(data));
  children.push(emptyPara(240));
  children.push(
    centerPara(`Report Generated: ${formattedDate}`, { size: 18, color: GRAY }),
  );
  const enrolBit = lawyer.bar_council_no ? `  ·  Enr. No. ${lawyer.bar_council_no}` : "";
  children.push(
    centerPara(`Prepared by: Adv. ${lawyer.full_name}${enrolBit}`, { size: 18, color: GRAY }),
  );
  children.push(
    centerPara(
      "This report is confidential and prepared for attorney use only. Contents are subject to legal professional privilege.",
      { size: 16, color: GRAY, italic: true, spacingBefore: 360 },
    ),
  );
  children.push(new Paragraph({ children: [new PageBreak()] }));

  /* 2. CASE SNAPSHOT ──────────────────────────────────────── */
  children.push(sectionHeader("Case Snapshot"));
  children.push(snapshotTable(caseData, client));
  if (caseData.ai_summary) {
    children.push(subHeader("AI Running Case Brief"));
    children.push(bodyPara(caseData.ai_summary));
  }
  children.push(divider());

  /* 3. EXECUTIVE SUMMARY ──────────────────────────────────── */
  children.push(sectionHeader("Executive Summary"));
  const paragraphs = (executiveSummary ?? "")
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  if (paragraphs.length === 0) {
    children.push(bodyPara("Executive summary could not be generated at this time."));
  } else {
    for (const para of paragraphs) children.push(bodyPara(para));
  }
  children.push(divider());

  /* 4. KEY HIGHLIGHTS ─────────────────────────────────────── */
  children.push(sectionHeader("Key Highlights & Risk Flags"));

  children.push(subHeader("Critical & High Urgency Deadlines"));
  const urgentPending = deadlines.filter(
    (d) => (d.urgency === "critical" || d.urgency === "high") && !d.is_completed,
  );
  if (urgentPending.length === 0) {
    children.push(bodyPara("No critical or high-urgency deadlines at this time."));
  } else {
    for (const d of urgentPending) {
      children.push(
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { before: 40, after: 40 },
          children: [
            new TextRun({
<<<<<<< HEAD
              text: `${d.title}  —  Due: ${fmtDate(d.due_date)}  [${(d.urgency ?? "").toUpperCase() || "—"}]`,
=======
              text: `${d.title}  —  Due: ${fmtDate(d.due_date)}  [${d.urgency.toUpperCase()}]`,
>>>>>>> 8d990389f3852ff56aabcfdd9ccd2f6781e8fefa
              font: "Calibri",
              size: 21,
              color: INK,
            }),
          ],
        }),
      );
    }
  }

  children.push(subHeader("Pending Action Items from Last Hearing"));
  const sortedHearings = [...hearings].sort(
    (a, b) => new Date(b.hearing_date).getTime() - new Date(a.hearing_date).getTime(),
  );
  const lastHearing = sortedHearings[0];
  if (lastHearing?.next_action) {
    children.push(bodyPara(lastHearing.next_action));
  } else {
    children.push(bodyPara("No pending action items recorded."));
  }

  children.push(subHeader("Case Notes"));
  children.push(bodyPara(caseData.notes ?? "No case notes recorded."));
  children.push(divider());

  /* 5. DEADLINE INTELLIGENCE ──────────────────────────────── */
  children.push(sectionHeader("Deadline Intelligence"));
  if (deadlines.length === 0) {
    children.push(bodyPara("No deadlines have been recorded for this matter."));
  } else {
    children.push(deadlineTable(deadlines));
    children.push(
      new Paragraph({
        spacing: { before: 80 },
        children: [
          new TextRun({
            text: "★ = Auto-computed by Lawris deadline engine (BNSS §187(3) / Limitation Act)",
            italics: true,
            font: "Calibri",
            size: 17,
            color: GRAY,
          }),
        ],
      }),
    );
  }
  children.push(divider());

  /* 6. HEARING HISTORY ────────────────────────────────────── */
  children.push(sectionHeader("Hearing History"));
  if (sortedHearings.length === 0) {
    children.push(bodyPara("No hearings have been logged for this matter."));
  } else {
    children.push(hearingTable(sortedHearings));
  }
  children.push(divider());

  /* 7. LEGAL RESEARCH CITATIONS ───────────────────────────── */
  children.push(sectionHeader("Legal Research & Citations"));
  if (researchNotes.length === 0) {
    children.push(bodyPara("No research notes have been saved for this matter."));
  } else {
    for (const note of researchNotes) {
      children.push(researchBox(note));
      children.push(emptyPara(80));
    }
  }
  children.push(divider());

  /* 8. DOCUMENT INVENTORY ─────────────────────────────────── */
  children.push(sectionHeader("Document Inventory"));
  if (documents.length === 0) {
    children.push(bodyPara("No documents have been attached to this matter."));
  } else {
    children.push(documentTable(documents));
  }
  children.push(divider());

  /* 9. RECOMMENDED NEXT STEPS ─────────────────────────────── */
  children.push(sectionHeader("Recommended Next Steps"));
  children.push(
    bodyPara(
      "The following action items have been identified by the Lawris AI engine based on the current case state, upcoming deadlines, and recent hearing outcomes.",
    ),
  );
  children.push(emptyPara(80));

  const steps = (nextSteps ?? []).slice(0, 5);
  if (steps.length === 0) {
    children.push(bodyPara("No AI-generated next steps available."));
  } else {
    for (const step of steps) {
      children.push(nextStepCard(step));
      children.push(emptyPara(60));
    }
  }

  children.push(emptyPara(240));
  children.push(
    centerPara(
      "Report generated by lawris. — AI Agent for Indian Advocates — lawris.ai",
      { size: 18, color: GRAY, italic: true, spacingBefore: 240 },
    ),
  );

  /* ─── Build document ─────────────────────────────────────── */

  const doc = new Document({
    creator: `Adv. ${lawyer.full_name}`,
    title: `Case Intelligence Report — ${caseData.title}`,
    description: "Generated by Lawris",
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 22 },
        },
        heading1: {
          run: { font: "Cambria", size: 32, bold: true, color: NAVY },
          paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0 },
        },
        heading2: {
          run: { font: "Cambria", size: 26, bold: true, color: NAVY },
          paragraph: { spacing: { before: 280, after: 80 }, outlineLevel: 1 },
        },
      },
    },
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "\u2022",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: { indent: { left: 720, hanging: 360 } },
              },
            },
            {
              level: 1,
              format: LevelFormat.BULLET,
              text: "\u25E6",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: { indent: { left: 1080, hanging: 360 } },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1800 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                border: {
                  bottom: { style: BorderStyle.SINGLE, size: 2, color: GOLD, space: 4 },
                },
                tabStops: [{ type: "right" as const, position: CW }],
                children: [
                  new TextRun({ text: "lawris.", bold: true, font: "Cambria", size: 18, color: NAVY }),
                  new TextRun({ text: "\t" }),
                  new TextRun({
                    text: "Case Intelligence Report · CONFIDENTIAL",
                    italics: true,
                    font: "Calibri",
                    size: 16,
                    color: GRAY,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                border: {
                  top: { style: BorderStyle.SINGLE, size: 1, color: HAIRLINE, space: 4 },
                },
                tabStops: [{ type: "right" as const, position: CW }],
                children: [
                  new TextRun({
                    text: `Generated by Adv. ${lawyer.full_name}  ·  ${formattedDate}`,
                    font: "Calibri",
                    size: 16,
                    color: GRAY,
                  }),
                  new TextRun({ text: "\t" }),
                  new TextRun({ text: "Page ", font: "Calibri", size: 16, color: GRAY }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: "Calibri",
                    size: 16,
                    color: GRAY,
                  }),
                  new TextRun({ text: " of ", font: "Calibri", size: 16, color: GRAY }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    font: "Calibri",
                    size: 16,
                    color: GRAY,
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}

/* ─── Composite building blocks ────────────────────────────── */

function coverAccent(): Table {
  return new Table({
    width: { size: CW, type: WidthType.DXA },
    columnWidths: [CW],
    borders: fresh({
      top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    }),
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: CW, type: WidthType.DXA },
            shading: { fill: NAVY, type: ShadingType.CLEAR, color: "auto" },
            margins: { top: 400, bottom: 400, left: 200, right: 200 },
            verticalAlign: VerticalAlign.CENTER,
            borders: noBorders(),
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "CASE INTELLIGENCE REPORT",
                    bold: true,
                    font: "Cambria",
                    size: 32,
                    color: WHITE,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 120 },
                children: [
                  new TextRun({
                    text: "lawris. — AI Agent for Indian Advocates",
                    italics: true,
                    font: "Calibri",
                    size: 18,
                    color: GOLD_LIGHT,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function goldRule(): Paragraph {
  return new Paragraph({
    spacing: { before: 60, after: 120 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 4, color: GOLD, space: 4 },
    },
    children: [],
  });
}

function coverInfoTable(data: ReportData): Table {
  const { client, caseData } = data;
  const rows: TableRow[] = [
    metaRow("Client", client.full_name),
    metaRow("Opposing Party", caseData.opposing_party ?? "Not specified"),
    metaRow("Case Type", capitalize(caseData.case_type)),
    metaRow("Current Phase", capitalize(caseData.phase)),
    metaRow("Status", capitalize(caseData.status)),
  ];
  const tableWidth = 6000;
  const leftIndent = Math.floor((CW - tableWidth) / 2);

  return new Table({
    width: { size: tableWidth, type: WidthType.DXA },
    columnWidths: [2200, tableWidth - 2200],
    indent: { size: leftIndent, type: WidthType.DXA },
    rows,
  });
}

function snapshotTable(caseData: ReportData["caseData"], client: ReportData["client"]): Table {
  const rows: TableRow[] = [
    metaRow("Client Name", client.full_name),
    metaRow("Client Contact", client.phone ?? "Not on record"),
    metaRow("Case Type", capitalize(caseData.case_type)),
    metaRow("Court", caseData.court_name ?? "Not specified"),
    metaRow("Court Type", caseData.court_type ? capitalize(caseData.court_type.replace(/_/g, " ")) : "—"),
    metaRow("Current Phase", capitalize(caseData.phase)),
    metaRow("Status", capitalize(caseData.status)),
    metaRow("Opposing Party", caseData.opposing_party ?? "—"),
  ];
  if (caseData.case_type === "criminal") {
    rows.push(metaRow("FIR Number", caseData.fir_number ?? "Not recorded"));
    rows.push(metaRow("FIR Date", fmtDate(caseData.fir_date, "Not recorded")));
    rows.push(
      metaRow(
        "Max Sentence",
        caseData.offence_max_years != null ? `${caseData.offence_max_years} years` : "—",
      ),
    );
  }
  rows.push(metaRow("Case Registered", fmtDate(caseData.created_at)));

  return new Table({
    width: { size: CW, type: WidthType.DXA },
    columnWidths: [2200, CW - 2200],
    rows,
  });
}

function deadlineTable(
  deadlines: ReportData["deadlines"],
): Table {
  const colWidths = [3000, 1400, 1400, 1000, 866];
  const sorted = [...deadlines].sort((a, b) => {
    if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });

  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      headerCell("Deadline", colWidths[0]),
      headerCell("Type", colWidths[1]),
      headerCell("Due Date", colWidths[2]),
      headerCell("Urgency", colWidths[3]),
      headerCell("Status", colWidths[4]),
    ],
  });

  const dataRows = sorted.map((d) => {
    const shading = urgencyShading(d.urgency);
    const text = urgencyTextColor(d.urgency);
    const isCritical = (d.urgency ?? "").toLowerCase() === "critical";
    const typeLabel = `${capitalize(d.deadline_type)}${d.is_auto_generated ? " \u2605" : ""}`;

    const cellOf = (value: string, width: number): TableCell =>
      new TableCell({
        width: { size: width, type: WidthType.DXA },
        shading: { ...shading },
        margins: { top: 80, bottom: 80, left: 100, right: 100 },
        borders: hairlineBorders(),
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: value,
                font: "Calibri",
                size: 19,
                color: text,
                bold: isCritical,
              }),
            ],
          }),
        ],
      });

    return new TableRow({
      children: [
        cellOf(d.title, colWidths[0]),
        cellOf(typeLabel, colWidths[1]),
        cellOf(fmtDate(d.due_date), colWidths[2]),
<<<<<<< HEAD
        cellOf(((d.urgency ?? "").toUpperCase() || "—"), colWidths[3]),
=======
        cellOf(d.urgency.toUpperCase(), colWidths[3]),
>>>>>>> 8d990389f3852ff56aabcfdd9ccd2f6781e8fefa
        cellOf(d.is_completed ? "\u2713 Done" : "Pending", colWidths[4]),
      ],
    });
  });

  return new Table({
    width: { size: CW, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...dataRows],
  });
}

function hearingTable(hearings: ReportData["hearings"]): Table {
  const colWidths = [900, 2500, 1800, 900, 2566];

  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      headerCell("Date", colWidths[0]),
      headerCell("What Happened", colWidths[1]),
      headerCell("Judge's Order", colWidths[2]),
      headerCell("Next Date", colWidths[3]),
      headerCell("Next Action Required", colWidths[4]),
    ],
  });

  const rows = hearings.map((h, i) => {
    const fill = i % 2 === 0 ? WHITE : LGRAY;
    const bg = { fill, type: ShadingType.CLEAR, color: "auto" };
    const buildCell = (value: string, size: number, bold: boolean, width: number) =>
      new TableCell({
        width: { size: width, type: WidthType.DXA },
        shading: { ...bg },
        margins: { top: 80, bottom: 80, left: 100, right: 100 },
        borders: hairlineBorders(),
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: value, font: "Calibri", size, color: INK, bold }),
            ],
          }),
        ],
      });

    return new TableRow({
      children: [
        buildCell(fmtDate(h.hearing_date), 19, true, colWidths[0]),
        buildCell(h.what_happened ?? "—", 18, false, colWidths[1]),
        buildCell(h.judge_order ?? "—", 18, false, colWidths[2]),
        buildCell(h.next_date ? fmtDate(h.next_date) : "—", 18, false, colWidths[3]),
        buildCell(h.next_action ?? "—", 18, false, colWidths[4]),
      ],
    });
  });

  return new Table({
    width: { size: CW, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...rows],
  });
}

function researchBox(note: ReportData["researchNotes"][number]): Table {
<<<<<<< HEAD
  const raw = note.content ?? "";
  const content = raw.length > 500 ? raw.slice(0, 500) + "\u2026" : raw;
=======
  const content = note.content.length > 500 ? note.content.slice(0, 500) + "\u2026" : note.content;
>>>>>>> 8d990389f3852ff56aabcfdd9ccd2f6781e8fefa
  const sourceLabel = note.source ?? "AI Research";
  return new Table({
    width: { size: CW, type: WidthType.DXA },
    columnWidths: [CW],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: CW, type: WidthType.DXA },
            shading: { fill: LGRAY, type: ShadingType.CLEAR, color: "auto" },
            margins: { top: 120, bottom: 120, left: 200, right: 120 },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: HAIRLINE },
              right: { style: BorderStyle.SINGLE, size: 1, color: HAIRLINE },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: HAIRLINE },
              left: { style: BorderStyle.SINGLE, size: 12, color: NAVY },
            },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "Q: ", bold: true, font: "Calibri", size: 20, color: NAVY }),
                  new TextRun({ text: note.query, bold: true, font: "Calibri", size: 20, color: NAVY }),
                ],
              }),
              new Paragraph({
                spacing: { before: 60 },
                children: [
                  new TextRun({ text: content, font: "Calibri", size: 19, color: INK }),
                ],
              }),
              ...(note.citation
                ? [
                    new Paragraph({
                      spacing: { before: 60 },
                      children: [
                        new TextRun({
                          text: `Citation: ${note.citation}`,
                          bold: true,
                          font: "Calibri",
                          size: 18,
                          color: GRAY,
                        }),
                      ],
                    }),
                  ]
                : []),
              new Paragraph({
                spacing: { before: 40 },
                children: [
                  new TextRun({
                    text: `Source: ${sourceLabel}  ·  ${fmtDate(note.created_at)}`,
                    italics: true,
                    font: "Calibri",
                    size: 17,
                    color: GRAY,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function documentTable(documents: ReportData["documents"]): Table {
  const colWidths = [3600, 1500, 1500, 2066];
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      headerCell("Document Name", colWidths[0]),
      headerCell("Type", colWidths[1]),
      headerCell("Source", colWidths[2]),
      headerCell("Date Added", colWidths[3]),
    ],
  });

  const sourceLabel = (source: string): string => {
    switch (source) {
      case "uploaded":
        return "\u{1F4CE} Uploaded";
      case "ai_drafted":
        return "\u2728 AI Drafted";
      case "ai_assisted":
        return "\u26A1 AI Assisted";
      default:
        return source;
    }
  };

  const rows = documents.map((d, i) => {
    const fill = i % 2 === 0 ? WHITE : LGRAY;
    const bg = { fill, type: ShadingType.CLEAR, color: "auto" };
    const cellOf = (value: string, width: number) =>
      new TableCell({
        width: { size: width, type: WidthType.DXA },
        shading: { ...bg },
        margins: { top: 80, bottom: 80, left: 100, right: 100 },
        borders: hairlineBorders(),
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: value, font: "Calibri", size: 19, color: INK }),
            ],
          }),
        ],
      });

    return new TableRow({
      children: [
        cellOf(d.name, colWidths[0]),
        cellOf(capitalize((d.doc_type ?? "").replace(/_/g, " ")), colWidths[1]),
        cellOf(sourceLabel(d.source), colWidths[2]),
        cellOf(fmtDate(d.uploaded_at), colWidths[3]),
      ],
    });
  });

  return new Table({
    width: { size: CW, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...rows],
  });
}

function nextStepCard(step: ReportData["nextSteps"][number]): Table {
  const priority = (step.priority ?? "normal").toLowerCase();
  const { bg, marker } =
    priority === "urgent"
      ? { bg: RED, marker: "!" }
      : priority === "high"
        ? { bg: AMBER, marker: "\u2191" }
        : { bg: GREEN, marker: "\u2192" };

  const leftWidth = 200;
  const rightWidth = CW - leftWidth;

  const rightChildren: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({ text: step.action, bold: true, font: "Calibri", size: 20, color: NAVY }),
      ],
    }),
    new Paragraph({
      spacing: { before: 60 },
      children: [
        new TextRun({ text: step.reason, font: "Calibri", size: 19, color: GRAY }),
      ],
    }),
  ];
  if (step.deadline_hint) {
    rightChildren.push(
      new Paragraph({
        spacing: { before: 60 },
        children: [
          new TextRun({
            text: `\u23F0 ${step.deadline_hint}`,
            bold: true,
            font: "Calibri",
            size: 18,
            color: priority === "urgent" ? RED : priority === "high" ? AMBER : GREEN,
          }),
        ],
      }),
    );
  }

  return new Table({
    width: { size: CW, type: WidthType.DXA },
    columnWidths: [leftWidth, rightWidth],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: leftWidth, type: WidthType.DXA },
            shading: { fill: bg, type: ShadingType.CLEAR, color: "auto" },
            margins: { top: 120, bottom: 120, left: 40, right: 40 },
            verticalAlign: VerticalAlign.CENTER,
            borders: noBorders(),
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: marker, bold: true, font: "Cambria", size: 18, color: WHITE }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: rightWidth, type: WidthType.DXA },
            shading: { fill: WHITE, type: ShadingType.CLEAR, color: "auto" },
            margins: { top: 100, bottom: 100, left: 160, right: 120 },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: HAIRLINE },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: HAIRLINE },
              right: { style: BorderStyle.SINGLE, size: 1, color: HAIRLINE },
              left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            },
            children: rightChildren,
          }),
        ],
      }),
    ],
  });
}

/* Suppress unused-heading-level diagnostic — we re-export some constants that
   the spec mentions but aren't strictly needed at runtime. Keeps the import
   list stable if you later want to extend sections. */
export { HeadingLevel };
