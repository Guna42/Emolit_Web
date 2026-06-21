import io
import os
import math
from datetime import datetime, timedelta
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable, Image)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.graphics.shapes import Drawing, Rect
from reportlab.graphics.charts.piecharts import Pie
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# --- UNICODE FONT REGISTRATION (For Non-Latin Scripts) ---
UNICODE_FONT = 'Helvetica'
UNICODE_FONT_BOLD = 'Helvetica-Bold'
UNICODE_FONT_ITALIC = 'Helvetica-Oblique'

debug_log = os.path.join(os.getcwd(), "font_debug.log")

try:
    # Try common Windows Unicode fonts in order of preference
    font_candidates = [
        ("Nirmala", "C:/Windows/Fonts/Nirmala.ttc", 0), # Nirmala UI Regular
        ("SegoeUI", "C:/Windows/Fonts/segoeui.ttf", None),
        ("Arial", "C:/Windows/Fonts/arial.ttf", None)
    ]
    
    with open(debug_log, "a", encoding='utf-8') as f:
        f.write(f"\n--- FONT REGISTRATION ATTEMPT {datetime.now()} ---\n")
        
    for name, path, index in font_candidates:
        if os.path.exists(path):
            try:
                if index is not None:
                    # Correct argument for TTC in ReportLab is subfontIndex
                    pdfmetrics.registerFont(TTFont(name, path, subfontIndex=index))
                    pdfmetrics.registerFont(TTFont(name + "-Bold", path, subfontIndex=1))
                else:
                    pdfmetrics.registerFont(TTFont(name, path))
                
                UNICODE_FONT = name
                UNICODE_FONT_BOLD = name + "-Bold" if index is not None else name
                UNICODE_FONT_ITALIC = name
                
                with open(debug_log, "a", encoding='utf-8') as f:
                    f.write(f"SUCCESS: Registered {name} from {path}\n")
                break # Found a working font
            except Exception as e:
                with open(debug_log, "a", encoding='utf-8') as f:
                    f.write(f"FAIL: Register {name} from {path}: {str(e)}\n")
        else:
            with open(debug_log, "a", encoding='utf-8') as f:
                f.write(f"MISSING: Font path does not exist: {path}\n")

except Exception as e:
    # Use standard error logging if file write fails
    print(f"CRITICAL FONT ERROR: {str(e)}")

# --- ELEGANT PALETTE (SOVEREIGN BRANDING) ---
PURE_WHITE    = colors.HexColor("#FFFFFF")
BG_HIGHLIGHT  = colors.HexColor("#F9FBF9")
DEEP_GREEN    = colors.HexColor("#1B4332")
FOREST        = colors.HexColor("#2D6A4F")
SAGE          = colors.HexColor("#52B788")
MINT_LIGHT    = colors.HexColor("#B7E4C7")
GOLD_ACCENT   = colors.HexColor("#D4AF37")
WARM_GRAY     = colors.HexColor("#6B7280")
LIGHT_GRAY    = colors.HexColor("#E5E7EB")
INK           = colors.HexColor("#111827")
PALE_MINT     = colors.HexColor("#E8F5E9")

PSYCH_QUOTES = [
    "Your emotions are not obstacles to clarity.\nThey are the path to it.",
    "You cannot heal what you refuse to feel.\nBut you have already begun.",
    "Every time you name what you feel,\nyou reclaim a piece of yourself.",
    "The days you almost didn't open the app\nare the days it mattered most.",
]

# --- PREMIUM COVER DESIGN ---
def draw_premium_cover(canvas, doc):
    W, H = A4
    canvas.saveState()
    canvas.setFillColor(PURE_WHITE); canvas.rect(0, 0, W, H, fill=1, stroke=0)
    canvas.setFillColor(BG_HIGHLIGHT); canvas.rect(0, 0, W, H, fill=1, stroke=0)

    margin = 12*mm
    canvas.setStrokeColor(SAGE); canvas.setStrokeAlpha(0.35); canvas.setLineWidth(0.6)
    canvas.rect(margin, margin, W - 2*margin, H - 2*margin, fill=0, stroke=1)
    inner_m = 14.5*mm
    canvas.setStrokeAlpha(0.15); canvas.setLineWidth(0.3)
    canvas.rect(inner_m, inner_m, W - 2*inner_m, H - 2*inner_m, fill=0, stroke=1)

    def bracket(cx, cy, fx=1, fy=1):
        canvas.saveState(); canvas.translate(cx, cy)
        canvas.setStrokeColor(DEEP_GREEN); canvas.setStrokeAlpha(0.6); canvas.setLineWidth(1.5)
        canvas.line(0, 0, fx * 14*mm, 0); canvas.line(0, 0, 0, fy * 14*mm)
        canvas.setFillColor(SAGE); canvas.circle(0, 0, 2.2, fill=1, stroke=0)
        canvas.restoreState()

    bracket(margin, margin, 1, 1); bracket(W-margin, margin, -1, 1)
    bracket(margin, H-margin, 1, -1); bracket(W-margin, H-margin, -1, -1)

    canvas.setFillColor(SAGE); canvas.setFont("Helvetica", 7.5); label = "E M O T I O N A L   I N T E L L I G E N C E   P L A T F O R M"
    canvas.drawCentredString(W/2, H - 28*mm, label)
    canvas.setStrokeColor(SAGE); canvas.setStrokeAlpha(0.3); canvas.setLineWidth(0.5)
    canvas.line(W/2 - 40*mm, H - 31*mm, W/2 + 40*mm, H - 31*mm)

    logo_size = 85*mm; logo_y = H/2 - logo_size/2 + 15*mm
    canvas.setFillColor(PALE_MINT); canvas.setFillAlpha(0.55); canvas.circle(W/2, logo_y + logo_size/2, logo_size/2 + 8*mm, fill=1, stroke=0)
    canvas.setFillAlpha(0.25); canvas.circle(W/2, logo_y + logo_size/2, logo_size/2 + 15*mm, fill=1, stroke=0); canvas.setFillAlpha(1.0)
    
    logo_path = os.path.join(os.getcwd(), "logo.png")
    if os.path.exists(logo_path):
        canvas.drawImage(logo_path, W/2-logo_size/2, logo_y, width=logo_size, height=logo_size, mask='auto', preserveAspectRatio=True)

    tag_y = H/2 - logo_size/2
    canvas.setFillColor(FOREST); canvas.setFont("Helvetica", 11); canvas.drawCentredString(W/2, tag_y, "Track \u00b7 Reflect \u00b7 Grow")

    quote_y = tag_y - 25*mm
    canvas.setFillColor(MINT_LIGHT); canvas.setFont("Helvetica-Bold", 48); canvas.drawString(W/2 - 60*mm, quote_y + 2*mm, "\u201C")
    canvas.setFillColor(INK); canvas.setFont("Helvetica-Oblique", 11)
    canvas.drawCentredString(W/2, quote_y - 4*mm, "Your emotions are data, not chaos.")
    canvas.drawCentredString(W/2, quote_y - 10*mm, "Understand yourself, one day at a time.")
    canvas.setFillColor(MINT_LIGHT); canvas.setFont("Helvetica-Bold", 48); canvas.drawString(W/2 + 50*mm, quote_y - 15*mm, "\u201D")

    bot_y = margin + 16*mm
    canvas.setStrokeColor(LIGHT_GRAY); canvas.setLineWidth(0.5); canvas.line(margin + 10*mm, bot_y + 5*mm, W - margin - 10*mm, bot_y + 5*mm)
    canvas.setFillColor(WARM_GRAY); canvas.setFont("Helvetica", 7.5); canvas.drawString(margin + 12*mm, bot_y, "Version 2.5.0")
    canvas.drawCentredString(W/2, bot_y, datetime.now().strftime("%B %Y"))
    canvas.drawRightString(W - margin - 12*mm, bot_y, "Sovereign Growth Registry"); canvas.restoreState()

def draw_inner_footer(canvas, doc):
    W, H = A4
    canvas.saveState()
    # Watermark
    canvas.setFillColor(PALE_MINT); canvas.setFillAlpha(0.08); canvas.setFont("Helvetica-Bold", 70)
    canvas.translate(W/2, H/2); canvas.rotate(35)
    tw = canvas.stringWidth("EMOLIT","Helvetica-Bold",70)
    canvas.drawString(-tw/2, 0, "EMOLIT")
    canvas.restoreState()
    # Footer
    canvas.saveState()
    canvas.setStrokeColor(PALE_MINT); canvas.setLineWidth(0.5); canvas.line(15*mm, 14*mm, W-15*mm, 14*mm)
    canvas.setFillColor(SAGE); canvas.circle(15*mm, 14*mm, 1.8, fill=1, stroke=0); canvas.circle(W-15*mm, 14*mm, 1.8, fill=1, stroke=0)
    canvas.setFillColor(WARM_GRAY); canvas.setFont("Helvetica", 7.5)
    canvas.drawString(18*mm, 9*mm, "EMOLIT  \u00b7  Emotional Intelligence Platform")
    canvas.drawCentredString(W/2, 9*mm, datetime.now().strftime("%B %Y"))
    canvas.drawRightString(W-18*mm, 9*mm, f"Page {doc.page}")
    canvas.restoreState()

# --- COMPONENTS ---
def sec_header(label, title):
    return [
        Paragraph(f'<font size="7.5" color="#52B788"><b>{label}</b></font>', ParagraphStyle("lbl", fontName="Helvetica-Bold", spaceAfter=1)),
        Paragraph(f'<font size="22" color="#1B4332"><b>{title}</b></font>', ParagraphStyle("ttl", fontName="Helvetica-Bold", leading=28, spaceAfter=2)),
        HRFlowable(width="100%", thickness=0.8, color=MINT_LIGHT, spaceBefore=1*mm, spaceAfter=6*mm),
    ]

def quote_card(text):
    content = text.replace("\n", "<br/>")
    t = Table([[
        Paragraph('<font size="36" color="#52B788"><b>\u201C</b></font>', ParagraphStyle("ql", fontName="Helvetica-Bold", leading=40)),
        Paragraph(f'<font size="12" color="#F9FBF9"><i>{content}</i></font>', ParagraphStyle("qc", alignment=TA_CENTER, leading=20, fontName="Helvetica-Oblique")),
        Paragraph('<font size="36" color="#52B788"><b>\u201D</b></font>', ParagraphStyle("qr", fontName="Helvetica-Bold", leading=40, alignment=TA_RIGHT)),
    ]], colWidths=[1.2*cm, 14.0*cm, 1.2*cm])
    t.setStyle(TableStyle([("BACKGROUND", (0,0),(-1,-1), DEEP_GREEN), ("TOPPADDING", (0,0),(-1,-1), 18), ("BOTTOMPADDING", (0,0),(-1,-1), 18), ("LINEABOVE", (0,0),(-1,0), 1.5, GOLD_ACCENT), ("LINEBELOW", (0,-1),(-1,-1), 1.5, GOLD_ACCENT)]))
    return t

def stat_card_row(items):
    cells = []
    for val, label, sub, col_hex in items:
        cells.append(Table([
            [Paragraph(f'<font size="28" color="{col_hex}"><b>{val}</b></font>', ParagraphStyle("sv", alignment=TA_CENTER, leading=32))],
            [Paragraph(f'<font size="8.5" color="#111827"><b>{label}</b></font>', ParagraphStyle("sl", alignment=TA_CENTER, spaceAfter=3))],
            [Paragraph(f'<font size="7.5" color="#6B7280">{sub}</font>', ParagraphStyle("ss", alignment=TA_CENTER))],
        ], colWidths=[4.0*cm], style=[
            ("BACKGROUND", (0,0),(-1,-1), PURE_WHITE),
            ("LINEABOVE", (0,0),(-1,0), 3.5, colors.HexColor(col_hex)),
            ("BOX", (0,0),(-1,-1), 0.5, LIGHT_GRAY),
            ("TOPPADDING", (0,0),(-1,-1), 12),
            ("BOTTOMPADDING", (0,0),(-1,-1), 12)
        ]))
    return Table([cells], colWidths=[4.1*cm]*len(cells), style=[("VALIGN", (0,0),(-1,-1), "TOP")])

def generate_monthly_report(user_email, entries, month=None, year=None, timezone_offset=0):
    import calendar as cal_lib

    # Shift all entry created_at datetimes by subtracting timezone_offset minutes
    # e.g., if user timezone is IST (+05:30), offset is -330 minutes, so we add 330 minutes.
    adjusted_entries = []
    for e in entries:
        new_e = dict(e)
        cat = e.get("created_at")
        if isinstance(cat, datetime):
            new_e["created_at"] = cat - timedelta(minutes=timezone_offset)
        adjusted_entries.append(new_e)
    entries = adjusted_entries

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        rightMargin=1.8*cm, leftMargin=1.8*cm,
        topMargin=1.8*cm, bottomMargin=2.2*cm
    )

    # ── STYLES ────────────────────────────────────────────────────────────────
    p_body       = ParagraphStyle('PBody',      fontSize=11, textColor=INK,       fontName=UNICODE_FONT,      leading=16)
    p_body_muted = ParagraphStyle('PBodyMuted', fontSize=10, textColor=WARM_GRAY, fontName=UNICODE_FONT_ITALIC, leading=14)

    # ── DATA ENGINE ───────────────────────────────────────────────────────────
    now      = datetime.utcnow() - timedelta(minutes=timezone_offset)
    journals = [e for e in entries if e.get("entry_type") == "journal_entry"]
    words    = [e for e in entries if e.get("entry_type") == "learned_word"]

    if month and year:
        days_in_month = cal_lib.monthrange(year, month)[1]
        first_weekday = cal_lib.monthrange(year, month)[0]  # 0=Mon … 6=Sun
        period_label  = datetime(year, month, 1).strftime("%B %Y")

        # Day-of-month numbers (1..N) that had any entry
        active_day_set = set()
        for e in entries:
            cat = e.get("created_at")
            if isinstance(cat, datetime) and cat.year == year and cat.month == month:
                active_day_set.add(cat.day)
    else:
        days_in_month = 30
        first_weekday = 0
        period_label  = "Last 30 Days"

        active_day_set = set()
        for e in entries:
            cat = e.get("created_at")
            if isinstance(cat, datetime):
                diff = (now.date() - cat.date()).days
                if 0 <= diff < 30:
                    active_day_set.add(30 - diff)   # day 30 = today

    active_days   = len(active_day_set)
    sorted_active = sorted(active_day_set)

    # Best streak (longest consecutive run of day numbers)
    max_streak = 0
    cur_s      = 0
    prev_d     = None
    for d in sorted_active:
        cur_s = (cur_s + 1) if (prev_d is not None and d == prev_d + 1) else 1
        if cur_s > max_streak:
            max_streak = cur_s
        prev_d = d

    # Current (tail) streak — consecutive run ending at today's day number
    if month and year:
        today_num = now.day if (now.year == year and now.month == month) else days_in_month
    else:
        today_num = 30

    tail_streak = 0
    start_day = today_num
    if today_num not in active_day_set and (today_num - 1) in active_day_set:
        start_day = today_num - 1

    for d in sorted(sorted_active, reverse=True):
        if d == start_day - tail_streak:
            tail_streak += 1
        else:
            break

    # Emotion frequency — MUST read from 'ai_analysis' (correct DB field)
    emotion_map = {}
    emotion_days = {}
    for j in journals:
        ana = j.get("ai_analysis") or j.get("ai_response") or {}
        created_at = j.get("created_at")
        if isinstance(created_at, datetime):
            day_str = created_at.strftime("%b %d") # e.g. "May 28"
        else:
            day_str = "Unknown Date"
            
        for emo in ana.get("detected_emotions", []):
            name = (emo.get("word") or "").strip()
            if name:
                emotion_map[name] = emotion_map.get(name, 0) + 1
                if name not in emotion_days:
                    emotion_days[name] = []
                if day_str not in emotion_days[name] and day_str != "Unknown Date":
                    emotion_days[name].append(day_str)

    # ── CHART PALETTE ─────────────────────────────────────────────────────────
    PAL = [
        colors.HexColor("#1B4332"),
        colors.HexColor("#4338CA"),
        colors.HexColor("#B45309"),
        colors.HexColor("#BE123C"),
        colors.HexColor("#0F766E"),
        colors.HexColor("#6D28D9"),
    ]

    story = [PageBreak()]   # triggers cover page

    # ════════════════════════════════════════════════════════════════════════
    # PAGE 2: MONTHLY REPORT OVERVIEW
    # ════════════════════════════════════════════════════════════════════════
    story += sec_header("YOUR MONTHLY SUMMARY", "Monthly Report")

    # ── Row 1: Stat cards (full width) ───────────────────────────────────────
    story.append(stat_card_row([
        (str(active_days),   "ACTIVE DAYS",    period_label,        "#1B4332"),
        (str(len(journals)), "JOURNALS",        "entries logged",    "#2D6A4F"),
        (f"{max_streak}d",  "BEST STREAK",     "consecutive days",  "#D4AF37"),
        (f"{tail_streak}d", "CURRENT STREAK",  "active momentum",   "#52B788"),
    ]))
    story.append(Spacer(1, 0.9*cm))

    # ── Activity calendar grid block (centered) ─────────────────────────────
    cal_hdr = Paragraph(
        f'<font name="Helvetica-Bold" size="9.5" color="#2D6A4F">ACTIVITY CALENDAR — {period_label}</font>',
        ParagraphStyle("rhdr_v2", spaceAfter=8, alignment=TA_CENTER)
    )

    COL_W = 2.25*cm    # 7 × 2.25 = 15.75 cm
    ROW_H = 0.9*cm     # generous row height for spacious layout

    # Day-of-week header
    dow_row = [
        Paragraph(
            f'<font name="Helvetica-Bold" size="9" color="#9CA3AF">{d}</font>',
            ParagraphStyle(f"dh_v2_{i}", alignment=TA_CENTER)
        )
        for i, d in enumerate(["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"])
    ]

    offset  = (first_weekday + 1) % 7
    n_cells = offset + days_in_month
    while n_cells % 7:
        n_cells += 1

    cal_cells = []
    for idx in range(n_cells):
        day_n = idx - offset + 1
        if day_n < 1 or day_n > days_in_month:
            cal_cells.append(Paragraph("", ParagraphStyle(f"emp_v2_{idx}")))
        else:
            is_active = day_n in active_day_set
            txt_hex   = "#FFFFFF" if is_active else "#374151"
            cal_cells.append(Paragraph(
                f'<font name="Helvetica-Bold" size="10.5" color="{txt_hex}">{day_n:02d}</font>',
                ParagraphStyle(f"dc_v2_{idx}", alignment=TA_CENTER)
            ))

    n_weeks  = n_cells // 7
    cal_data = [dow_row] + [cal_cells[r * 7:(r + 1) * 7] for r in range(n_weeks)]
    cal_tbl  = Table(cal_data, colWidths=[COL_W] * 7,
                     rowHeights=[0.7*cm] + [ROW_H] * n_weeks)

    cal_style = [
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
        ("TOPPADDING",    (0,0), (-1,-1), 4),
        ("BOTTOMPADDING", (0,0), (-1,-1), 4),
        ("GRID",          (0,1), (-1,-1), 1.5, PURE_WHITE),
    ]
    for idx in range(n_cells):
        day_n = idx - offset + 1
        if 1 <= day_n <= days_in_month:
            r = 1 + idx // 7
            c = idx % 7
            bg = SAGE if day_n in active_day_set else colors.HexColor("#F1F5F9")
            cal_style.append(("BACKGROUND", (c, r), (c, r), bg))
    cal_tbl.setStyle(TableStyle(cal_style))

    # Center calendar block on the page
    cal_outer = Table([[cal_tbl]], colWidths=[15.75*cm], hAlign="CENTER")
    cal_outer.setStyle(TableStyle([
        ("LEFTPADDING",  (0,0), (-1,-1), 0),
        ("RIGHTPADDING", (0,0), (-1,-1), 0),
        ("TOPPADDING",   (0,0), (-1,-1), 0),
        ("BOTTOMPADDING",(0,0), (-1,-1), 0),
    ]))

    story.append(cal_hdr)
    story.append(cal_outer)
    story.append(Spacer(1, 0.9*cm))

    # Recent insight
    if journals:
        last_ana     = journals[-1].get("ai_analysis") or journals[-1].get("ai_response") or {}
        insight_text = last_ana.get("pattern_insight") or "Steady growth recorded."
    else:
        insight_text = "Continuing your documentation legacy."

    story.append(Paragraph(
        f'<font name="{UNICODE_FONT_BOLD}" size="9" color="#1B4332"><b>RECENT INSIGHT:</b></font>'
        f' <font name="{UNICODE_FONT}" size="9" color="#4B5563">{insight_text}</font>',
        ParagraphStyle("desc_v2", leading=13)
    ))
    story.append(Spacer(1, 0.9*cm))
    story.append(quote_card(PSYCH_QUOTES[0]))

    # ════════════════════════════════════════════════════════════════════════
    # PAGE 3: EMOTIONAL SPECTRUM (Moved to its own page)
    # ════════════════════════════════════════════════════════════════════════
    story.append(PageBreak())
    story += sec_header("EMOTIONAL INSIGHTS", "Spectrum Distribution")
    story.append(Paragraph(
        "A visualization of your primary emotional states during this period. "
        "Each segment represents a core emotion detected in your reflections, "
        "allowing you to identify recurring patterns and trends in your affective landscape.",
        p_body
    ))
    story.append(Spacer(1, 0.8*cm))

    if emotion_map:
        sorted_emo = sorted(emotion_map.items(), key=lambda x: x[1], reverse=True)[:6]

        # Draw a larger, beautiful Pie Chart
        pie_d    = Drawing(220, 220)
        pc       = Pie()
        pc.x     = 10;  pc.y = 10
        pc.width = 200; pc.height = 200
        pc.data  = [v for _, v in sorted_emo]
        pc.labels = None          # no labels = no pointer lines
        pc.slices.strokeColor = PURE_WHITE
        pc.slices.strokeWidth = 2.5
        for i in range(len(sorted_emo)):
            pc.slices[i].fillColor = PAL[i % len(PAL)]
        pie_d.add(pc)

        # Legend rows
        leg_rows = []
        for i, (name, cnt) in enumerate(sorted_emo):
            swatch = Table([[""]], colWidths=[12], rowHeights=[12])
            swatch.setStyle(TableStyle([
                ("BACKGROUND",    (0,0), (-1,-1), PAL[i % len(PAL)]),
                ("TOPPADDING",    (0,0), (-1,-1), 0),
                ("BOTTOMPADDING", (0,0), (-1,-1), 0),
                ("LEFTPADDING",   (0,0), (-1,-1), 0),
                ("RIGHTPADDING",  (0,0), (-1,-1), 0),
            ]))
            percentage = int(cnt / sum(emotion_map.values()) * 100)
            
            # Show list of days when this emotion was logged
            days_felt = emotion_days.get(name, [])
            if days_felt:
                if len(days_felt) > 5:
                    days_text = ", ".join(days_felt[:5]) + "..."
                else:
                    days_text = ", ".join(days_felt)
                days_html = f'<br/><font name="Helvetica" size="7" color="#6B7280">Logged on: {days_text}</font>'
            else:
                days_html = ''
                
            leg_rows.append([swatch, Paragraph(
                f'<font name="Helvetica-Bold" size="10.5" color="#111827">  {name.upper()}</font>{days_html}',
                ParagraphStyle("leg_name", leading=12)
            ), Paragraph(
                f'<font name="Helvetica-Bold" size="10.5" color="#4B5563">{cnt} logs</font>'
                f'<font name="Helvetica" size="9.5" color="#9CA3AF"> ({percentage}%)</font>',
                ParagraphStyle("leg_cnt", alignment=TA_RIGHT, leading=12)
            )])

        leg_tbl = Table(leg_rows, colWidths=[16, 5.0*cm, 4.0*cm])
        leg_tbl.setStyle(TableStyle([
            ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
            ("TOPPADDING",    (0,0), (-1,-1), 8),
            ("BOTTOMPADDING", (0,0), (-1,-1), 8),
            ("LEFTPADDING",   (0,0), (-1,-1), 0),
            ("RIGHTPADDING",  (0,0), (-1,-1), 0),
            ("LINEBELOW",     (0,0), (-1,-1), 0.5, LIGHT_GRAY),
        ]))

        # Combine Pie and Legend side by side
        spec_tbl = Table([[pie_d, leg_tbl]], colWidths=[8.0*cm, 9.4*cm])
        spec_tbl.setStyle(TableStyle([
            ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
            ("LEFTPADDING",   (0,0), (-1,-1), 0),
            ("RIGHTPADDING",  (0,0), (-1,-1), 0),
            ("TOPPADDING",    (0,0), (-1,-1), 0),
            ("BOTTOMPADDING", (0,0), (-1,-1), 0),
        ]))
        story.append(spec_tbl)
    else:
        story.append(Paragraph("No emotion data recorded for this period.", p_body_muted))

    story.append(PageBreak())



    # PAGE 5: VOCABULARY
    story += sec_header("LINGUISTIC GROWTH", "Vocabulary Audit")
    story.append(Paragraph("A refined emotional vocabulary acts as a sophisticated toolset for the mind. Every new concept internalized here provides a clearer lens through which to navigate your inner world.", p_body))
    story.append(Spacer(1, 0.5*cm))
    if words:
        # Show more words and handle page breaks by adding rows individually
        words_to_show = words[:40]
        for i in range(0, len(words_to_show), 2):
            batch = words_to_show[i:i+2]
            row_cells = []
            for w in batch:
                wd = w.get("word_details", {})
                definition = wd.get("metadata", {}).get("definition", "A nuanced experience within the spectrum of emotional intelligence.")
                
                # Individual Word Card
                card = Table([
                    [Paragraph(f'<font name="{UNICODE_FONT_BOLD}"><b>{wd.get("word")}</b></font>', ParagraphStyle("wt", fontSize=13, textColor=DEEP_GREEN))],
                    [Paragraph(f'<font name="{UNICODE_FONT_BOLD}"><b>{wd.get("core", "emotion").upper()}</b></font>', ParagraphStyle("wc", fontSize=7.5, textColor=SAGE, tracking=1))],
                    [Paragraph(f'<font name="{UNICODE_FONT}"><i>{definition}</i></font>', ParagraphStyle("wd", fontSize=8.5, textColor=WARM_GRAY, fontName=UNICODE_FONT_ITALIC, leading=11))]
                ], colWidths=[7.6*cm])
                
                card.setStyle(TableStyle([
                    ("BACKGROUND", (0,0),(-1,-1), BG_HIGHLIGHT),
                    ("LINEABOVE", (0,0),(-1,0), 3, SAGE),
                    ("BOX", (0,0),(-1,-1), 0.5, LIGHT_GRAY),
                    ("TOPPADDING", (0,0),(-1,-1), 8),
                    ("BOTTOMPADDING", (0,0),(-1,-1), 10),
                    ("LEFTPADDING", (0,0),(-1,-1), 12),
                    ("RIGHTPADDING", (0,0),(-1,-1), 12),
                ]))
                row_cells.append(card)
            
            # Pad row if odd number of words
            if len(row_cells) < 2:
                row_cells.append("")
                
            story.append(Table([row_cells], colWidths=[8.1*cm, 8.1*cm], style=[("VALIGN", (0,0),(-1,-1), "TOP")]))
            story.append(Spacer(1, 0.4*cm))
    else:
        story.append(Paragraph("Expand your lexicon in the library to unlock these growth insights.", p_body_muted))
    story.append(PageBreak())

    # PAGE 6: JOURNALS
    story += sec_header("THE GROWTH NARRATIVE", "Journal Archive")
    
    # Highlighted Intro Block
    intro_style = ParagraphStyle("intro", parent=p_body, fontSize=11, fontName="Helvetica-Oblique", leading=16, textColor=DEEP_GREEN)
    intro_block = Table([[Paragraph("Your raw words are the most authentic data points of your evolution. This archive preserves your stream of consciousness, providing a direct link to your past states of mind.", intro_style)]], 
                        colWidths=[16.4*cm], style=[("BACKGROUND", (0,0),(-1,-1), PALE_MINT), ("BOX", (0,0),(-1,-1), 0.5, SAGE), ("LEFTPADDING", (0,0),(-1,-1), 15), ("RIGHTPADDING", (0,0),(-1,-1), 15), ("TOPPADDING", (0,0),(-1,-1), 12), ("BOTTOMPADDING", (0,0),(-1,-1), 12)])
    story.append(intro_block)
    story.append(Spacer(1, 1.2*cm))
    
    if journals:
        for idx, j in enumerate(journals):
            # Header for entry
            created_at = j.get("created_at")
            date_str = created_at.strftime("%b %d, %Y · %I:%M %p") if isinstance(created_at, datetime) else "Unknown Date"
            
            # Extract emotions
            analysis = j.get("ai_analysis") or j.get("ai_response") or {}
            emotions = analysis.get("detected_emotions", [])
            emo_str = " \u00b7 ".join([e.get("word", "").upper() for e in emotions[:3]])
            
            # Entry Container
            entry_header = Table([
                [
                    Paragraph(f'<font name="{UNICODE_FONT_BOLD}" size="8" color="#4B5563"><b>ENTRY_{idx+1:02d}</b></font>', ParagraphStyle("eid", tracking=2)),
                    Paragraph(f'<font name="{UNICODE_FONT_BOLD}" size="8" color="#52B788"><b>{emo_str}</b></font>', ParagraphStyle("emo", alignment=TA_RIGHT, tracking=1))
                ]
            ], colWidths=[4*cm, 12.4*cm])
            
            story.append(entry_header)
            story.append(Spacer(1, 2*mm))
            
            # The Text
            # Using UNICODE_FONT to support non-Latin characters (like Telugu)
            story.append(Paragraph(f'<font name="{UNICODE_FONT}" size="11.5" color="#111827">{j.get("entry_text", "")}</font>', 
                                   ParagraphStyle("jtext", fontName=UNICODE_FONT, leading=17, spaceAfter=4*mm)))
            
            # BRIGHTER TIMESTAMP (Slate-600 equivalent)
            story.append(Paragraph(f'<font name="{UNICODE_FONT_BOLD}" size="8" color="#4B5563">Recorded on {date_str}</font>', 
                                   ParagraphStyle("jdate", fontName=UNICODE_FONT_BOLD, spaceAfter=8*mm)))
            
            # Divider
            if idx < len(journals) - 1:
                story.append(HRFlowable(width="100%", thickness=0.3, color=LIGHT_GRAY, spaceBefore=2*mm, spaceAfter=8*mm))
    else:
        story.append(Paragraph("No journal entries recorded for this period.", p_body_muted))
        
    story.append(PageBreak())

    # PAGE 7: CLOSING
    story.append(Spacer(1, 3*cm))
    story += sec_header("A NOTE FOR YOU", "You Did This.")
    story.append(Paragraph("Most people go through life never pausing to ask: <i>What am I actually feeling?</i> You chose differently. You opened the app. You logged. You reflected. That takes a courage most people never find.", p_body))
    story.append(Spacer(1, 2*cm))
    story.append(Table([[Paragraph('<b>"The privilege of a lifetime is to become who you truly are."</b>', ParagraphStyle("fq", alignment=TA_CENTER, leading=24, textColor=BG_HIGHLIGHT, fontName="Helvetica-BoldOblique"))]], 
                       colWidths=[16.4*cm], style=[("BACKGROUND", (0,0),(-1,-1), DEEP_GREEN), ("TOPPADDING", (0,0),(-1,-1), 22), ("BOTTOMPADDING", (0,0),(-1,-1), 22), ("LINEABOVE", (0,0),(-1,0), 2.5, GOLD_ACCENT), ("LINEBELOW", (0,-1),(-1,-1), 2.5, GOLD_ACCENT)]))
    story.append(Spacer(1, 1*cm))
    story.append(Paragraph("See you next month. Keep going. <br/> — The Emolit Team", ParagraphStyle("sig", alignment=TA_CENTER, textColor=WARM_GRAY)))

    doc.build(story, onFirstPage=draw_premium_cover, onLaterPages=draw_inner_footer)
    buffer.seek(0)
    return buffer
