---
title: Theming
description: Your accent color, light and dark themes, and the Cratis design language a Cast site uses.
---

A Cast site uses the Cratis design language: the near-black ground and warm off-white light theme of [cratis.no](https://cratis.no), Inter for text, JetBrains Mono for data and Fraunces italic as the accent, all self-hosted. You choose one thing: your accent.

## Your accent

```yaml
theme:
  accent: "#0ea5e9"
  mode: system
```

`accent` colors your primary buttons, your monogram and favicon, focus glows and the italic accent words (`*like this*`). The default is Cratis violet, `#8b5cf6`.

You do not need to pick an accessible shade. Cast derives four tokens from your color and adjusts each until it reaches at least 4.5:1 contrast (WCAG AA) on its background: one for dark, one for light, plus a softer variant of each for large text. Text on the accent (button labels, the monogram letter) is white or near-black, whichever reads better.

`mode` sets what first-time visitors see: `dark` (the default), `light`, or `system` to follow their operating system. Everyone can switch with the theme button, the command palette or the terminal, and the choice is remembered.

## What stays fixed

These colors carry meaning, so they do not follow your accent:

| Color | Means |
| --- | --- |
| Blue | A command: an intent to change. |
| Amber | An event: a fact that happened. |
| Teal | A read model: a projection of facts. |

They are the sticky-note colors of [Event Modeling](https://eventmodeling.org), and they appear across the career stream, the event model board and the section labels. Tier badges keep their own colors: Core violet-to-teal, Partner teal, Contributor amber.

## Motion and print

Animations respect the visitor's reduced-motion setting, and can also be turned off from the command palette. `/cv` has a print stylesheet: print it or save it as a PDF from the browser.
