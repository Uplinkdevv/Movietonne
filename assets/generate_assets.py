import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUTPUT_DIR = r"c:\Users\kusum\Desktop\my projects\screenscape\movietonee\assets"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Brand Color Constants
BG_COLOR = (10, 13, 20)           # #0A0D14
BG_COLOR_RGBA = (10, 13, 20, 255)

def get_font(name_or_path, size):
    """Loads a TTF font or falls back gracefully."""
    paths_to_try = [
        f"C:/Windows/Fonts/{name_or_path}",
        f"C:/Windows/Fonts/{name_or_path}.ttf",
        name_or_path,
        "C:/Windows/Fonts/bahnschrift.ttf",
        "C:/Windows/Fonts/segoeuib.ttf",
        "C:/Windows/Fonts/arialbd.ttf",
    ]
    for p in paths_to_try:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()

def create_metallic_gradient(width, height, angle_deg=45, stops=None):
    """Creates a smooth multi-stop metallic linear gradient texture."""
    if stops is None:
        stops = [
            (0.00, np.array([255, 252, 235], dtype=np.float32)), # Pale champagne
            (0.18, np.array([255, 222, 100], dtype=np.float32)), # Bright gold
            (0.42, np.array([245, 158, 11], dtype=np.float32)),  # Pure amber gold
            (0.68, np.array([217, 119, 6], dtype=np.float32)),   # Deep warm gold
            (0.85, np.array([255, 230, 130], dtype=np.float32)), # Specular reflection
            (1.00, np.array([120, 53, 15], dtype=np.float32)),   # Bronze edge
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

def render_emblem(size=2048, safe_padding=0.14, with_glow=True, for_favicon=False):
    """
    Renders the MovieTonee cinema film reel & stylized 'M' emblem.
    Returns an RGBA image.
    """
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    cx, cy = size / 2.0, size / 2.0
    
    # Emblem radius based on safe padding
    r_emblem = (size / 2.0) * (1.0 - safe_padding)
    
    # Shading textures
    tex_main = create_metallic_gradient(size, size, angle_deg=45)
    tex_light = create_metallic_gradient(size, size, angle_deg=35, stops=[
        (0.0, np.array([255, 255, 245], dtype=np.float32)),
        (0.25, np.array([255, 235, 140], dtype=np.float32)),
        (0.65, np.array([245, 170, 25], dtype=np.float32)),
        (1.0, np.array([217, 119, 6], dtype=np.float32)),
    ])
    tex_shadow = create_metallic_gradient(size, size, angle_deg=135, stops=[
        (0.0, np.array([245, 158, 11], dtype=np.float32)),
        (0.35, np.array([195, 95, 5], dtype=np.float32)),
        (0.70, np.array([146, 64, 14], dtype=np.float32)),
        (1.0, np.array([75, 28, 4], dtype=np.float32)),
    ])
    
    # ----------------------------------------------------
    # 1. Cinema Film Reel Rim & Spool Windows
    # ----------------------------------------------------
    r_out = r_emblem
    r_sprock_in = r_emblem * 0.90
    r_track_out = r_emblem * 0.865
    r_track_in = r_emblem * 0.825
    r_web_in = r_emblem * 0.40
    
    # Base Reel Disc Mask
    reel_rim_mask = Image.new("L", (size, size), 0)
    d_reel = ImageDraw.Draw(reel_rim_mask)
    
    # Outer Ring
    d_reel.ellipse([cx - r_out, cy - r_out, cx + r_out, cy + r_out], fill=255)
    d_reel.ellipse([cx - r_sprock_in, cy - r_sprock_in, cx + r_sprock_in, cy + r_sprock_in], fill=0)
    
    # Inner track ring
    d_reel.ellipse([cx - r_track_out, cy - r_track_out, cx + r_track_out, cy + r_track_out], fill=255)
    d_reel.ellipse([cx - r_track_in, cy - r_track_in, cx + r_track_in, cy + r_track_in], fill=0)
    
    # Film Sprockets (perforations)
    sprock_mask = Image.new("L", (size, size), 0)
    d_sprock = ImageDraw.Draw(sprock_mask)
    num_sprockets = 24 if not for_favicon else 12
    sprock_w = r_emblem * (0.045 if not for_favicon else 0.08)
    sprock_h = r_emblem * (0.065 if not for_favicon else 0.10)
    r_sprock_center = (r_out + r_sprock_in) / 2.0
    
    for i in range(num_sprockets):
        angle = 2 * math.pi * i / num_sprockets
        px = cx + r_sprock_center * math.cos(angle)
        py = cy + r_sprock_center * math.sin(angle)
        
        ca, sa = math.cos(angle), math.sin(angle)
        cpa, spa = -sa, ca
        hw, hh = sprock_w / 2.0, sprock_h / 2.0
        
        p1 = (px + ca*hh + cpa*hw, py + sa*hh + spa*hw)
        p2 = (px + ca*hh - cpa*hw, py + sa*hh - spa*hw)
        p3 = (px - ca*hh - cpa*hw, py - sa*hh - spa*hw)
        p4 = (px - ca*hh + cpa*hw, py - sa*hh + spa*hw)
        d_sprock.polygon([p1, p2, p3, p4], fill=255)
        
    reel_rim_np = np.maximum(0, np.array(reel_rim_mask).astype(np.int16) - np.array(sprock_mask).astype(np.int16)).astype(np.uint8)
    
    # Spool Web & Holes (6 circular windows)
    web_mask = Image.new("L", (size, size), 0)
    d_web = ImageDraw.Draw(web_mask)
    d_web.ellipse([cx - r_track_in, cy - r_track_in, cx + r_track_in, cy + r_track_in], fill=255)
    d_web.ellipse([cx - r_web_in, cy - r_web_in, cx + r_web_in, cy + r_web_in], fill=0)
    
    num_holes = 6
    hole_dist = r_emblem * 0.61
    hole_r = r_emblem * 0.14
    holes_mask = Image.new("L", (size, size), 0)
    d_hole = ImageDraw.Draw(holes_mask)
    for i in range(num_holes):
        ang = 2 * math.pi * i / num_holes + (math.pi / 6)
        hx = cx + hole_dist * math.cos(ang)
        hy = cy + hole_dist * math.sin(ang)
        d_hole.ellipse([hx - hole_r, hy - hole_r, hx + hole_r, hy + hole_r], fill=255)
        
    web_solid_np = np.maximum(0, np.array(web_mask).astype(np.int16) - np.array(holes_mask).astype(np.int16)).astype(np.uint8)
    # Give web surface a subtle recessed opacity
    web_shaded_np = (web_solid_np * 0.70).astype(np.uint8)
    
    # Hole Beveled Golden Rims
    hole_rim_mask = Image.new("L", (size, size), 0)
    d_hr = ImageDraw.Draw(hole_rim_mask)
    b_thick = r_emblem * 0.025
    for i in range(num_holes):
        ang = 2 * math.pi * i / num_holes + (math.pi / 6)
        hx = cx + hole_dist * math.cos(ang)
        hy = cy + hole_dist * math.sin(ang)
        d_hr.ellipse([hx - hole_r - b_thick, hy - hole_r - b_thick, hx + hole_r + b_thick, hy + hole_r + b_thick], fill=255)
        d_hr.ellipse([hx - hole_r, hy - hole_r, hx + hole_r, hy + hole_r], fill=0)
        
    # Central Hub Ring
    r_hub_rim = r_web_in
    r_hub_core = r_emblem * 0.35
    hub_mask = Image.new("L", (size, size), 0)
    d_hub = ImageDraw.Draw(hub_mask)
    d_hub.ellipse([cx - r_hub_rim, cy - r_hub_rim, cx + r_hub_rim, cy + r_hub_rim], fill=255)
    d_hub.ellipse([cx - r_hub_core, cy - r_hub_core, cx + r_hub_core, cy + r_hub_core], fill=0)
    
    # Combine Film Reel
    reel_total_np = np.maximum(reel_rim_np, np.maximum(web_shaded_np, np.maximum(np.array(hole_rim_mask), np.array(hub_mask))))
    reel_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    reel_layer.paste(tex_main, (0, 0), Image.fromarray(reel_total_np, mode="L"))
    
    # ----------------------------------------------------
    # 2. Stylized 3D Golden "M" Monogram & Play Emblem
    # ----------------------------------------------------
    # Dimensions:
    mw = r_emblem * 1.34
    mh = r_emblem * 1.20
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
    
    # Chamfer angle at top of pillars
    chamfer = stem_w * 0.35
    
    # Left Stalk - Light facet (outer) & Mid facet (inner)
    poly_l_light = [
        (xl_out, y_bot),
        (xl_out, y_top + chamfer),
        (xl_mid, y_top),
        (xl_mid, y_bot),
    ]
    poly_l_mid = [
        (xl_mid, y_top),
        (xl_in, y_top + chamfer * 0.6),
        (xl_in, y_bot),
        (xl_mid, y_bot),
    ]
    
    # Right Stalk - Mid facet (inner) & Shadow facet (outer)
    poly_r_mid = [
        (xr_in, y_top + chamfer * 0.6),
        (xr_mid, y_top),
        (xr_mid, y_bot),
        (xr_in, y_bot),
    ]
    poly_r_dark = [
        (xr_mid, y_top),
        (xr_out, y_top + chamfer),
        (xr_out, y_bot),
        (xr_mid, y_bot),
    ]
    
    # Chevron Diagonals
    # Left Diagonal - Light face (facing left/up) & Mid face
    poly_diag_l_light = [
        (xl_mid, y_top),
        (cx, y_apex),
        (cx - stem_w * 0.38, y_apex),
        (xl_in, y_top + chamfer * 0.6),
    ]
    poly_diag_l_notch = [
        (xl_mid, y_top),
        (cx, y_notch),
        (cx, y_apex),
    ]
    
    # Right Diagonal - Mid face & Shadow face
    poly_diag_r_notch = [
        (xr_mid, y_top),
        (cx, y_notch),
        (cx, y_apex),
    ]
    poly_diag_r_dark = [
        (xr_in, y_top + chamfer * 0.6),
        (xr_mid, y_top),
        (cx, y_apex),
        (cx + stem_w * 0.38, y_apex),
    ]
    
    # Masks for 3D Shading
    m_light_mask = Image.new("L", (size, size), 0)
    d_ml = ImageDraw.Draw(m_light_mask)
    d_ml.polygon(poly_l_light, fill=255)
    d_ml.polygon(poly_diag_l_light, fill=255)
    
    m_mid_mask = Image.new("L", (size, size), 0)
    d_mm = ImageDraw.Draw(m_mid_mask)
    d_mm.polygon(poly_l_mid, fill=255)
    d_mm.polygon(poly_diag_l_notch, fill=255)
    d_mm.polygon(poly_r_mid, fill=255)
    
    m_dark_mask = Image.new("L", (size, size), 0)
    d_md = ImageDraw.Draw(m_dark_mask)
    d_md.polygon(poly_r_dark, fill=255)
    d_md.polygon(poly_diag_r_notch, fill=255)
    d_md.polygon(poly_diag_r_dark, fill=255)
    
    # Central Cinema Play Symbol in notch
    tri_cx = cx
    tri_cy = y_notch - (y_notch - y_top) * 0.55
    tri_size = stem_w * 0.62
    tri_pts = [
        (tri_cx - tri_size * 0.65, tri_cy - tri_size * 0.85),
        (tri_cx + tri_size * 0.95, tri_cy),
        (tri_cx - tri_size * 0.65, tri_cy + tri_size * 0.85),
    ]
    play_mask = Image.new("L", (size, size), 0)
    d_play = ImageDraw.Draw(play_mask)
    d_play.polygon(tri_pts, fill=255)
    
    # Assemble M Layer
    m_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    m_layer.paste(tex_light, (0, 0), m_light_mask)
    m_layer.paste(tex_main, (0, 0), m_mid_mask)
    m_layer.paste(tex_shadow, (0, 0), m_dark_mask)
    m_layer.paste(tex_light, (0, 0), play_mask)
    
    # Neon Cyan/Gold Rim on M
    m_union_np = np.maximum(np.maximum(np.array(m_light_mask), np.array(m_mid_mask)),
                            np.maximum(np.array(m_dark_mask), np.array(play_mask)))
    m_union_img = Image.fromarray(m_union_np, mode="L")
    rim_expand = max(2, int(size * 0.008))
    m_expanded = m_union_img.filter(ImageFilter.MaxFilter(size=rim_expand*2 + 1))
    m_rim_np = np.maximum(0, np.array(m_expanded).astype(np.int16) - m_union_np.astype(np.int16)).astype(np.uint8)
    rim_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    # Bright golden rim with cyan glow
    rim_tex = Image.new("RGBA", (size, size), (255, 235, 150, 255))
    rim_layer.paste(rim_tex, (0, 0), Image.fromarray(m_rim_np, mode="L"))
    
    # Drop Shadow for "M" onto Reel
    m_shadow_blur = m_union_img.filter(ImageFilter.GaussianBlur(radius=size * 0.022))
    m_shadow_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    shadow_offset_y = int(size * 0.018)
    m_shadow_layer.paste(Image.new("RGBA", (size, size), (4, 5, 10, 200)), (0, shadow_offset_y), m_shadow_blur)
    
    # ----------------------------------------------------
    # 3. Overall Lighting, Auras & Specular Highlights
    # ----------------------------------------------------
    if with_glow:
        glow_rad = r_emblem * 1.15
        aura_indigo = create_radial_glow(size, size, cx, cy, glow_rad * 1.1, (99, 102, 241), max_alpha=95)
        aura_violet = create_radial_glow(size, size, cx, cy, glow_rad * 0.9, (139, 92, 246), max_alpha=85)
        aura_gold = create_radial_glow(size, size, cx, cy, glow_rad * 0.65, (245, 158, 11), max_alpha=130)
        
        # Ground shadow beneath whole emblem
        total_union_np = np.maximum(reel_total_np, m_union_np)
        total_blur = Image.fromarray(total_union_np, mode="L").filter(ImageFilter.GaussianBlur(radius=size * 0.035))
        ground_shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        ground_shadow.paste(Image.new("RGBA", (size, size), (3, 4, 8, 230)), (0, int(size * 0.025)), total_blur)
        
        canvas = Image.alpha_composite(canvas, aura_indigo)
        canvas = Image.alpha_composite(canvas, aura_violet)
        canvas = Image.alpha_composite(canvas, aura_gold)
        canvas = Image.alpha_composite(canvas, ground_shadow)
        
    # Composite Reel, M Shadow, M, Rim
    canvas = Image.alpha_composite(canvas, reel_layer)
    canvas = Image.alpha_composite(canvas, m_shadow_layer)
    canvas = Image.alpha_composite(canvas, m_layer)
    canvas = Image.alpha_composite(canvas, rim_layer)
    
    # Lens Flare Glint at top-left rim
    if not for_favicon:
        glint = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        gx = cx - r_out * 0.707
        gy = cy - r_out * 0.707
        gr = size * 0.038
        d_g = ImageDraw.Draw(glint)
        d_g.polygon([(gx - gr*1.7, gy), (gx, gy - gr*0.22), (gx + gr*1.7, gy), (gx, gy + gr*0.22)], fill=(255, 255, 255, 240))
        d_g.polygon([(gx, gy - gr*1.7), (gx + gr*0.22, gy), (gx, gy + gr*1.7), (gx - gr*0.22, gy)], fill=(255, 255, 255, 240))
        d_g.ellipse([gx - gr*0.35, gy - gr*0.35, gx + gr*0.35, gy + gr*0.35], fill=(255, 255, 255, 255))
        glint = glint.filter(ImageFilter.GaussianBlur(radius=size * 0.003))
        canvas = Image.alpha_composite(canvas, glint)
        
    return canvas

def generate_icon():
    """Generates 1024x1024 icon.png."""
    print("Generating icon.png (1024x1024)...")
    # 2x supersampling for ultra smooth rendering
    render_size = 2048
    target_size = 1024
    
    # Midnight gradient background
    bg = Image.new("RGBA", (render_size, render_size), (0, 0, 0, 0))
    cx, cy = render_size / 2.0, render_size / 2.0
    
    # Base deep midnight color
    d_bg = ImageDraw.Draw(bg)
    d_bg.rectangle([0, 0, render_size, render_size], fill=(10, 13, 20, 255))
    
    # Ambient radial gradient
    ambient_glow = create_radial_glow(render_size, render_size, cx, cy * 0.95, render_size * 0.75, (30, 24, 65), max_alpha=200)
    bg = Image.alpha_composite(bg, ambient_glow)
    
    # Royal Indigo & Violet atmospheric highlights
    nebula_indigo = create_radial_glow(render_size, render_size, render_size * 0.75, render_size * 0.80, render_size * 0.50, (99, 102, 241), max_alpha=70)
    nebula_violet = create_radial_glow(render_size, render_size, render_size * 0.25, render_size * 0.20, render_size * 0.50, (139, 92, 246), max_alpha=60)
    bg = Image.alpha_composite(bg, nebula_indigo)
    bg = Image.alpha_composite(bg, nebula_violet)
    
    # Safe padding 0.15 gives emblem diameter 70% of canvas, leaving safe margins for iOS/Android icon masks
    emblem = render_emblem(size=render_size, safe_padding=0.15, with_glow=True)
    icon_high = Image.alpha_composite(bg, emblem)
    
    # Downsample with Lanczos
    icon_final = icon_high.resize((target_size, target_size), Image.Resampling.LANCZOS)
    
    out_path = os.path.join(OUTPUT_DIR, "icon.png")
    icon_final.save(out_path, format="PNG", optimize=True)
    print(f"-> Saved: {out_path} ({target_size}x{target_size})")

def generate_adaptive_icon():
    """
    Generates 512x512 adaptive-icon.png.
    Android adaptive icon foreground: safe area is center circle of diameter ~340px (66%, radius ~170px).
    """
    print("Generating adaptive-icon.png (512x512)...")
    render_size = 2048
    target_size = 512
    
    # Safe padding of 0.42 maps solid emblem to radius ~164px (strictly inside 170px safe circle)
    emblem = render_emblem(size=render_size, safe_padding=0.42, with_glow=True)
    
    # Downsample
    adaptive_final = emblem.resize((target_size, target_size), Image.Resampling.LANCZOS)
    
    out_path = os.path.join(OUTPUT_DIR, "adaptive-icon.png")
    adaptive_final.save(out_path, format="PNG", optimize=True)
    print(f"-> Saved: {out_path} ({target_size}x{target_size})")

def generate_splash():
    """Generates 1284x2778 high-res splash.png launch screen."""
    print("Generating splash.png (1284x2778)...")
    width, height = 1284, 2778
    
    # Background: Solid #0A0D14 at borders for 100% seamless fit
    splash = Image.new("RGBA", (width, height), (10, 13, 20, 255))
    
    cx = width / 2.0
    cy_emblem = height * 0.42 # Optical center
    
    # Cinema Spotlight from top down
    spotlight_arr = np.zeros((height, width, 4), dtype=np.uint8)
    y, x = np.ogrid[:height, :width]
    # Elliptical falloff from top center
    dist = np.sqrt(((x - cx) / (width * 0.65)) ** 2 + ((y - cy_emblem * 0.6) / (height * 0.45)) ** 2)
    t = np.clip(dist, 0, 1)
    alpha = np.maximum(0, (1 - t) ** 1.8) * 110
    spotlight_arr[..., 0] = 35  # subtle indigo
    spotlight_arr[..., 1] = 28
    spotlight_arr[..., 2] = 75
    spotlight_arr[..., 3] = alpha.astype(np.uint8)
    spotlight_img = Image.fromarray(spotlight_arr, mode="RGBA")
    splash = Image.alpha_composite(splash, spotlight_img)
    
    # Ambient golden glow behind emblem
    splash_gold_glow = create_radial_glow(width, height, cx, cy_emblem, width * 0.45, (245, 158, 11), max_alpha=120)
    splash = Image.alpha_composite(splash, splash_gold_glow)
    
    # Render emblem at high resolution (1024x1024), downscale to 540x540
    emblem_render_size = 1536
    emblem_target_size = 540
    emblem_high = render_emblem(size=emblem_render_size, safe_padding=0.10, with_glow=True)
    emblem_scaled = emblem_high.resize((emblem_target_size, emblem_target_size), Image.Resampling.LANCZOS)
    
    emblem_x = int(cx - emblem_target_size / 2.0)
    emblem_y = int(cy_emblem - emblem_target_size / 2.0)
    splash.paste(emblem_scaled, (emblem_x, emblem_y), emblem_scaled)
    
    # ----------------------------------------------------
    # Typography: MovieTonee & Subtitle
    # ----------------------------------------------------
    draw = ImageDraw.Draw(splash)
    
    font_brand = get_font("bahnschrift.ttf", 96)
    font_sub = get_font("segoeui.ttf", 26)
    
    # Measure "Movie" and "Tonee"
    # "Movie" in Crisp White (#F8FAFC)
    # "Tonee" in Golden Amber (#F59E0B)
    text_part1 = "Movie"
    text_part2 = "Tonee"
    
    bbox1 = draw.textbbox((0, 0), text_part1, font=font_brand)
    bbox2 = draw.textbbox((0, 0), text_part2, font=font_brand)
    w1 = bbox1[2] - bbox1[0]
    w2 = bbox2[2] - bbox2[0]
    total_w = w1 + w2 + 4 # 4px kerning
    
    text_y = emblem_y + emblem_target_size + 64
    x1 = cx - total_w / 2.0
    x2 = x1 + w1 + 4
    
    # Subtle brand name drop shadow
    draw.text((x1, text_y + 4), text_part1, fill=(2, 3, 6, 180), font=font_brand)
    draw.text((x2, text_y + 4), text_part2, fill=(2, 3, 6, 180), font=font_brand)
    
    # Text fills
    draw.text((x1, text_y), text_part1, fill=(248, 250, 252, 255), font=font_brand)
    draw.text((x2, text_y), text_part2, fill=(245, 158, 11, 255), font=font_brand)
    
    # Subtitle with letter tracking
    sub_text = "C I N E M A T I C   S T R E A M I N G"
    sub_bbox = draw.textbbox((0, 0), sub_text, font=font_sub)
    sub_w = sub_bbox[2] - sub_bbox[0]
    sub_y = text_y + 115
    sub_x = cx - sub_w / 2.0
    draw.text((sub_x, sub_y), sub_text, fill=(148, 163, 184, 230), font=font_sub)
    
    # Elegant Golden Gradient Accent Bar below subtitle
    bar_w = 200
    bar_h = 3
    bar_y = sub_y + 50
    bar_x0 = int(cx - bar_w / 2.0)
    for bx in range(bar_w):
        # Fade to 0 at edges
        dist_factor = 1.0 - abs(bx - bar_w/2.0) / (bar_w / 2.0)
        alpha = int(220 * (dist_factor ** 2))
        draw.line([(bar_x0 + bx, bar_y), (bar_x0 + bx, bar_y + bar_h)], fill=(245, 158, 11, alpha))
        
    out_path = os.path.join(OUTPUT_DIR, "splash.png")
    splash.save(out_path, format="PNG", optimize=True)
    print(f"-> Saved: {out_path} ({width}x{height})")

def generate_favicon():
    """Generates 48x48 crisp favicon.png."""
    print("Generating favicon.png (48x48)...")
    # 8x supersampling for maximum subpixel clarity
    render_size = 384
    target_size = 48
    
    # Dark rounded background canvas
    fav_high = Image.new("RGBA", (render_size, render_size), (0, 0, 0, 0))
    d_fav = ImageDraw.Draw(fav_high)
    d_fav.rounded_rectangle([4, 4, render_size - 4, render_size - 4], radius=render_size * 0.22, fill=(10, 13, 20, 255))
    
    # Optimized emblem for favicon (thicker strokes, high contrast)
    emblem = render_emblem(size=render_size, safe_padding=0.08, with_glow=False, for_favicon=True)
    fav_high = Image.alpha_composite(fav_high, emblem)
    
    # Downsample
    fav_final = fav_high.resize((target_size, target_size), Image.Resampling.LANCZOS)
    
    out_path = os.path.join(OUTPUT_DIR, "favicon.png")
    fav_final.save(out_path, format="PNG", optimize=True)
    print(f"-> Saved: {out_path} ({target_size}x{target_size})")

def main():
    print("--- MovieTonee Visual Branding Asset Generator ---")
    generate_icon()
    generate_adaptive_icon()
    generate_splash()
    generate_favicon()
    print("All assets generated successfully!")

if __name__ == "__main__":
    main()
