import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from PIL import Image, ImageFilter
import numpy as np
from collections import deque

SRC = "citruscodex-logo.jpg"
OUT_DIR = "public/assets/logo"

# ── 1. Chargement et conversion ──────────────────────────────────────────────
img = Image.open(SRC).convert("RGBA")
W, H = img.size
data = np.array(img)          # shape (H, W, 4)

# ── 2. Flood-fill depuis les 4 coins pour isoler le fond ────────────────────
THRESHOLD = 235               # pixel "proche du blanc" = fond candidat
r, g, b = data[:,:,0], data[:,:,1], data[:,:,2]
is_near_white = (r > THRESHOLD) & (g > THRESHOLD) & (b > THRESHOLD)

visited = np.zeros((H, W), dtype=bool)
queue = deque()

# Amorcer depuis chaque pixel du bord de l'image
for x in range(W):
    if is_near_white[0, x]:   queue.append((0, x));   visited[0, x] = True
    if is_near_white[H-1, x]: queue.append((H-1, x)); visited[H-1, x] = True
for y in range(H):
    if is_near_white[y, 0]:   queue.append((y, 0));   visited[y, 0] = True
    if is_near_white[y, W-1]: queue.append((y, W-1)); visited[y, W-1] = True

# 4-connexité
while queue:
    cy, cx = queue.popleft()
    for ny, nx in [(cy-1,cx),(cy+1,cx),(cy,cx-1),(cy,cx+1)]:
        if 0 <= ny < H and 0 <= nx < W and not visited[ny, nx] and is_near_white[ny, nx]:
            visited[ny, nx] = True
            queue.append((ny, nx))

# ── 3. Masque alpha : fond → 0, reste → 255 ──────────────────────────────────
alpha = np.where(visited, 0, 255).astype(np.uint8)

# ── 4. Lissage du bord : dilation légère du masque opaque puis flou ──────────
# Convertir en image PIL pour le filtrage
alpha_img = Image.fromarray(alpha, mode='L')

# Flou doux pour adoucir l'anti-aliasing (rayon 1 pixel)
alpha_blurred = alpha_img.filter(ImageFilter.GaussianBlur(radius=1.0))

# Renforcer : les pixels déjà à 255 restent à 255, les intermédiaires sont lissés
alpha_arr = np.array(alpha_blurred)
# Pixels originaux opaques → forcer 255 ; fond → forcer 0
alpha_arr[alpha == 255] = 255
alpha_arr[visited & (alpha_arr < 30)] = 0

# ── 5. Composer le PNG final ──────────────────────────────────────────────────
data[:,:,3] = alpha_arr
result = Image.fromarray(data)

# Sauvegarder le PNG de base (taille originale)
base_path = f"{OUT_DIR}/citruscodex-logo.png"
result.save(base_path, "PNG", optimize=True)
print(f"✓ {base_path}  ({W}×{H})")

# ── 6. Déclinaisons ──────────────────────────────────────────────────────────
def make_size(img_rgba, size, filename, pad_ratio=0.0):
    """Redimensionne avec Lanczos. pad_ratio=0.08 ajoute 8% de marge."""
    canvas_size = size
    if pad_ratio > 0:
        inner = int(size * (1 - pad_ratio * 2))
    else:
        inner = size

    resized = img_rgba.resize((inner, inner), Image.LANCZOS)

    if pad_ratio > 0:
        canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
        offset = (canvas_size - inner) // 2
        canvas.paste(resized, (offset, offset), resized)
        final = canvas
    else:
        final = resized

    final.save(filename, "PNG", optimize=True)
    print(f"✓ {filename}  ({canvas_size}×{canvas_size})")
    return final

# Icônes carrées avec léger padding (logo centré)
make_size(result,  16, f"{OUT_DIR}/citruscodex-logo-16.png",  pad_ratio=0.04)
make_size(result,  32, f"{OUT_DIR}/citruscodex-logo-32.png",  pad_ratio=0.04)
make_size(result,  64, f"{OUT_DIR}/citruscodex-logo-64.png",  pad_ratio=0.04)
make_size(result, 180, f"{OUT_DIR}/citruscodex-logo-180.png", pad_ratio=0.04)
make_size(result, 192, f"{OUT_DIR}/citruscodex-logo-192.png", pad_ratio=0.06)
make_size(result, 512, f"{OUT_DIR}/citruscodex-logo-512.png", pad_ratio=0.06)

# Email (200×200, sans padding excessif)
make_size(result, 200, f"{OUT_DIR}/citruscodex-logo-email.png", pad_ratio=0.04)

# ── 7. Favicon ICO (multi-résolution 16+32+48) ───────────────────────────────
ico_16 = result.resize((16,16), Image.LANCZOS)
ico_32 = result.resize((32,32), Image.LANCZOS)
ico_48 = result.resize((48,48), Image.LANCZOS)
ico_path = f"{OUT_DIR}/favicon.ico"
ico_16.save(ico_path, format="ICO", sizes=[(16,16),(32,32),(48,48)],
            append_images=[ico_32, ico_48])
print(f"✓ {ico_path}  (16+32+48)")

# ── 8. Vérification rapide ────────────────────────────────────────────────────
img_check = Image.open(base_path)
arr = np.array(img_check)
n_transparent = (arr[:,:,3] == 0).sum()
n_opaque      = (arr[:,:,3] > 200).sum()
n_semi        = ((arr[:,:,3] > 0) & (arr[:,:,3] <= 200)).sum()
total = arr.shape[0] * arr.shape[1]
print(f"\nVérification {base_path} :")
print(f"  Pixels transparents : {n_transparent} ({100*n_transparent/total:.1f}%)")
print(f"  Pixels opaques      : {n_opaque}      ({100*n_opaque/total:.1f}%)")
print(f"  Pixels semi-transp. : {n_semi}         ({100*n_semi/total:.1f}%)")

# Coin supérieur gauche doit être transparent
corner = arr[0, 0, 3]
print(f"  Coin sup-gauche alpha: {corner}  {'✓ transparent' if corner == 0 else '✗ PAS transparent !'}")

print("\nDone.")
