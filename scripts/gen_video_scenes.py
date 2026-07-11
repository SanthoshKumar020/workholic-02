#!/usr/bin/env python3
"""Generate branded HYRISE marketing scenes (PNG) for the explainer video."""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "marketing", "scenes")
os.makedirs(OUT, exist_ok=True)

W, H = 1920, 1080
BRAND = (91, 91, 245)      # #5b5bf5
VIOLET = (124, 58, 237)    # #7c3aed
WHITE = (255, 255, 255)
SLATE = (51, 65, 85)
LIGHT = (241, 240, 255)

def font(size, bold=False):
    name = "arialbd.ttf" if bold else "arial.ttf"
    for base in [r"C:/Windows/Fonts", "/usr/share/fonts", "/Library/Fonts"]:
        p = os.path.join(base, name)
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

def gradient(draw, c1, c2):
    for y in range(H):
        t = y / H
        r = int(c1[0] + (c2[0] - c1[0]) * t)
        g = int(c1[1] + (c2[1] - c1[1]) * t)
        b = int(c1[2] + (c2[2] - c1[2]) * t)
        draw.line([(0, y), (W, y)], fill=(r, g, b))

def centered(d, text, y, size, color, bold=True, maxw=1500):
    f = font(size, bold)
    # wrap by width
    words = text.split()
    lines, cur = [], ""
    for w in words:
        test = (cur + " " + w).strip()
        if d.textlength(test, font=f) > maxw and cur:
            lines.append(cur); cur = w
        else:
            cur = test
    if cur: lines.append(cur)
    lh = size * 1.15
    total = lh * len(lines)
    yy = y - total / 2
    for ln in lines:
        tw = d.textlength(ln, font=f)
        d.text(((W - tw) / 2, yy), ln, font=f, fill=color)
        yy += lh

def logo(d, cx, cy, scale=1.0):
    s = 90 * scale
    d.rounded_rectangle([cx - s, cy - s, cx + s, cy + s], radius=s * 0.28,
                        fill=(255, 255, 255))
    f = font(int(70 * scale), bold=True)
    tw = d.textlength("H", font=f)
    d.text((cx - tw / 2, cy - 35 * scale), "H", font=f, fill=BRAND)

# ── Scene 1: Hero ───────────────────────────────────────────────
im = Image.new("RGB", (W, H)); d = ImageDraw.Draw(im)
gradient(d, BRAND, VIOLET)
# soft blobs
for (bx, by, br, col) in [(300, 250, 280, (255,255,255,40)), (1600, 850, 320, (255,255,255,30))]:
    blob = Image.new("RGBA", (W, H), (0,0,0,0)); bd = ImageDraw.Draw(blob)
    bd.ellipse([bx-br, by-br, bx+br, by+br], fill=col)
    blur = blob.filter(ImageFilter.GaussianBlur(60)).convert("RGB")
    im = Image.blend(im, blur, 1.0)
logo(d, W//2, 300, 1.6)
centered(d, "HYRISE", 470, 96, WHITE, bold=True)
centered(d, "Your complete AI career platform", 600, 52, LIGHT, bold=False)
centered(d, "Resume scoring · Mock interviews · Job matching", 680, 34, (200,200,255), bold=False)
im.save(os.path.join(OUT, "scene1_hero.png"))

# ── Scene 2: ATS score ──────────────────────────────────────────
im = Image.new("RGB", (W, H)); d = ImageDraw.Draw(im)
gradient(d, (245,245,255), (235,235,255))
centered(d, "Check your ATS score in seconds", 200, 60, SLATE, bold=True)
# resume card
card_x, card_y, card_w, card_h = 360, 340, 1200, 520
d.rounded_rectangle([card_x, card_y, card_x+card_w, card_y+card_h], radius=28,
                    fill=WHITE, outline=BRAND, width=4)
centered(d, "RESUME.pdf", card_y+40, 36, SLATE, bold=True)
# progress ring placeholder: big score
d.ellipse([card_x+440, card_y+150, card_x+760, card_y+470], outline=BRAND, width=22)
centered(d, "78", card_y+310, 120, BRAND, bold=True)
centered(d, "ATS SCORE", card_y+420, 30, SLATE, bold=False)
# checklist
checks = ["Keywords matched", "Action verbs added", "Format ATS-friendly"]
for i, t in enumerate(checks):
    cy = card_y+150 + i*95
    d.ellipse([card_x+900, cy, card_x+940, cy+40], fill=VIOLET)
    tc = (255,255,255) if False else (255,255,255)
    d.text((card_x+912, cy+4), "✓", font=font(28,True), fill=WHITE)
    d.text((card_x+965, cy+2), t, font=font(34,False), fill=SLATE)
im.save(os.path.join(OUT, "scene2_ats.png"))

# ── Scene 3: Mock interview ─────────────────────────────────────
im = Image.new("RGB", (W, H)); d = ImageDraw.Draw(im)
gradient(d, VIOLET, BRAND)
centered(d, "Practice with an AI interview coach", 200, 60, WHITE, bold=True)
# chat bubbles
bubbles = [("AI: Tell me about a challenge you solved", 360, LIGHT, SLATE),
           ("You: I rebuilt our pipeline, cut runtime 40%", 470, WHITE, BRAND),
           ("AI: Strong. Use the STAR method — add the result", 580, LIGHT, SLATE)]
for (txt, by, fill, tc) in bubbles:
    bw = int(d.textlength(txt, font=font(36,False))) + 60
    d.rounded_rectangle([360, by, 360+bw, by+70], radius=20, fill=fill)
    d.text((390, by+16), txt, font=font(36,False), fill=tc)
centered(d, "Instant STAR feedback, voice or text", 880, 36, LIGHT, bold=False)
im.save(os.path.join(OUT, "scene3_interview.png"))

# ── Scene 4: India + price ──────────────────────────────────────
im = Image.new("RGB", (W, H)); d = ImageDraw.Draw(im)
gradient(d, (238,242,255), BRAND)
centered(d, "Built in India · Free to start", 230, 60, WHITE, bold=True)
# price cards
for i,(label,price,col) in enumerate([("Free", "₹0", WHITE), ("Pro", "₹30/mo", WHITE)]):
    cx = 560 + i*800
    d.rounded_rectangle([cx-260, 400, cx+260, 720], radius=30, fill=(255,255,255))
    centered(d, label, 470, 44, SLATE, bold=True)
    centered(d, price, 580, 100, BRAND, bold=True)
    centered(d, "full access" if i else "no card needed", 680, 30, SLATE, bold=False)
centered(d, "🇮🇳 Less than a cup of chai a month", 880, 40, LIGHT, bold=False)
im.save(os.path.join(OUT, "scene4_india.png"))

# ── Scene 5: CTA ────────────────────────────────────────────────
im = Image.new("RGB", (W, H)); d = ImageDraw.Draw(im)
gradient(d, BRAND, VIOLET)
logo(d, W//2, 360, 1.5)
centered(d, "Your next job starts here.", 560, 72, WHITE, bold=True)
# cta button
bw, bh = 460, 96; bx, by = (W-bw)//2, 690
d.rounded_rectangle([bx, by, bx+bw, by+bh], radius=48, fill=WHITE)
centered(d, "Start free →", by+30, 44, BRAND, bold=True)
centered(d, "hyrise.swache.in", 860, 40, LIGHT, bold=False)
im.save(os.path.join(OUT, "scene5_cta.png"))

print("scenes written to", os.path.abspath(OUT))
for f in sorted(os.listdir(OUT)):
    print(" -", f)
