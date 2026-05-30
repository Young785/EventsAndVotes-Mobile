#!/usr/bin/env python3
"""Generate Evote app icon - blue gradient with vote checkmark design"""

from PIL import Image, ImageDraw
import os

def create_evote_icon(size):
    """Create a professional Evote icon at the given size."""

    # --- Background: blue gradient rounded rect ---
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))

    # Build gradient layer
    gradient = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(gradient)
    for i in range(size):
        ratio = i / size
        # Top: #1A6BFF  →  Bottom: #6C63FF
        r = int(26  + (108 - 26)  * ratio)
        g = int(107 + (99  - 107) * ratio)
        b = int(255 + (255 - 255) * ratio)
        g_draw.line([(0, i), (size - 1, i)], fill=(r, g, b, 255))

    # Rounded-rect mask
    radius = int(size * 0.22)
    mask = Image.new('L', (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, size - 1, size - 1], radius=radius, fill=255
    )
    gradient.putalpha(mask)
    img = gradient
    draw = ImageDraw.Draw(img)

    # --- White circle badge at top-centre ---
    badge_r  = int(size * 0.155)
    badge_cx = size // 2
    badge_cy = int(size * 0.30)
    draw.ellipse(
        [badge_cx - badge_r, badge_cy - badge_r,
         badge_cx + badge_r, badge_cy + badge_r],
        fill=(255, 255, 255, 255)
    )

    # Draw a bold "E" inside the badge using thick lines (no font needed)
    # Scale everything relative to badge_r
    lw   = max(2, int(badge_r * 0.22))   # line width
    bx   = badge_cx - int(badge_r * 0.52)
    by   = badge_cy - int(badge_r * 0.58)
    bw   = int(badge_r * 1.04)
    bh   = int(badge_r * 1.16)
    mid  = by + bh // 2
    col  = (26, 107, 255, 255)

    # Vertical stroke
    draw.line([(bx, by), (bx, by + bh)], fill=col, width=lw)
    # Top horizontal
    draw.line([(bx, by), (bx + bw, by)], fill=col, width=lw)
    # Middle horizontal (slightly shorter)
    draw.line([(bx, mid), (bx + int(bw * 0.78), mid)], fill=col, width=lw)
    # Bottom horizontal
    draw.line([(bx, by + bh), (bx + bw, by + bh)], fill=col, width=lw)

    # --- Ballot box outline ---
    pad      = int(size * 0.16)
    box_t    = int(size * 0.46)
    box_b    = size - int(size * 0.12)
    box_l    = pad
    box_r    = size - pad
    box_rad  = int(size * 0.07)
    box_lw   = max(2, int(size * 0.042))

    draw.rounded_rectangle(
        [box_l, box_t, box_r, box_b],
        radius=box_rad,
        outline=(255, 255, 255, 255),
        width=box_lw
    )

    # --- Checkmark inside the ballot box ---
    cx      = size // 2
    cy      = int(size * 0.685)
    arm     = int(size * 0.13)
    chk_lw  = max(2, int(size * 0.052))

    p1 = (cx - arm,            cy)
    p2 = (cx - int(arm * 0.1), cy + int(arm * 0.75))
    p3 = (cx + arm,            cy - int(arm * 0.55))

    draw.line([p1, p2], fill=(255, 255, 255, 255), width=chk_lw)
    draw.line([p2, p3], fill=(255, 255, 255, 255), width=chk_lw)

    return img


# ── Icon size maps ──────────────────────────────────────────────────────────

android_sizes = {
    'android/app/src/main/res/mipmap-mdpi/ic_launcher.png':     48,
    'android/app/src/main/res/mipmap-hdpi/ic_launcher.png':     72,
    'android/app/src/main/res/mipmap-xhdpi/ic_launcher.png':    96,
    'android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png':  144,
    'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png': 192,
}

ios_sizes = {
    'ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-20x20@1x.png':    20,
    'ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-20x20@2x.png':    40,
    'ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-20x20@3x.png':    60,
    'ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-29x29@1x.png':    29,
    'ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-29x29@2x.png':    58,
    'ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-29x29@3x.png':    87,
    'ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-40x40@1x.png':    40,
    'ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-40x40@2x.png':    80,
    'ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-40x40@3x.png':   120,
    'ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-60x60@2x.png':   120,
    'ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-60x60@3x.png':   180,
    'ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-76x76@1x.png':    76,
    'ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-76x76@2x.png':   152,
    'ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-83.5x83.5@2x.png': 167,
    'ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-1024x1024@1x.png': 1024,
}

web_sizes = {
    'web/favicon.png':                  32,
    'web/icons/Icon-192.png':          192,
    'web/icons/Icon-512.png':          512,
    'web/icons/Icon-maskable-192.png': 192,
    'web/icons/Icon-maskable-512.png': 512,
}

macos_sizes = {
    'macos/Runner/Assets.xcassets/AppIcon.appiconset/app_icon_16.png':   16,
    'macos/Runner/Assets.xcassets/AppIcon.appiconset/app_icon_32.png':   32,
    'macos/Runner/Assets.xcassets/AppIcon.appiconset/app_icon_64.png':   64,
    'macos/Runner/Assets.xcassets/AppIcon.appiconset/app_icon_128.png': 128,
    'macos/Runner/Assets.xcassets/AppIcon.appiconset/app_icon_256.png': 256,
    'macos/Runner/Assets.xcassets/AppIcon.appiconset/app_icon_512.png': 512,
    'macos/Runner/Assets.xcassets/AppIcon.appiconset/app_icon_1024.png': 1024,
}

all_icons = {**android_sizes, **ios_sizes, **web_sizes, **macos_sizes}

print("Generating Evote icons...")
for path, size in all_icons.items():
    icon = create_evote_icon(size)
    icon.save(path, 'PNG')
    print(f"  ✓  {path}  ({size}×{size})")

print("\nAll icons generated successfully!")
