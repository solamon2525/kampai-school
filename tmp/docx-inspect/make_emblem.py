import sys
sys.stdout.reconfigure(encoding="utf-8")
from pathlib import Path
from PIL import Image, ImageDraw

NAVY = (23, 54, 93, 255)
GOLD = (197, 154, 50, 255)
GOLD_LT = (214, 178, 92, 255)
CREAM = (255, 247, 225, 255)
WHITE = (255, 255, 255, 255)

SS = 4
BASE = 900
S = BASE * SS
img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(img)

cx = cy = S / 2
R = S * 0.47


def circle(draw, cxx, cyy, r, fill=None, outline=None, width=0):
    draw.ellipse([cxx - r, cyy - r, cxx + r, cyy + r], fill=fill, outline=outline, width=width)


# outer gold ring
circle(d, cx, cy, R, fill=GOLD)
# thin cream separator
circle(d, cx, cy, R * 0.90, fill=CREAM)
# navy disc
circle(d, cx, cy, R * 0.855, fill=NAVY)
# inner gold hairline ring
circle(d, cx, cy, R * 0.79, outline=GOLD_LT, width=int(S * 0.006))

# --- bamboo motif ---
stalk_w = S * 0.052
gap = S * 0.020            # node gap between segments
top = cy - R * 0.33
bot = cy + R * 0.55
seg_h = (bot - top - 2 * gap) / 3
offsets = [-S * 0.072, S * 0.072]
for ox in offsets:
    x0 = cx + ox - stalk_w / 2
    x1 = cx + ox + stalk_w / 2
    y = top
    for i in range(3):
        y2 = y + seg_h
        d.rounded_rectangle([x0, y, x1, y2], radius=stalk_w * 0.45, fill=GOLD)
        d.line([x0, y2 + gap / 2, x1, y2 + gap / 2], fill=GOLD_LT, width=int(S * 0.008))
        y = y2 + gap


def leaf(color, angle, length, width):
    """A pointed almond leaf rooted at (cx, top), fanning by angle degrees."""
    layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    dl = ImageDraw.Draw(layer)
    dl.ellipse([cx - width, top - length, cx + width, top], fill=color)
    layer = layer.rotate(angle, center=(cx, top), resample=Image.BICUBIC)
    img.alpha_composite(layer)


# fanned leaf cluster above the stalks
leaf(GOLD,    -40, S * 0.25, S * 0.044)
leaf(GOLD_LT, -15, S * 0.29, S * 0.047)
leaf(GOLD,     15, S * 0.29, S * 0.047)
leaf(GOLD_LT,  40, S * 0.25, S * 0.044)

# downsample
out = img.resize((BASE, BASE), Image.LANCZOS)
dest = Path(r"D:\School คำไผ่\kampai-school\tmp\assets")
dest.mkdir(parents=True, exist_ok=True)
fp = dest / "emblem.png"
out.save(str(fp))
print("saved", fp, out.size)
