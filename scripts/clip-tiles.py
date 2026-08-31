"""Cut six sky tiles from tiles.png using gold-frame centers and a shared width."""
from pathlib import Path
from PIL import Image

SRC = Path("/workspace/onaji-web/public/art/tiles.png")
OUT = Path("/workspace/onaji-web/public/art/sym")
NAMES = ["hi", "tsuki", "ame", "kaze", "kaminari", "hoshi"]


def is_gold(r: int, g: int, b: int) -> bool:
    return r > 120 and g > 85 and r > b + 20 and (r + g) > 220


def is_felt(r: int, g: int, b: int) -> bool:
    return r < 48 and g < 52 and b < 72 and b >= r - 4 and (r + g + b) < 145 and (b - r) < 40


def runs(arr: list[int], thresh: int, minlen: int) -> list[tuple[int, int]]:
    out: list[tuple[int, int]] = []
    on = False
    a = 0
    for i, n in enumerate(arr):
        if n > thresh and not on:
            on, a = True, i
        elif n <= thresh and on:
            on = False
            if i - 1 - a >= minlen:
                out.append((a, i - 1))
    if on and len(arr) - 1 - a >= minlen:
        out.append((a, len(arr) - 1))
    return out


def main() -> None:
    im = Image.open(SRC).convert("RGB")
    w, h = im.size
    px = im.load()

    grows = [0] * h
    for y in range(h):
        for x in range(w):
            if is_gold(*px[x, y]):
                grows[y] += 1
    yruns = runs(grows, 40, 40)
    if not yruns:
        raise SystemExit("no gold y-band")
    y0, y1 = yruns[0]
    y0 = max(0, y0 - 10)
    y1 = min(h - 1, y1 + 10)

    occ = [0] * w
    for x in range(w):
        occ[x] = sum(1 for y in range(y0, y1 + 1) if is_gold(*px[x, y]))
    xruns = runs(occ, 3, 24)
    xruns.sort(key=lambda ab: ab[1] - ab[0], reverse=True)
    xruns = sorted(xruns[:6])
    if len(xruns) != 6:
        raise SystemExit(f"expected 6 tiles, got {xruns}")

    centers = [(a + b) / 2 for a, b in xruns]
    gaps = [centers[i + 1] - centers[i] for i in range(5)]
    slot = min(gaps) - 8
    half = slot / 2
    print("centers", [round(c, 1) for c in centers], "gaps", [round(g, 1) for g in gaps], "slot", round(slot, 1))

    OUT.mkdir(parents=True, exist_ok=True)
    crops = []
    for cx in centers:
        minx = max(0, int(cx - half))
        maxx = min(w - 1, int(cx + half))
        crop = im.crop((minx, y0, maxx + 1, y1 + 1)).convert("RGBA")
        cp = crop.load()
        cw, ch = crop.size
        margin = 14
        for y in range(ch):
            for x in range(cw):
                if x > margin and x < cw - margin and y > margin and y < ch - margin:
                    continue
                r, g, b, _ = cp[x, y]
                if is_felt(r, g, b):
                    cp[x, y] = (0, 0, 0, 0)
        crops.append(crop)

    tw = max(c.size[0] for c in crops)
    th = max(c.size[1] for c in crops)
    for name, crop in zip(NAMES, crops):
        canvas = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
        ox = (tw - crop.size[0]) // 2
        oy = (th - crop.size[1]) // 2
        canvas.paste(crop, (ox, oy), crop)
        dest = OUT / f"{name}.png"
        canvas.save(dest, optimize=True)
        print(name, crop.size, "->", canvas.size, dest)


if __name__ == "__main__":
    main()
