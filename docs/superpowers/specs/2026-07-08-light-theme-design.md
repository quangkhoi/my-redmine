# Light Theme Design Spec

## Overview

Add a clean, minimal light theme as the default to the WDM Redmine Platform. Dark theme remains available via sidebar toggle. Uses CSS custom properties + Tailwind integration (shadcn/ui pattern).

## Requirements

- Light theme is the default
- Dark theme available via sidebar toggle (sun/moon icon)
- Toggle persists to localStorage
- System preference respected on first visit (if no saved preference)
- Smooth 200ms transition between themes
- All panels, tables, inputs, buttons must work in both themes

## Color System

### CSS Variables

Light mode (`:root`):
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  --card: 0 0% 98%;
  --card-foreground: 222 47% 11%;
  --primary: 198 93% 50%;
  --primary-foreground: 0 0% 100%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222 47% 11%;
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
  --accent: 198 93% 50%;
  --accent-foreground: 0 0% 100%;
  --border: 214 32% 91%;
  --input: 214 32% 91%;
  --ring: 198 93% 50%;
  --destructive: 0 84% 60%;
  --sidebar-bg: 210 40% 98%;
  --sidebar-text: 215 25% 27%;
  --sidebar-muted: 215 16% 47%;
}
```

Dark mode (`.dark`):
```css
.dark {
  --background: 240 6% 3%;
  --foreground: 210 40% 98%;
  --card: 240 6% 5%;
  --card-foreground: 210 40% 98%;
  --primary: 198 93% 50%;
  --primary-foreground: 0 0% 100%;
  --secondary: 240 4% 16%;
  --secondary-foreground: 210 40% 98%;
  --muted: 240 4% 16%;
  --muted-foreground: 215 20% 65%;
  --accent: 198 93% 50%;
  --accent-foreground: 0 0% 100%;
  --border: 0 0% 100%;
  --input: 0 0% 100%;
  --ring: 198 93% 50%;
  --destructive: 0 63% 31%;
  --sidebar-bg: 240 6% 3%;
  --sidebar-text: 215 20% 65%;
  --sidebar-muted: 215 20% 55%;
}
```

### Tailwind Config

```ts
// tailwind.config.ts
darkMode: 'class',
theme: {
  extend: {
    colors: {
      border: "hsl(var(--border))",
      input: "hsl(var(--input))",
      ring: "hsl(var(--ring))",
      background: "hsl(var(--background))",
      foreground: "hsl(var(--foreground))",
      primary: {
        DEFAULT: "hsl(var(--primary))",
        foreground: "hsl(var(--primary-foreground))",
      },
      secondary: {
        DEFAULT: "hsl(var(--secondary))",
        foreground: "hsl(var(--secondary-foreground))",
      },
      destructive: {
        DEFAULT: "hsl(var(--destructive))",
      },
      muted: {
        DEFAULT: "hsl(var(--muted))",
        foreground: "hsl(var(--muted-foreground))",
      },
      accent: {
        DEFAULT: "hsl(var(--accent))",
        foreground: "hsl(var(--accent-foreground))",
      },
      card: {
        DEFAULT: "hsl(var(--card))",
        foreground: "hsl(var(--card-foreground))",
      },
      sidebar: {
        DEFAULT: "hsl(var(--sidebar-bg))",
        text: "hsl(var(--sidebar-text))",
        muted: "hsl(var(--sidebar-muted))",
      },
    },
  },
},
```

## Theme Toggle

### ThemeProvider

- React context: `ThemeContext` with `theme: 'light' | 'dark'`, `setTheme`
- Reads from `localStorage('wdm-theme')` on mount
- Default: `'light'`
- Applies `class="dark"` to `<html>` element
- Wraps entire app in `RootLayout`

### ThemeToggle Component

- Sun/Moon icon button (Lucide `Sun`/`Moon`)
- Positioned in sidebar bottom
- Calls `setTheme()` on click
- Transition: `transition-colors duration-200`

### HTML Root

```tsx
<html lang="en" className={theme} suppressHydrationWarning>
```

## Component Mapping

### AdminShell
| Element | Light | Dark |
|---------|-------|------|
| Sidebar bg | `bg-[sidebar]` | `bg-[sidebar]` |
| Sidebar text | `text-[sidebar-text]` | `text-[sidebar-text]` |
| Sidebar active | `bg-primary/10 text-primary` | `bg-primary/10 text-primary` |
| Header bg | `bg-background/80 backdrop-blur-md` | `bg-background/80 backdrop-blur-md` |
| Border | `border-border` | `border-border` |
| Main bg | `bg-background` | `bg-background` |

### Panels
| Element | Light | Dark |
|---------|-------|------|
| Outer panel | `bg-card border-border text-card-foreground` | Same |
| Inner sections | `bg-secondary` | Same |
| Input fields | `bg-background border-border` | Same |
| Buttons | `bg-secondary hover:bg-secondary/80` | Same |

### Tables
| Element | Light | Dark |
|---------|-------|------|
| Header rows | `bg-secondary` | Same |
| Borders | `border-border` | Same |
| Row overdue | `bg-red-500/10` | `bg-red-500/20` |
| Row safe | `bg-green-500/10` | `bg-green-500/20` |

### Search Highlight
| Mode | Background | Text |
|------|-----------|------|
| Light | `bg-amber-100` | `text-amber-900` |
| Dark | `bg-amber-400/30` | `text-amber-200` |

### Report CSS (globals.css)
```css
.report-team-row td {
  background: hsl(var(--primary) / 0.1);
  color: hsl(var(--primary));
}
.report-section-row td {
  background: hsl(var(--secondary));
}
.report-row-excluded td {
  background: hsl(var(--muted));
  color: hsl(var(--muted-foreground));
}
```

## Files Changed

1. `tailwind.config.ts` — darkMode + CSS variable colors
2. `src/app/globals.css` — `:root` and `.dark` variables, updated report CSS
3. `src/app/layout.tsx` — ThemeProvider, html className
4. `src/components/theme/ThemeProvider.tsx` — new, context + localStorage
5. `src/components/theme/ThemeToggle.tsx` — new, sun/moon button
6. `src/components/layouts/AdminShell.tsx` — replace hardcoded colors
7. `src/components/features/dashboard/DashboardIssuesPanel.tsx`
8. `src/components/features/daily-report/DailyReportPanel.tsx`
9. `src/components/features/weekly-report/WeeklyReportPanel.tsx`
10. `src/components/features/my-task/MyTaskPanel.tsx`
11. `src/components/features/login-time/LogTimePanel.tsx`
12. `src/components/ui/SearchHighlight.tsx`

## Verification

- `npm run build` passes
- Light theme renders correctly (all panels, tables, inputs)
- Dark theme renders correctly (all panels, tables, inputs)
- Toggle persists across page reloads
- Search highlight visible in both themes
- Report copy (HTML + plain text) unaffected
- Excel export unaffected
