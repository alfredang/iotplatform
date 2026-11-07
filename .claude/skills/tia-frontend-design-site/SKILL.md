---
name: tia-frontend-design-site
description: This site's own design system for IoTFlow, a low-code self-hosted IoT platform — teal primary, Geist, light and dark themes. Load with the user-level tia-frontend-design skill.
---

# IoTFlow — Site Design System

**Load the user-level `tia-frontend-design` skill as well.** It owns the group's rules: no dead space or gaps, no chips, no template layouts, an animated hero, generated images and a lighter theme by default. This file records how they apply on this site and wins on theme and look.

## Direction

A low-code IoT platform for makers and teams connecting devices over MQTT and HTTP. It should feel technical, live and dependable.

## Theme

Both themes exist, with a toggle. `components/theme-provider.tsx` sets `defaultTheme="dark"`. That suits the dashboard, but the standard says never to default to dark, so review the default for the marketing pages before changing it.

| Token (`app/globals.css`) | Light | Dark |
|---|---|---|
| `--background` | `#f7f8fa` | `#0a0e14` |
| `--surface` | `#ffffff` | `#121821` |
| `--foreground` | `#11161d` | `#e8edf4` |
| `--muted` | `#5b6573` | `#8a96a6` |
| `--primary` | `#0ea5a3` | `#14b8a6` |
| `--accent` | `#2563eb` | `#3b82f6` |
| `--border` | `#e3e6eb` | `#232c39` |

## Type

Geist and Geist Mono, loaded once in `app/layout.tsx`.

## Hero and images

- **Hero:** `app/(marketing)/page.tsx` with `components/marketing/dashboard-preview.tsx`.
- **Images:** tutorial screenshots live in `public/tutorials/`. Other new images must be generated, not taken from a stock library.

## Navbar and chat widget

`components/marketing/site-header.tsx` and `components/marketing/whatsapp-button.tsx`.

## Known violations

Do not copy these. Fix them when you touch the file.

- **Hero:** the dashboard preview does not animate yet. Making its readings move would suit the subject.
- **Chat widget:** a plain WhatsApp button; the standard requires a mascot.
- **Chips:** `app/(marketing)/page.tsx`, `app/(marketing)/blog/page.tsx`, `app/(marketing)/blog/[slug]/page.tsx`.
- **Reduced motion:** no `prefers-reduced-motion` handling found in the components.
