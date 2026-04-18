"""Generate Lawris_Project_Reference.pdf from PROJECT_REFERENCE.md.

Renders a graphic, branded PDF using ReportLab Platypus.
"""
from __future__ import annotations
import re
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, PageBreak,
    Table, TableStyle, KeepTogether, Preformatted,
)
from reportlab.platypus.flowables import HRFlowable, Flowable
from reportlab.pdfgen.canvas import Canvas

# ─── Brand ─────────────────────────────────────────────────────────
INDIGO   = HexColor("#3F3D99")
INDIGO_D = HexColor("#1E1B4B")
INDIGO_L = HexColor("#EEEDFE")
STONE_900 = HexColor("#1C1917")
STONE_700 = HexColor("#44403C")
STONE_500 = HexColor("#78716C")
STONE_200 = HexColor("#E7E5E4")
STONE_100 = HexColor("#F5F5F4")
STONE_50  = HexColor("#FAFAF9")
WHITE    = HexColor("#FFFFFF")
RED      = HexColor("#B91C1C")
AMBER    = HexColor("#B45309")
EMERALD  = HexColor("#059669")

PAGE_W, PAGE_H = A4

# ─── Styles ────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

H1 = ParagraphStyle("H1", parent=styles["Heading1"],
    fontName="Helvetica-Bold", fontSize=22, leading=28,
    textColor=INDIGO_D, spaceBefore=8, spaceAfter=14, alignment=TA_LEFT)

H2 = ParagraphStyle("H2", parent=styles["Heading2"],
    fontName="Helvetica-Bold", fontSize=15, leading=20,
    textColor=INDIGO, spaceBefore=18, spaceAfter=8, alignment=TA_LEFT,
    borderPadding=(6, 0, 6, 8), leftIndent=0)

H3 = ParagraphStyle("H3", parent=styles["Heading3"],
    fontName="Helvetica-Bold", fontSize=12, leading=16,
    textColor=STONE_900, spaceBefore=12, spaceAfter=4, alignment=TA_LEFT)

H4 = ParagraphStyle("H4", parent=styles["Heading4"],
    fontName="Helvetica-Bold", fontSize=11, leading=14,
    textColor=STONE_700, spaceBefore=8, spaceAfter=2, alignment=TA_LEFT)

BODY = ParagraphStyle("Body", parent=styles["BodyText"],
    fontName="Helvetica", fontSize=9.5, leading=14,
    textColor=STONE_900, spaceAfter=6, alignment=TA_LEFT)

BULLET = ParagraphStyle("Bullet", parent=BODY,
    leftIndent=14, bulletIndent=2, spaceAfter=2)

QUOTE = ParagraphStyle("Quote", parent=BODY,
    fontSize=10, leading=15, textColor=INDIGO_D,
    leftIndent=12, borderPadding=(8, 8, 8, 12), backColor=INDIGO_L,
    spaceBefore=6, spaceAfter=10)

CODE_PARA = ParagraphStyle("CodePara", parent=BODY,
    fontName="Courier", fontSize=8.5, leading=12, textColor=STONE_900,
    backColor=STONE_100, leftIndent=8, rightIndent=8,
    borderPadding=(8, 8, 8, 10),
    spaceBefore=6, spaceAfter=10)

INLINE_CODE_TPL = '<font name="Courier" backColor="#F5F5F4" color="#1E1B4B">&nbsp;{code}&nbsp;</font>'

# ─── Inline parser (markdown → ReportLab mini-HTML) ────────────────
def inline_md(text: str) -> str:
    # Escape XML
    s = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    # bold
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
    # italic (avoid matching ** boundaries)
    s = re.sub(r"(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)", r"<i>\1</i>", s)
    # inline code
    s = re.sub(r"`([^`]+)`",
               lambda m: INLINE_CODE_TPL.format(code=m.group(1)), s)
    # Links → just keep label, drop URL
    s = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"<u>\1</u>", s)
    # Strikethrough
    s = re.sub(r"~~(.+?)~~", r"<strike>\1</strike>", s)
    return s

# ─── Section card flowable ─────────────────────────────────────────
class SectionBanner(Flowable):
    """Indigo bar + section number + title — visual section header."""
    def __init__(self, number: str, title: str):
        super().__init__()
        self.number = number
        self.title = title
        self.height = 26 * mm

    def wrap(self, w, h):
        self.width = w
        return (w, self.height)

    def draw(self):
        c: Canvas = self.canv
        w = self.width
        h = self.height
        # full-width indigo bar
        c.setFillColor(INDIGO_D)
        c.rect(0, 0, w, h, stroke=0, fill=1)
        # left accent
        c.setFillColor(HexColor("#A5A1F0"))
        c.rect(0, 0, 4 * mm, h, stroke=0, fill=1)
        # number bubble
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(8 * mm, h - 9 * mm, self.number)
        # title
        c.setFont("Helvetica-Bold", 16)
        c.drawString(20 * mm, h - 9 * mm, self.title)

class StatCard(Flowable):
    """Big number + label, centered."""
    def __init__(self, big: str, label: str, color, width: float):
        super().__init__()
        self.big = big
        self.label = label
        self.color = color
        self.width = width
        self.height = 20 * mm

    def wrap(self, w, h):
        return (self.width, self.height)

    def draw(self):
        c = self.canv
        c.setFillColor(STONE_50)
        c.setStrokeColor(STONE_200)
        c.setLineWidth(0.5)
        c.roundRect(0, 0, self.width, self.height, 3 * mm, stroke=1, fill=1)
        c.setFillColor(self.color)
        c.setFont("Helvetica-Bold", 18)
        c.drawCentredString(self.width / 2, self.height - 9 * mm, self.big)
        c.setFillColor(STONE_500)
        c.setFont("Helvetica", 8)
        c.drawCentredString(self.width / 2, 4 * mm, self.label)

# ─── Markdown block parser ─────────────────────────────────────────
def parse_blocks(md: str):
    """Yield ('type', payload) blocks."""
    lines = md.split("\n")
    i = 0
    while i < len(lines):
        line = lines[i]

        # Code fence
        if line.strip().startswith("```"):
            j = i + 1
            buf = []
            while j < len(lines) and not lines[j].strip().startswith("```"):
                buf.append(lines[j])
                j += 1
            yield ("code", "\n".join(buf))
            i = j + 1
            continue

        # Heading
        m = re.match(r"^(#{1,6})\s+(.+?)\s*$", line)
        if m:
            level = len(m.group(1))
            yield (f"h{level}", m.group(2))
            i += 1
            continue

        # Horizontal rule
        if re.match(r"^-{3,}\s*$", line):
            yield ("hr", None)
            i += 1
            continue

        # Blockquote
        if line.startswith(">"):
            buf = []
            while i < len(lines) and lines[i].startswith(">"):
                buf.append(lines[i].lstrip("> ").rstrip())
                i += 1
            yield ("quote", "\n".join(buf).strip())
            continue

        # Table — line containing | at start (or after spaces) and another | later
        if "|" in line and i + 1 < len(lines) and re.match(r"^\s*\|?[\s:|-]+\|", lines[i + 1] or ""):
            tbl = []
            while i < len(lines) and "|" in lines[i]:
                tbl.append(lines[i])
                i += 1
            yield ("table", tbl)
            continue

        # Ordered list
        if re.match(r"^\s*\d+\.\s+", line):
            buf = []
            while i < len(lines) and re.match(r"^\s*\d+\.\s+", lines[i]):
                buf.append(re.sub(r"^\s*\d+\.\s+", "", lines[i]))
                i += 1
            yield ("ol", buf)
            continue

        # Unordered list
        if re.match(r"^\s*[-*]\s+", line):
            buf = []
            while i < len(lines) and re.match(r"^\s*[-*]\s+", lines[i]):
                buf.append(re.sub(r"^\s*[-*]\s+", "", lines[i]))
                i += 1
            yield ("ul", buf)
            continue

        # Blank
        if not line.strip():
            i += 1
            continue

        # Paragraph (collect until blank or block start)
        buf = [line]
        i += 1
        while i < len(lines) and lines[i].strip() and not re.match(
            r"^(#{1,6}\s|>|```|-{3,}\s*$|\s*\d+\.\s+|\s*[-*]\s+|\|)", lines[i]
        ):
            buf.append(lines[i])
            i += 1
        yield ("p", " ".join(b.strip() for b in buf))

# ─── Convert blocks → Flowables ────────────────────────────────────
def md_table_to_flowable(rows: list[str]):
    # parse markdown table
    parsed = []
    for r in rows:
        cells = [c.strip() for c in r.strip().strip("|").split("|")]
        parsed.append(cells)
    # row 1 header, row 2 separator (skip), rest body
    if len(parsed) < 2:
        return Paragraph(" / ".join(parsed[0]) if parsed else "", BODY)
    header = parsed[0]
    body = parsed[2:] if len(parsed) > 2 else []
    n_cols = len(header)

    # Render cells via Paragraph for inline formatting + wrap
    cell_style = ParagraphStyle("Cell", parent=BODY,
        fontSize=8.5, leading=11, spaceAfter=0)
    head_style = ParagraphStyle("HeadCell", parent=BODY,
        fontSize=8.5, leading=11, fontName="Helvetica-Bold",
        textColor=WHITE, spaceAfter=0)

    data = [[Paragraph(inline_md(c), head_style) for c in header]]
    for row in body:
        # pad/truncate row to n_cols
        row = (row + [""] * n_cols)[:n_cols]
        data.append([Paragraph(inline_md(c), cell_style) for c in row])

    avail = PAGE_W - 40 * mm
    col_w = avail / n_cols
    t = Table(data, colWidths=[col_w] * n_cols, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), INDIGO),
        ("TEXTCOLOR",  (0, 0), (-1, 0), WHITE),
        ("BACKGROUND", (0, 1), (-1, -1), WHITE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, STONE_50]),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LINEBELOW", (0, 0), (-1, 0), 0.5, INDIGO_D),
        ("LINEBELOW", (0, -1), (-1, -1), 0.5, STONE_200),
    ]))
    return KeepTogether([t, Spacer(1, 4 * mm)])

def blocks_to_flowables(blocks):
    flowables = []
    section_num = 0
    for kind, payload in blocks:
        if kind == "h1":
            # Skip — handled by cover
            continue
        if kind == "h2":
            # Major section — page break + banner
            m = re.match(r"^(\d+)\.\s+(.*)", payload)
            if m:
                section_num += 1
                flowables.append(PageBreak())
                flowables.append(SectionBanner(m.group(1) + ".", m.group(2)))
                flowables.append(Spacer(1, 6 * mm))
            else:
                # Non-numbered (like the "Context" intro) — just style as H2
                flowables.append(Paragraph(inline_md(payload), H2))
        elif kind == "h3":
            flowables.append(Paragraph(inline_md(payload), H3))
        elif kind == "h4":
            flowables.append(Paragraph(inline_md(payload), H4))
        elif kind == "p":
            flowables.append(Paragraph(inline_md(payload), BODY))
        elif kind == "quote":
            flowables.append(Paragraph(inline_md(payload), QUOTE))
        elif kind == "code":
            flowables.append(Preformatted(payload, CODE_PARA))
        elif kind == "hr":
            flowables.append(Spacer(1, 2 * mm))
            flowables.append(HRFlowable(width="100%", thickness=0.5, color=STONE_200))
            flowables.append(Spacer(1, 2 * mm))
        elif kind == "ul":
            for item in payload:
                flowables.append(Paragraph("• " + inline_md(item), BULLET))
            flowables.append(Spacer(1, 3 * mm))
        elif kind == "ol":
            for n, item in enumerate(payload, 1):
                flowables.append(Paragraph(f"{n}. " + inline_md(item), BULLET))
            flowables.append(Spacer(1, 3 * mm))
        elif kind == "table":
            flowables.append(md_table_to_flowable(payload))
    return flowables

# ─── Cover page ────────────────────────────────────────────────────
def draw_cover(canvas: Canvas, doc):
    canvas.saveState()
    # Full bleed indigo
    canvas.setFillColor(INDIGO_D)
    canvas.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    # Top accent stripes
    canvas.setFillColor(HexColor("#A5A1F0"))
    canvas.rect(0, PAGE_H - 12 * mm, PAGE_W, 6 * mm, stroke=0, fill=1)
    canvas.setFillColor(HexColor("#6B68C9"))
    canvas.rect(0, PAGE_H - 18 * mm, PAGE_W * 0.4, 2 * mm, stroke=0, fill=1)

    # Big mark
    canvas.setFillColor(WHITE)
    canvas.setFont("Helvetica-Bold", 90)
    canvas.drawString(20 * mm, PAGE_H * 0.55, "lawris.")

    # Tagline
    canvas.setFillColor(HexColor("#C7C4F0"))
    canvas.setFont("Helvetica", 18)
    canvas.drawString(22 * mm, PAGE_H * 0.50, "An AI agent for Indian advocates.")

    # Subtitle
    canvas.setFillColor(WHITE)
    canvas.setFont("Helvetica-Bold", 14)
    canvas.drawString(22 * mm, PAGE_H * 0.36, "Project Reference")
    canvas.setFillColor(HexColor("#9C9AC4"))
    canvas.setFont("Helvetica", 10)
    canvas.drawString(22 * mm, PAGE_H * 0.34, "Tech stack · Architecture · Schema · API · Roadmap")

    # Stats strip
    canvas.setFillColor(WHITE)
    canvas.setFont("Helvetica-Bold", 24)
    y = PAGE_H * 0.22
    stats = [("18", "sections"), ("7", "tables"), ("9", "APIs"), ("4", "AI prompts")]
    for i, (big, lab) in enumerate(stats):
        x = 22 * mm + i * 40 * mm
        canvas.setFillColor(WHITE)
        canvas.setFont("Helvetica-Bold", 28)
        canvas.drawString(x, y, big)
        canvas.setFillColor(HexColor("#9C9AC4"))
        canvas.setFont("Helvetica", 9)
        canvas.drawString(x, y - 5 * mm, lab.upper())

    # Footer
    canvas.setFillColor(HexColor("#6B68C9"))
    canvas.setFont("Helvetica", 9)
    canvas.drawString(22 * mm, 18 * mm, "Hackathon Round 1 — Working Prototype")
    canvas.setFont("Helvetica", 8)
    canvas.drawString(22 * mm, 14 * mm, "lawris · Next.js 14 · Supabase · Google Gemini")
    canvas.drawRightString(PAGE_W - 22 * mm, 14 * mm, "v1.0")
    canvas.restoreState()

# ─── Page header/footer for body pages ─────────────────────────────
def draw_body_chrome(canvas: Canvas, doc):
    canvas.saveState()
    # Header bar
    canvas.setFillColor(WHITE)
    canvas.rect(0, PAGE_H - 12 * mm, PAGE_W, 12 * mm, stroke=0, fill=1)
    canvas.setFillColor(INDIGO_D)
    canvas.setFont("Helvetica-Bold", 10)
    canvas.drawString(20 * mm, PAGE_H - 8 * mm, "lawris.")
    canvas.setFillColor(STONE_500)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(34 * mm, PAGE_H - 8 * mm, "Project Reference")
    canvas.drawRightString(PAGE_W - 20 * mm, PAGE_H - 8 * mm, f"Page {doc.page}")

    # Header rule
    canvas.setStrokeColor(STONE_200)
    canvas.setLineWidth(0.5)
    canvas.line(20 * mm, PAGE_H - 12 * mm, PAGE_W - 20 * mm, PAGE_H - 12 * mm)

    # Footer
    canvas.setFillColor(STONE_500)
    canvas.setFont("Helvetica", 7.5)
    canvas.drawString(20 * mm, 10 * mm,
                      "An AI agent for Indian advocates · Next.js + Supabase + Gemini")
    canvas.drawRightString(PAGE_W - 20 * mm, 10 * mm, "lawris.")
    canvas.restoreState()

# ─── Build doc ─────────────────────────────────────────────────────
def main():
    src = Path("/home/tbuser/vit_hackathon/PROJECT_REFERENCE.md")
    out = Path("/home/tbuser/vit_hackathon/presentation/Lawris_Project_Reference.pdf")
    md = src.read_text(encoding="utf-8")

    blocks = list(parse_blocks(md))

    doc = BaseDocTemplate(
        str(out), pagesize=A4,
        leftMargin=20 * mm, rightMargin=20 * mm,
        topMargin=20 * mm, bottomMargin=20 * mm,
        title="Lawris — Project Reference",
        author="Lawris Team",
    )
    cover_frame = Frame(0, 0, PAGE_W, PAGE_H, id="cover", showBoundary=0,
                        leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    body_frame = Frame(20 * mm, 18 * mm, PAGE_W - 40 * mm, PAGE_H - 36 * mm,
                       id="body", showBoundary=0,
                       leftPadding=0, rightPadding=0, topPadding=4*mm, bottomPadding=0)

    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[cover_frame], onPage=draw_cover),
        PageTemplate(id="body",  frames=[body_frame],  onPage=draw_body_chrome),
    ])

    flowables = [
        # Force the cover to take its own page, then jump to body template
        Spacer(1, PAGE_H - 60 * mm),  # placeholder so cover frame consumes one page
    ]
    # Switch to body template starting next page
    from reportlab.platypus.doctemplate import NextPageTemplate
    flowables.append(NextPageTemplate("body"))
    flowables.append(PageBreak())

    flowables.extend(blocks_to_flowables(blocks))

    doc.build(flowables)
    print(f"Saved: {out}")
    print(f"Pages: ~{doc.page}")

if __name__ == "__main__":
    main()
