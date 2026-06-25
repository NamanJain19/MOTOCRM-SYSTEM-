---
name: Velocity Systems
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#434656'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#737688'
  outline-variant: '#c3c5d9'
  surface-tint: '#004ced'
  primary: '#003ec7'
  on-primary: '#ffffff'
  primary-container: '#0052ff'
  on-primary-container: '#dfe3ff'
  inverse-primary: '#b7c4ff'
  secondary: '#a33800'
  on-secondary: '#ffffff'
  secondary-container: '#cd4800'
  on-secondary-container: '#fffbff'
  tertiary: '#952200'
  on-tertiary: '#ffffff'
  tertiary-container: '#bf3003'
  on-tertiary-container: '#ffddd5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001452'
  on-primary-fixed-variant: '#0038b6'
  secondary-fixed: '#ffdbce'
  secondary-fixed-dim: '#ffb59a'
  on-secondary-fixed: '#370e00'
  on-secondary-fixed-variant: '#802a00'
  tertiary-fixed: '#ffdbd2'
  tertiary-fixed-dim: '#ffb4a1'
  on-tertiary-fixed: '#3c0800'
  on-tertiary-fixed-variant: '#891e00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

The design system is engineered for the high-stakes environment of motorcycle dealerships, blending the precision of high-performance machinery with the sophisticated utility of a modern SaaS. The aesthetic is a refined fusion of **Minimalism** and **Glassmorphism**, emphasizing clarity, speed, and trust.

The UI should feel "engineered" rather than just "designed"—utilizing generous whitespace to prevent cognitive overload during complex sales workflows. Key visual signatures include semi-transparent layers that hint at depth, sharp typographical hierarchies, and a restrained but high-energy accent palette. The goal is to evoke the feeling of a premium showroom: clean, organized, and technologically advanced.

## Colors

This design system utilizes a structured palette that balances professional "Trust Blue" with "Speed Orange" accents.

- **Primary (Moto Blue):** Used for primary actions, active states, and branding. It conveys stability and institutional trust.
- **Secondary (Speed Orange):** Reserved for high-energy notifications, "Hot Leads," or "New Arrival" indicators. Use sparingly to maintain a premium feel.
- **Neutral:** A slate-based scale (from #0F172A to #F8FAFC) used for text, borders, and subtle backgrounds. 
- **Surface Strategy:** The background is a clean off-white (#F8FAFC). Cards and containers utilize pure white (#FFFFFF) with varying degrees of opacity when glassmorphism effects are applied to indicate hierarchy.

## Typography

The typography system relies on **Inter** for its incredible legibility in data-heavy environments. **Geist** is introduced for labels and technical data (like VIN numbers or inventory codes) to provide a precise, monospaced-adjacent feel that aids in scanning technical specifications.

- **Headlines:** Use tight letter-spacing and bold weights for a "machined" look.
- **Body:** Standard weight (400) is used for all descriptive text to ensure maximum readability.
- **Data Display:** When displaying numerical data in tables, use tabular font features to ensure columns align perfectly.

## Layout & Spacing

The design system employs a **12-column fluid grid** for desktop and a **4-column grid** for mobile. 

- **The Logic:** A 4px baseline grid governs all internal component spacing (8px, 16px, 24px).
- **Desktop:** Sidebars are fixed at 280px. Main content areas use a flexible max-width container (1440px) centered in the viewport.
- **Mobile:** Margins shrink to 16px. Cards typically stack vertically, but horizontal scrolling "carousels" are permitted for inventory photo galleries.
- **Negative Space:** Use "Heavy Whitespace" (Level: LG or XL) between major sections to denote clear separation of concerns (e.g., separating Customer Details from Service History).

## Elevation & Depth

This design system uses a layered approach to depth to create a modern, "Glassmorphism" effect:

1.  **Level 0 (Base):** Off-white background (#F8FAFC).
2.  **Level 1 (Cards):** Pure white background with a 1px border (#E2E8F0) and a soft, multi-layered shadow (0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)).
3.  **Level 2 (Modals/Popovers):** Semi-transparent white (rgba(255, 255, 255, 0.8)) with a `backdrop-filter: blur(12px)`. This creates the signature high-end glass effect.
4.  **Shadows:** Shadows should be tinted slightly with the primary blue color (e.g., `rgba(0, 82, 255, 0.05)`) to maintain a cohesive, professional atmosphere. Avoid pure black shadows.

## Shapes

The shape language is approachable yet structured. 

- **Standard Containers:** Use 12px (`rounded-md`) for standard cards and input fields.
- **Large Components:** Use 16px (`rounded-lg`) for major dashboard widgets and modal containers.
- **Interactive Elements:** Buttons and tags use a slightly more pronounced rounding (8px to 12px) but stop short of full "pill" shapes to maintain a professional, SaaS-oriented aesthetic.
- **Borders:** All borders should be 1px wide, using a subtle neutral-200 tint to define edges without adding visual noise.

## Components

- **Primary Buttons:** Solid Moto Blue background with white text. Use a subtle inner glow on hover to simulate a "physical" high-quality switch.
- **Status Badges:** Use low-saturation backgrounds with high-saturation text (e.g., "In Stock" uses a very light green background with dark green text).
- **Data Tables:** Remove all vertical borders. Use subtle horizontal dividers and 16px padding on rows. The header row should be slightly darker (#F1F5F9) with Uppercase Geist labels.
- **Timeline Views:** Used for vehicle service history. Use a thin 2px vertical line in Neutral-200 with Moto Blue dots for active milestones.
- **Input Fields:** 12px rounded corners, 1px Neutral-300 border. On focus, the border transitions to Moto Blue with a 3px soft blue outer glow.
- **Theme Switcher Placeholder:** Located in the top right of the global navigation, represented currently as a ghost icon button to reserve architectural space for future dark mode implementation.