# BEŞ — Claude Code Asset Handoff

## Non-negotiable brand rule
- Brand name: **BEŞ**
- Visual symbol: **5**
- Do NOT redraw, reinterpret, regenerate or replace the supplied logo.
- Use the supplied SVG files as the source of truth.
- Dark and Light variants use the SAME symbol geometry. Only theme colors/background treatment differ.

## Files
- `svg/BES_AppIcon_Dark.svg` — dark master vector icon
- `svg/BES_AppIcon_Light.svg` — light master vector icon
- `svg/BES_Symbol_Gold.svg` — transparent vector symbol
- `svg/BES_Symbol_Emerald.svg` — transparent vector symbol
- `svg/BES_Symbol_Monochrome_Black.svg`
- `svg/BES_Symbol_Monochrome_White.svg`
- `svg/BES_Android_Adaptive_Foreground.svg`
- `svg/BES_Android_Notification_Monochrome.svg`
- `svg/BES_Pattern_Dark.svg`
- `svg/BES_Pattern_Light.svg`
- `png/` — raster app-icon masters and practical sizes
- `brand.tokens.json` — canonical palette/name metadata
- `reference/BES_Brand_Guideline_Board.png` — visual reference only

## Implementation
1. Replace user-visible old branding (`Sükûn`, `Sukun`) with `BEŞ`.
2. Keep technical package/bundle IDs unless migration is explicitly necessary.
3. Configure iOS app icon from supplied masters. Do not add another rounded-square mask inside Apple's mask.
4. Configure Android adaptive icon using supplied foreground and Deep Emerald background.
5. Android notification small icon must be monochrome; use the supplied notification SVG.
6. Use Dark/Light pattern SVGs sparingly on hero surfaces, splash, widgets, Live Activity and branded headers.
7. Use `brand.tokens.json` as the source for design tokens.
8. Do not feed these files to an image generator. Import them directly.
9. Preserve aspect ratio. Never stretch, rotate, skew or recolor outside approved variants.
10. For very small UI marks, prefer the monochrome/simplified symbol rather than shrinking intricate mosque detail beyond legibility.

## Brand palette
Deep Emerald `#003F32`
Emerald `#005343`
Warm Ivory `#F7F3E8`
Soft Beige `#EADFC7`
Muted Gold `#D6B46A`

## QA
Verify app icon, splash, home-screen label BEŞ, notifications, Android adaptive icon, Android notification glyph, widgets, Live Activity/Dynamic Island, Watch surfaces, dark/light themes, Turkish `Ş`, and store artwork.
