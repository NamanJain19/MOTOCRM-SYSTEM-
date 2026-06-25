---
name: Velocity Dark
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c3c5d9'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#8d90a2'
  outline-variant: '#434656'
  surface-tint: '#b7c4ff'
  primary: '#b7c4ff'
  on-primary: '#002682'
  primary-container: '#0052ff'
  on-primary-container: '#dfe3ff'
  inverse-primary: '#004ced'
  secondary: '#c6c6c7'
  on-secondary: '#2f3131'
  secondary-container: '#454747'
  on-secondary-container: '#b4b5b5'
  tertiary: '#ffb4a1'
  on-tertiary: '#611300'
  tertiary-container: '#bf3003'
  on-tertiary-container: '#ffddd5'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001452'
  on-primary-fixed-variant: '#0038b6'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c7'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#ffdbd2'
  tertiary-fixed-dim: '#ffb4a1'
  on-tertiary-fixed: '#3c0800'
  on-tertiary-fixed-variant: '#891e00'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  headline-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.02em
  mono:
    fontFamily: jetbrainsMono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  container-max: 1200px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  stack-xs: 4px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  stack-xl: 64px
---

## Brand & Style

This design system embodies a premium, high-performance aesthetic tailored for technical SaaS environments. The brand personality is precise, authoritative, and focused, catering to developers and power users who value efficiency and visual clarity. 

The style is a hybrid of **Minimalism** and **Modern Corporate**, heavily influenced by high-end engineering tools. It utilizes deep blacks and rich grays to create a sense of infinite depth, while maintaining a strict commitment to functional density. The emotional response is one of "calm power"—a professional workspace that fades into the background to let the user's data and workflows take center stage. High-contrast accents are used sparingly but purposefully to guide attention to critical actions.

## Colors

The palette is anchored by a true black background to ensure perfect contrast and deep blacks on OLED displays. 

- **Primary (Moto Blue):** Used exclusively for primary call-to-actions, active states, and critical indicators.
- **Surface Hierarchy:** Depth is created through layered grays rather than shadows. `#0a0a0a` serves as the canvas, with `#111111` for primary containers and `#171717` for elevated elements like modals or popovers.
- **Borders:** Instead of heavy strokes, use low-opacity white borders (`0.08` to `0.15` alpha) to define edges against the dark background.
- **Status:** Success, Warning, and Error colors should be desaturated slightly to prevent "vibrating" against the dark background while maintaining high accessibility.

## Typography

The design system utilizes **Geist** for its systematic, developer-centric feel. It offers excellent legibility at small sizes and a sophisticated, architectural look at display sizes.

- **Scale:** High contrast between headlines and body text is essential. Headlines should use tighter letter spacing and semi-bold weights.
- **Readability:** Body text uses a slightly lighter gray (`#a1a1aa`) to reduce eye strain, while headings remain pure white.
- **Monospace:** Use **JetBrains Mono** for code snippets, data IDs, and technical values to reinforce the high-performance SaaS narrative.

## Layout & Spacing

This design system uses a **Fluid Grid** model with a maximum container width of 1200px for content-heavy views. 

- **Grid:** Use a 12-column grid for desktop with 24px gutters. Elements should snap to the grid to maintain mathematical rigor.
- **Rhythm:** An 8pt linear scale is the foundation for all spatial relationships. 
- **Density:** Information density should be high. Use `stack-sm` (8px) for related items and `stack-md` (16px) for distinct sections within a card.
- **Responsiveness:** On mobile, margins shrink to 16px and the grid collapses to a single column. Horizontal scrolling is preferred for data tables and code blocks on smaller viewports.

## Elevation & Depth

In this dark-mode environment, depth is communicated through **Tonal Layers** and **Subtle Outlines** rather than traditional shadows.

- **Stacking:** The further "forward" an object is in the Z-space, the lighter its surface hex value becomes.
- **Borders:** Every container (Cards, Modals, Sidebars) must have a `1px` solid border using `border-subtle`. This creates the necessary definition against the `#0a0a0a` background.
- **Inner Glow:** For primary buttons or active states, a very subtle top-aligned inner highlight (1px, white, 10% opacity) can be used to simulate a physical edge catching light.
- **Backdrop Blur:** Use a 20px blur on fixed navigation bars and floating menus with a semi-transparent `#0a0a0a` fill to maintain context of the content beneath.

## Shapes

The shape language is disciplined and geometric. 

- **Radius:** A "Soft" radius (4px to 8px) is used to prevent the UI from feeling overly aggressive while maintaining a professional, engineered look. 
- **Inputs & Buttons:** Standardized at `rounded-md` (4px or 0.25rem).
- **Cards:** Use `rounded-lg` (8px or 0.5rem) to provide a clear distinction from smaller interactive components.
- **Consistency:** Avoid pill-shaped buttons; stick to the defined rectangular radius to align with the technical SaaS aesthetic.

## Components

- **Buttons:** 
  - *Primary:* Moto Blue (#0052ff) background, white text, 1px inner light highlight.
  - *Secondary:* Transparent background, `border-muted`, white text. Hover state: Surface-2 background.
- **Inputs:** 
  - Background: `#111111`. Border: `border-subtle`. Focus state: Border becomes Moto Blue with a 2px blue outer glow at 20% opacity.
- **Cards:** 
  - Background: `#111111`. Border: `border-subtle`. Padding: `stack-md` (16px).
- **Chips/Badges:** 
  - Small, mono font, uppercase. Use a subtle background (white at 5% opacity) and `border-subtle`.
- **Lists:** 
  - Use `border-subtle` as horizontal dividers between items. Ensure 12px vertical padding for high touch-targets.
- **Status Indicators:** 
  - Use small 8px circles. Green for "Connected/Operational", Moto Blue for "Processing", and Red for "Issue".