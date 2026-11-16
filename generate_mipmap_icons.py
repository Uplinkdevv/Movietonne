import os
import math
import time
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

BASE_DIR = r"c:\Users\kusum\Desktop\my projects\screenscape\movietonee"
RES_DIR = os.path.join(BASE_DIR, "android", "app", "src", "main", "res")
ASSETS_DIR = os.path.join(BASE_DIR, "assets")

BG_COLOR_RGB = (10, 13, 20)           # #0A0D14
BG_COLOR_RGBA = (10, 13, 20, 255)

MIPMAP_SIZES = {
    "mipmap-mdpi": {"launcher": 48, "foreground": 108},
    "mipmap-hdpi": {"launcher": 72, "foreground": 162},
    "mipmap-xhdpi": {"launcher": 96, "foreground": 216},
    "mipmap-xxhdpi": {"launcher": 144, "foreground": 324},
    "mipmap-xxxhdpi": {"launcher": 192, "foreground": 432},
}

def fast_dilate_mask(mask_img, radius_px):
    """Fast morphological dilation using multi-scale filter."""
    if radius_px <= 0:
        return mask_img
    if radius_px <= 3:
        return mask_img.filter(ImageFilter.MaxFilter(radius_px * 2 + 1))
    scale = 4
    w, h = mask_img.size
    small = mask_img.resize((w // scale, h // scale), Image.Resampling.BILINEAR)
    r_small = max(1, int(round(radius_px / scale)))
    filtered = small.filter(ImageFilter.MaxFilter(r_small * 2 + 1))
    return filtered.resize((w, h), Image.Resampling.BILINEAR).point(lambda p: 255 if p > 80 else 0)

def create_metallic_gradient(width, height, angle_deg=45, stops=None):
    """Creates a smooth multi-stop metallic linear gradient texture."""
    if stops is None:
        stops = [
            (0.00, np.array([255, 252, 235], dtype=np.float32)), # Champagne specular
            (0.18, np.array([255, 225, 105], dtype=np.float32)), # Bright gold
            (0.42, np.array([245, 158, 11], dtype=np.float32)),  # Pure amber gold
            (0.70, np.array([217, 119, 6], dtype=np.float32)),   # Deep warm gold
            (0.85, np.array([255, 235, 140], dtype=np.float32)), # Specular reflection
            (1.00, np.array([125, 55, 15], dtype=np.float32)),   # Bronze edge
        ]
    
    rad = math.radians(angle_deg)
    cos_a = math.cos(rad)
    sin_a = math.sin(rad)
    
    y, x = np.mgrid[:height, :width]
    proj = x * cos_a + y * sin_a
    min_p, max_p = proj.min(), proj.max()
    t = (proj - min_p) / (max_p - min_p + 1e-6)
    
    img_arr = np.zeros((height, width, 4), dtype=np.uint8)
    img_arr[..., 3] = 255
    
    rgb = np.zeros((height, width, 3), dtype=np.float32)
    for i in range(len(stops) - 1):
        t0, c0 = stops[i]
        t1, c1 = stops[i+1]
        mask = (t >= t0) & (t <= t1 if i == len(stops)-2 else t < t1)
        if np.any(mask):
            local_t = (t[mask] - t0) / (t1 - t0)
            local_t = local_t * local_t * (3 - 2 * local_t)
            for c_idx in range(3):
                rgb[mask, c_idx] = (1 - local_t) * c0[c_idx] + local_t * c1[c_idx]
                
    img_arr[..., :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    return Image.fromarray(img_arr, mode="RGBA")

def create_radial_glow(width, height, cx, cy, radius, color, max_alpha=160):
    """Creates a smooth radial glow alpha layer."""
    y, x = np.ogrid[:height, :width]
    dist = np.sqrt((x - cx) ** 2 + (y - cy) ** 2)
    t = np.clip(dist / radius, 0, 1)
    alpha = np.maximum(0, (1 + np.cos(t * np.pi)) / 2) * max_alpha
    
    arr = np.zeros((height, width, 4), dtype=np.uint8)
    arr[..., 0] = color[0]
    arr[..., 1] = color[1]
    arr[..., 2] = color[2]
    arr[..., 3] = alpha.astype(np.uint8)
    return Image.fromarray(arr, mode="RGBA")

def render_movie_tonee_emblem(render_size=2048, radius_ratio=0.315):
    """
    Renders the MovieTonee cinema film reel & stylized 3D 'M' monogram emblem.
    - True negative space between spokes and around 'M' (zero alpha).
    - No diffuse alpha glow that pollutes monochrome theming.
    - Perfectly centered within radius = render_size * radius_ratio.
    """
    canvas = Image.new("RGBA", (render_size, render_size), (0, 0, 0, 0))
    cx, cy = render_size / 2.0, render_size / 2.0
    r_emblem = render_size * radius_ratio
    
    # Textures
    tex_champagne = create_metallic_gradient(render_size, render_size, angle_deg=30, stops=[
        (0.0, [255, 255, 245]),
        (0.35, [255, 235, 140]),
        (0.70, [245, 175, 30]),
        (1.0, [217, 119, 6]),
    ])
    tex_gold = create_metallic_gradient(render_size, render_size, angle_deg=45)
    tex_bronze = create_metallic_gradient(render_size, render_size, angle_deg=135, stops=[
        (0.0, [245, 158, 11]),
        (0.35, [195, 95, 5]),
        (0.70, [146, 64, 14]),
        (1.0, [80, 30, 5]),
    ])
    
    # ----------------------------------------------------
    # 1. Cinema Film Reel Rim, Sprockets, and Spokes
    # ----------------------------------------------------
    r_out = r_emblem
    r_sprock_in = r_emblem * 0.90
    r_track_out = r_emblem * 0.865
    r_track_in = r_emblem * 0.815
    r_hub_out = r_emblem * 0.34
    r_hub_in = r_emblem * 0.20
    
    reel_mask = Image.new("L", (render_size, render_size), 0)
    d_reel = ImageDraw.Draw(reel_mask)
    
    # Outer solid rim band
    d_reel.ellipse([cx - r_out, cy - r_out, cx + r_out, cy + r_out], fill=255)
    d_reel.ellipse([cx - r_sprock_in, cy - r_sprock_in, cx + r_sprock_in, cy + r_sprock_in], fill=0)
    
    # Inner track ring band
    d_reel.ellipse([cx - r_track_out, cy - r_track_out, cx + r_track_out, cy + r_track_out], fill=255)
    d_reel.ellipse([cx - r_track_in, cy - r_track_in, cx + r_track_in, cy + r_track_in], fill=0)
    
    # Central hub ring band
    d_reel.ellipse([cx - r_hub_out, cy - r_hub_out, cx + r_hub_out, cy + r_hub_out], fill=255)
    d_reel.ellipse([cx - r_hub_in, cy - r_hub_in, cx + r_hub_in, cy + r_hub_in], fill=0)
    
    # 6 Radial Spokes connecting hub to track ring
    spoke_w = r_emblem * 0.052
    for i in range(6):
        ang = i * (math.pi / 3.0) + (math.pi / 6.0)
        ca, sa = math.cos(ang), math.sin(ang)
        p1 = (cx + r_hub_in * ca - spoke_w * sa, cy + r_hub_in * sa + spoke_w * ca)
        p2 = (cx + r_track_out * ca - spoke_w * sa, cy + r_track_out * sa + spoke_w * ca)
        p3 = (cx + r_track_out * ca + spoke_w * sa, cy + r_track_out * sa - spoke_w * ca)
        p4 = (cx + r_hub_in * ca + spoke_w * sa, cy + r_hub_in * sa - spoke_w * ca)
        d_reel.polygon([p1, p2, p3, p4], fill=255)
        
    # Cutout Sprocket Holes (20 perforations on outer rim)
    num_sprockets = 20
    sprock_w = r_emblem * 0.040
    sprock_h = r_emblem * 0.065
    r_sprock_center = (r_out + r_sprock_in) / 2.0
    for i in range(num_sprockets):
        ang = 2 * math.pi * i / num_sprockets
        px = cx + r_sprock_center * math.cos(ang)
        py = cy + r_sprock_center * math.sin(ang)
        ca, sa = math.cos(ang), math.sin(ang)
        cpa, spa = -sa, ca
        hw, hh = sprock_w / 2.0, sprock_h / 2.0
        p1 = (px + ca*hh + cpa*hw, py + sa*hh + spa*hw)
        p2 = (px + ca*hh - cpa*hw, py + sa*hh - spa*hw)
        p3 = (px - ca*hh - cpa*hw, py - sa*hh - spa*hw)
        p4 = (px - ca*hh + cpa*hw, py - sa*hh + spa*hw)
        d_reel.polygon([p1, p2, p3, p4], fill=0)
        
    # ----------------------------------------------------
    # 2. Stylized 3D Golden "M" Monogram & Play Triangle
    # ----------------------------------------------------
    mw = r_emblem * 1.36
    mh = r_emblem * 1.18
    stem_w = r_emblem * 0.28
    
    y_bot = cy + mh * 0.46
    y_top = cy - mh * 0.54
    y_apex = cy + mh * 0.26
    y_notch = cy - mh * 0.12
    
    xl_out = cx - mw / 2.0
    xl_in = xl_out + stem_w
    xl_mid = (xl_out + xl_in) / 2.0
    
    xr_out = cx + mw / 2.0
    xr_in = xr_out - stem_w
    xr_mid = (xr_out + xr_in) / 2.0
    chamfer = stem_w * 0.35
    
    # Left Stalk Facets
    poly_l_light = [(xl_out, y_bot), (xl_out, y_top + chamfer), (xl_mid, y_top), (xl_mid, y_bot)]
    poly_l_mid = [(xl_mid, y_top), (xl_in, y_top + chamfer * 0.6), (xl_in, y_bot), (xl_mid, y_bot)]
    
    # Right Stalk Facets
    poly_r_mid = [(xr_in, y_top + chamfer * 0.6), (xr_mid, y_top), (xr_mid, y_bot), (xr_in, y_bot)]
    poly_r_dark = [(xr_mid, y_top), (xr_out, y_top + chamfer), (xr_out, y_bot), (xr_mid, y_bot)]
    
    # Chevron Diagonals
    poly_diag_l_light = [(xl_mid, y_top), (cx, y_apex), (cx - stem_w * 0.38, y_apex), (xl_in, y_top + chamfer * 0.6)]
    poly_diag_l_notch = [(xl_mid, y_top), (cx, y_notch), (cx, y_apex)]
    poly_diag_r_notch = [(xr_mid, y_top), (cx, y_notch), (cx, y_apex)]
    poly_diag_r_dark = [(xr_in, y_top + chamfer * 0.6), (xr_mid, y_top), (cx, y_apex), (cx + stem_w * 0.38, y_apex)]
    
    # Cinema Play Triangle in upper notch
    tri_cx = cx
    tri_cy = y_notch - (y_notch - y_top) * 0.54
    tri_size = stem_w * 0.62
    tri_pts = [
        (tri_cx - tri_size * 0.65, tri_cy - tri_size * 0.85),
        (tri_cx + tri_size * 0.95, tri_cy),
        (tri_cx - tri_size * 0.65, tri_cy + tri_size * 0.85),
    ]
    
    # Build complete M mask
    m_mask = Image.new("L", (render_size, render_size), 0)
    d_m = ImageDraw.Draw(m_mask)
    d_m.polygon(poly_l_light, fill=255)
    d_m.polygon(poly_l_mid, fill=255)
    d_m.polygon(poly_r_mid, fill=255)
    d_m.polygon(poly_r_dark, fill=255)
    d_m.polygon(poly_diag_l_light, fill=255)
    d_m.polygon(poly_diag_l_notch, fill=255)
    d_m.polygon(poly_diag_r_notch, fill=255)
    d_m.polygon(poly_diag_r_dark, fill=255)
    d_m.polygon(tri_pts, fill=255)
    
    # ----------------------------------------------------
    # 3. Clean Negative-Space Halo (Cutout) around 'M'
    # ----------------------------------------------------
    halo_px = int(r_emblem * 0.045)
    m_halo = fast_dilate_mask(m_mask, halo_px)
    reel_np = np.maximum(0, np.array(reel_mask).astype(np.int16) - np.array(m_halo).astype(np.int16)).astype(np.uint8)
    
    # Composite Reel
    reel_layer = Image.new("RGBA", (render_size, render_size), (0, 0, 0, 0))
    reel_layer.paste(tex_gold, (0, 0), Image.fromarray(reel_np, mode="L"))
    canvas = Image.alpha_composite(canvas, reel_layer)
    
    # ----------------------------------------------------
    # 4. Composite 3D Facets of 'M'
    # ----------------------------------------------------
    m_light_mask = Image.new("L", (render_size, render_size), 0)
    d_ml = ImageDraw.Draw(m_light_mask)
    d_ml.polygon(poly_l_light, fill=255)
    d_ml.polygon(poly_diag_l_light, fill=255)
    d_ml.polygon(tri_pts, fill=255)
    
    m_mid_mask = Image.new("L", (render_size, render_size), 0)
    d_mm = ImageDraw.Draw(m_mid_mask)
    d_mm.polygon(poly_l_mid, fill=255)
    d_mm.polygon(poly_diag_l_notch, fill=255)
    d_mm.polygon(poly_r_mid, fill=255)
    
    m_dark_mask = Image.new("L", (render_size, render_size), 0)
    d_md = ImageDraw.Draw(m_dark_mask)
    d_md.polygon(poly_r_dark, fill=255)
    d_md.polygon(poly_diag_r_notch, fill=255)
    d_md.polygon(poly_diag_r_dark, fill=255)
    
    m_layer = Image.new("RGBA", (render_size, render_size), (0, 0, 0, 0))
    m_layer.paste(tex_champagne, (0, 0), m_light_mask)
    m_layer.paste(tex_gold, (0, 0), m_mid_mask)
    m_layer.paste(tex_bronze, (0, 0), m_dark_mask)
    canvas = Image.alpha_composite(canvas, m_layer)
    
    # ----------------------------------------------------
    # 5. Bright Bevel Edges on 'M'
    # ----------------------------------------------------
    m_union_np = np.maximum(np.array(m_light_mask), np.maximum(np.array(m_mid_mask), np.array(m_dark_mask)))
    m_union_img = Image.fromarray(m_union_np, mode="L")
    rim_expand = max(2, int(render_size * 0.005))
    m_expanded = fast_dilate_mask(m_union_img, rim_expand)
    m_rim_np = np.maximum(0, np.array(m_expanded).astype(np.int16) - m_union_np.astype(np.int16)).astype(np.uint8)
    
    rim_layer = Image.new("RGBA", (render_size, render_size), (0, 0, 0, 0))
    rim_layer.paste(Image.new("RGBA", (render_size, render_size), (255, 248, 195, 255)), (0, 0), Image.fromarray(m_rim_np, mode="L"))
    canvas = Image.alpha_composite(canvas, rim_layer)
    
    return canvas

def build_master_assets():
    """Builds the master high-resolution renders."""
    render_size = 2048
    cx, cy = render_size / 2.0, render_size / 2.0
    
    print("Building master adaptive foreground emblem (safe ratio 0.315)...", flush=True)
    master_adaptive_fg = render_movie_tonee_emblem(render_size=render_size, radius_ratio=0.315)
    
    print("Building master legacy background...", flush=True)
    master_bg = Image.new("RGBA", (render_size, render_size), BG_COLOR_RGBA)
    ambient = create_radial_glow(render_size, render_size, cx, cy, render_size * 0.65, (38, 28, 70), max_alpha=190)
    nebula_indigo = create_radial_glow(render_size, render_size, render_size * 0.75, render_size * 0.80, render_size * 0.50, (99, 102, 241), max_alpha=80)
    nebula_violet = create_radial_glow(render_size, render_size, render_size * 0.25, render_size * 0.20, render_size * 0.50, (139, 92, 246), max_alpha=70)
    master_bg = Image.alpha_composite(master_bg, ambient)
    master_bg = Image.alpha_composite(master_bg, nebula_indigo)
    master_bg = Image.alpha_composite(master_bg, nebula_violet)
    
    print("Building master legacy square icon (emblem ratio 0.365)...", flush=True)
    legacy_emblem_sq = render_movie_tonee_emblem(render_size=render_size, radius_ratio=0.365)
    master_legacy_sq = Image.alpha_composite(master_bg, legacy_emblem_sq)
    
    print("Building master legacy round icon...", flush=True)
    legacy_emblem_rd = render_movie_tonee_emblem(render_size=render_size, radius_ratio=0.345)
    master_legacy_rd_unmasked = Image.alpha_composite(master_bg, legacy_emblem_rd)
    
    round_mask = Image.new("L", (render_size, render_size), 0)
    d_mask = ImageDraw.Draw(round_mask)
    r_mask = render_size * 0.465
    d_mask.ellipse([cx - r_mask, cy - r_mask, cx + r_mask, cy + r_mask], fill=255)
    
    rd_arr = np.array(master_legacy_rd_unmasked)
    rd_arr[..., 3] = np.array(round_mask)
    master_legacy_rd = Image.fromarray(rd_arr, mode="RGBA")
    
    return master_adaptive_fg, master_legacy_sq, master_legacy_rd

def main():
    start_t = time.time()
    print("=== Generating MovieTonee Android Mipmap and Branding Icon Assets ===", flush=True)
    
    master_fg, master_legacy_sq, master_legacy_rd = build_master_assets()
    
    # 1. Export all Android res/mipmap-* density folders
    for folder_name, specs in MIPMAP_SIZES.items():
        folder_path = os.path.join(RES_DIR, folder_name)
        os.makedirs(folder_path, exist_ok=True)
        
        launcher_size = specs["launcher"]
        fg_size = specs["foreground"]
        
        # ic_launcher.png
        p_launcher = os.path.join(folder_path, "ic_launcher.png")
        img_launcher = master_legacy_sq.resize((launcher_size, launcher_size), Image.Resampling.LANCZOS)
        img_launcher.save(p_launcher, format="PNG", optimize=True)
        print(f"[{folder_name}] ic_launcher.png ({launcher_size}x{launcher_size}) -> saved", flush=True)
        
        # ic_launcher_round.png
        p_round = os.path.join(folder_path, "ic_launcher_round.png")
        img_round = master_legacy_rd.resize((launcher_size, launcher_size), Image.Resampling.LANCZOS)
        img_round.save(p_round, format="PNG", optimize=True)
        print(f"[{folder_name}] ic_launcher_round.png ({launcher_size}x{launcher_size}) -> saved", flush=True)
        
        # ic_launcher_foreground.png
        p_fg = os.path.join(folder_path, "ic_launcher_foreground.png")
        img_fg = master_fg.resize((fg_size, fg_size), Image.Resampling.LANCZOS)
        img_fg.save(p_fg, format="PNG", optimize=True)
        print(f"[{folder_name}] ic_launcher_foreground.png ({fg_size}x{fg_size}) -> saved", flush=True)
        
    # 2. Export movietonee/assets/icon.png (1024x1024) and adaptive-icon.png (512x512)
    os.makedirs(ASSETS_DIR, exist_ok=True)
    
    p_assets_icon = os.path.join(ASSETS_DIR, "icon.png")
    img_icon_1024 = master_legacy_sq.resize((1024, 1024), Image.Resampling.LANCZOS)
    img_icon_1024.save(p_assets_icon, format="PNG", optimize=True)
    print(f"[assets] icon.png (1024x1024) -> saved", flush=True)
    
    p_assets_adaptive = os.path.join(ASSETS_DIR, "adaptive-icon.png")
    img_adaptive_512 = master_fg.resize((512, 512), Image.Resampling.LANCZOS)
    img_adaptive_512.save(p_assets_adaptive, format="PNG", optimize=True)
    print(f"[assets] adaptive-icon.png (512x512) -> saved", flush=True)
    
    elapsed = time.time() - start_t
    print(f"\nAll assets generated successfully in {elapsed:.2f}s!", flush=True)

if __name__ == "__main__":
    main()
