---
name: LinkTracker
colors:
  surface: '#fafaf3'
  surface-dim: '#dbdad4'
  surface-bright: '#fafaf3'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f4ed'
  surface-container: '#efeee7'
  surface-container-high: '#e9e8e2'
  surface-container-highest: '#e3e3dc'
  on-surface: '#1b1c18'
  on-surface-variant: '#49473c'
  inverse-surface: '#30312c'
  inverse-on-surface: '#f2f1ea'
  outline: '#7a776b'
  outline-variant: '#cac6b8'
  surface-tint: '#636037'
  primary: '#636037'
  on-primary: '#ffffff'
  primary-container: '#fff9c4'
  on-primary-container: '#767248'
  inverse-primary: '#cdc897'
  secondary: '#5b6300'
  on-secondary: '#ffffff'
  secondary-container: '#e0eb78'
  on-secondary-container: '#616a00'
  tertiary: '#326578'
  on-tertiary: '#ffffff'
  tertiary-container: '#eef9ff'
  on-tertiary-container: '#46778c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#eae4b1'
  primary-fixed-dim: '#cdc897'
  on-primary-fixed: '#1e1c00'
  on-primary-fixed-variant: '#4b4822'
  secondary-fixed: '#e0eb78'
  secondary-fixed-dim: '#c3ce5f'
  on-secondary-fixed: '#1a1d00'
  on-secondary-fixed-variant: '#444b00'
  tertiary-fixed: '#bbe9ff'
  tertiary-fixed-dim: '#9ccee4'
  on-tertiary-fixed: '#001f29'
  on-tertiary-fixed-variant: '#154d5f'
  background: '#fafaf3'
  on-background: '#1b1c18'
  surface-variant: '#e3e3dc'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 57px
    fontWeight: '700'
    lineHeight: 64px
    letterSpacing: -0.25px
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  title-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '500'
    lineHeight: 28px
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
    letterSpacing: 0.15px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0.5px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0.25px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.1px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.5px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  unit: 8px
  margin-mobile: 16px
  margin-tablet: 24px
  margin-desktop: 32px
  gutter: 24px
  container-max-width: 1280px
---

## Brand & Style
The design system for LinkTracker focuses on a warm, approachable, and highly legible interface that prioritizes organizational clarity. The brand personality is helpful and optimistic, moving away from the cold utility of traditional link managers toward a more human-centric "digital garden" aesthetic.

The design style is a refined execution of **Corporate Modern** with a **Tactile** softness. It leverages the core principles of Material 3 (Material You), utilizing organic shapes, generous whitespace, and a dynamic color system that adapts to the user's content. The UI should evoke a sense of calm and order, characterized by large corner radii, soft tonal shifts instead of harsh lines, and high-quality typography.

## Colors
The palette is centered around a "Creamy Yellow" primary tone, creating a soft and inviting atmosphere. The system uses a tonal palette approach where surfaces are derived from the primary hue to ensure harmony.

- **Primary**: Creamy Yellow (#FFF9C4) used for key action buttons and active states.
- **Secondary**: A soft Lime/Olive (#DCE775) for auxiliary accents and categorization.
- **Tertiary**: A gentle Sky Blue (#B3E5FC) for informational elements or link status indicators.
- **Surface**: A very light neutral with yellow tints (#FDFCF5) to maintain warmth across the background.
- **On-Surface**: Deep charcoal with a hint of warm brown for text to ensure high contrast without the harshness of pure black.

## Typography
The typography system uses **Plus Jakarta Sans** for headlines to provide a soft, modern, and geometric feel that aligns with the rounded UI. **Inter** is utilized for body text and labels to maintain exceptional legibility at smaller scales and within data-heavy link lists.

Hierarchical weight is used to distinguish between link titles and metadata. Display and Headline styles should be used sparingly for page titles and empty states, while Title and Body styles handle the majority of the application's information architecture.

## Layout & Spacing
This design system utilizes a **fluid grid** model with standardized margins that increase as the viewport expands. 

- **Grid**: A 12-column grid for desktop and tablet; a 4-column grid for mobile.
- **Rhythm**: All spacing (padding, margins, gap) must be multiples of the 8px base unit. 
- **Density**: A "relaxed" density is preferred for the link feed to reduce cognitive load, while a "compact" density (4px units) may be used within sidebar navigation or settings panels.
- **Safe Areas**: Cards and containers should maintain a minimum of 24px internal padding to uphold the high-emphasis whitespace requirement.

## Elevation & Depth
Elevation in this design system is expressed through **Tonal Layers** rather than heavy shadows. Following Material 3 logic, surfaces are differentiated by their color luminance.

- **Level 0 (Base)**: The primary background color.
- **Level 1 (Cards/Containers)**: A slightly lighter or slightly darker tinted surface with a very soft, high-diffusion shadow (Blur: 8px, Opacity: 4%, Tinted with the primary color).
- **Level 2 (Interaction)**: Used for hovered states, increasing the shadow depth and slightly shifting the tonal value of the surface.
- **Level 3 (Modals/Overlays)**: Distinct elevation with a 16px blur shadow and a subtle inner stroke to define the boundary against the background.

## Shapes
The shape language is extremely rounded to convey a friendly and safe user experience. 

- **Small Components**: Buttons, inputs, and chips use a "Pill" shape (fully rounded).
- **Medium Components**: Feature cards and link item containers use a **24px** radius.
- **Large Components**: Main content areas and bottom sheets use a **32px** radius, often only on top corners for sheets.
- **Selection**: Active states in navigation should use a "stadium" shape or rounded-pill background behind the icon/label.

## Components
- **Buttons**: Primary buttons are pill-shaped, filled with Creamy Yellow, using a dark label for contrast. Ghost buttons use a subtle tonal border.
- **Cards**: Cards are the primary vessel for links. They must feature a 24px corner radius, Level 1 elevation, and generous internal padding (24px).
- **Input Fields**: Search bars and URL inputs use a pill shape, a subtle primary-tinted background, and no border unless focused.
- **Chips**: Used for categories and tags. They are pill-shaped with a low-contrast secondary color background and Inter Label-sm typography.
- **Navigation**: Use a Navigation Bar (bottom) for mobile and a Navigation Rail or Drawer for desktop. Active states are indicated by a pill-shaped tonal highlight.
- **Link Preview**: A specific component combining a favicon/image (12px radius) with Title-md and Body-md text, optimized for quick scanning.