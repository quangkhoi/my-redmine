# WDM Redmine Platform: Enterprise Design System & Dashboard Architecture

![WDM Redmine Dashboard Mockup](C:\Users\freeC\.gemini\antigravity\brain\93cc5f72-d9cc-41e7-beda-c4776d251f49\wdm_redmine_dashboard_mockup_1783070824722.png)

> [!NOTE]
> **Design Philosophy**: The WDM Redmine Platform follows a "2026 SaaS" aesthetic. It prioritizes extreme information density without visual clutter, relying on typography, subtle contrast, and spatial relationships rather than borders and heavy backgrounds. The design language is inspired by Linear, Vercel, and modern issue trackers, leaving behind the traditional, dated Redmine interface.

---

## 1. Full Page Wireframe

The layout utilizes a collapsible sidebar and a fixed top header, providing maximum horizontal space for data while keeping navigation accessible.

```text
+-----------------------------------------------------------------------------------------+
| [WDM Logo] | Project Switcher     |  Search Issues (Cmd+K)  | [Bell] [Help] [Avatar]    |
+-----------------------------------------------------------------------------------------+
|                 |                                                                       |
| [X] Dashboard   |  Breadcrumbs: WDM Redmine / My Dashboard                              |
| [ ] Projects    |                                                                       |
| [ ] Issues      |  +--------------------+ +--------------------+ +--------------------+ |
| [ ] Agile Board |  | KPI: Open Issues   | | KPI: Active Sprints| | KPI: Time Logged   | |
| [ ] Time Logs   |  | 142    +5 (7d)     | | 3     On Track     | | 340h   This Week   | |
|                 |  +--------------------+ +--------------------+ +--------------------+ |
| [ ] Roadmap     |                                                                       |
| [ ] Wiki        |  +---------------------------------------+ +------------------------+ |
|                 |  | AI Insights (Sparkle Icon)            | | Action Center (Queue)  | |
| ---             |  | • Issue #405 is at risk of delay.     | | [ ] Review PR #102     | |
| [ ] Settings    |  | • Duplicate bug reports detected.     | | [ ] Approve 4 tickets  | |
|                 |  | [ View detailed report ]              | | [ ] Log Friday's time  | |
|                 |  +---------------------------------------+ +------------------------+ |
|                 |                                                                       |
|                 |  +---------------------------------------+ +------------------------+ |
|                 |  | Issues Overview (Data Table)          | | Recent Activity        | |
|                 |  | [Filter] [Columns] [Export]           | | • John closed #399     | |
|                 |  | ID   Subject        Status  Assignee  | | • Sarah updated Wiki   | |
|                 |  | ------------------------------------- | +------------------------+ |
|                 |  | #401 Fix API Auth   In Prog [Avatar]  |                            |
|                 |  | #402 Update UI      Review  [Avatar]  | +------------------------+ |
|                 |  | #403 DB Migration   Open    Unassigned| | Upcoming Deadlines     | |
|                 |  | [ View all 142 open issues -> ]       | | • Sprint 14 ends Fri   | |
|                 |  +---------------------------------------+ +------------------------+ |
|                 |                                                                       |
+-----------------------------------------------------------------------------------------+
```

## 2. Visual Hierarchy

1. **Top-Level Navigation & Context**: The Project Switcher and Global Search act as the primary anchors. They are omnipresent but visually subdued using low-contrast borders.
2. **Key Metrics (KPIs)**: Immediately visible below the breadcrumbs. These use large, bold typography for numbers and status-colored badges (e.g., green for on-track sprints).
3. **AI Insights & Action Queue**: The middle layer demands interaction. The AI panel uses a subtle gradient mesh background to stand out natively, while the Action Queue uses checkboxes to draw the user into their daily workflow.
4. **Detailed Data Views**: Tables and charts form the base. They use borderless row designs, relying on subtle zebra striping or hover states for differentiation, keeping the cognitive load low despite high data density of Redmine tickets.

## 3. UX Explanation

* **Global Header**: Keeps contextual actions (Search, Notifications, Profile) accessible globally.
* **Project Switcher**: Crucial for organizations managing multiple Redmine projects or sub-projects.
* **Global Search (Cmd+K)**: The primary navigation paradigm for power users. It allows instant jumps to issue IDs (e.g., `#405`), wiki pages, or specific settings without clicking through menus.
* **Notification Center**: Aggregates mentions, ticket updates, and SLA alerts.
* **KPI Cards**: Provides immediate pulse-check on project velocity.
* **AI Insights**: Predicts needs (e.g., sprint bottlenecks, duplicate issues) before the project manager has to dig for them. This shifts the app from reactive to proactive.
* **Workflow Queue (Action Center)**: A consolidated inbox for tasks requiring attention, eliminating the need to visit different queries to find PRs to review or tickets to approve.

## 4. Component Tree

```text
<DashboardLayout>
  <GlobalHeader>
    <ProjectSwitcher />
    <CommandMenu trigger="Cmd+K" />
    <HeaderActions>
      <NotificationBell />
      <UserNav />
    </HeaderActions>
  </GlobalHeader>
  <Sidebar />
  <MainContent>
    <BreadcrumbNav />
    <PageHeader title="My Dashboard" actions={<QuickActions />} />
    <Grid layout="3-cols">
      <KPICard title="Open Issues" value="142" trend="+5" />
      <KPICard title="Active Sprints" value="3" status="On Track" />
      <KPICard title="Time Logged" value="340h" trend="This Week" />
    </Grid>
    <Grid layout="sidebar-right">
      <MainColumn>
        <AIInsightsPanel />
        <IssuesDataTable />
        <ChartsPanel type="BurnDown" />
      </MainColumn>
      <RightSidebar>
        <ActionQueue />
        <RecentActivity />
        <UpcomingDeadlines />
      </RightSidebar>
    </Grid>
  </MainContent>
</DashboardLayout>
```

## 5. Recommended Tailwind Structure

> [!TIP]
> Use `hsl` variables for all colors to allow for easy theming, opacity modifiers, and seamless dark mode transitions. This is especially useful for color-coding Redmine issue trackers (Bug, Feature, Task).

```javascript
// tailwind.config.js
module.exports = {
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
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        tracker: {
          bug: "hsl(var(--tracker-bug))",       // e.g. Red
          feature: "hsl(var(--tracker-feature))", // e.g. Blue
          task: "hsl(var(--tracker-task))"      // e.g. Gray
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        'subtle-up': '0 -4px 24px -8px rgba(0, 0, 0, 0.05)',
        'float': '0 8px 32px -8px rgba(0, 0, 0, 0.08)',
        'premium': '0px 2px 4px rgba(0,0,0,0.02), 0px 4px 12px rgba(0,0,0,0.04)',
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "sans-serif"],
        mono: ["var(--font-geist-mono)", "JetBrains Mono", "monospace"],
      },
    },
  },
}
```

## 6. Recommended shadcn/ui Components

* **`Command`**: Crucial for the Cmd+K global search experience.
* **`DataTable` (TanStack Table)**: Essential for the Issues overview. Implement with faceted filters, column toggling, and sticky headers.
* **`Card`**: Used minimally. Instead of heavily bordered cards, use `bg-card` with a 1px `border-border/40` and a very subtle shadow.
* **`Tabs`**: For switching contexts within widgets (e.g., "My Issues", "Watched Issues").
* **`DropdownMenu`**: For the Project Switcher and User Profile.
* **`Badge`**: For status indicators (Open, In Progress, Resolved). Use subtle variants (background 10% opacity of foreground color).
* **`Skeleton`**: For loading states. Avoid spinners; use staggered skeleton reveals.
* **`HoverCard`**: For quick previews when hovering over issue IDs (`#405`) or user avatars in comments.

## 7. Motion Recommendations

* **Page Loads**: Staggered fade-up (`translate-y-2 opacity-0` to `translate-y-0 opacity-100`) over `300ms` with a `cubic-bezier(0.16, 1, 0.3, 1)`.
* **Sidebar Toggle**: Smooth width transition (`duration-300 ease-in-out`). Content inside should cross-fade, not instantly snap.
* **Hover States**: Extremely fast response (`duration-150`). Use subtle background color shifts (`bg-muted/50` to `bg-muted`) rather than scaling elements up.
* **Modals/Dialogs**: Scale-up from `0.95` to `1` combined with a backdrop blur fade-in.
* **Tabs Indicator**: Animate the `layoutId` of the active tab underline using Framer Motion for a "liquid" sliding effect.

## 8. Color Palette (Zinc / Monochrome Base with Vivid Accents)

**Light Mode**:
* `Background`: `#FCFCFC`
* `Card`: `#FFFFFF`
* `Border`: `#E4E4E7` (Zinc-200)
* `Foreground`: `#09090B` (Zinc-950)
* `Muted`: `#F4F4F5` (Zinc-100)
* `Muted Foreground`: `#71717A` (Zinc-500)
* `Primary`: `#18181B` (Zinc-900)
* `Accent (Brand)`: `#3B82F6` (Blue-500)
* `Bug`: `#EF4444` (Red-500)
* `Feature`: `#8B5CF6` (Violet-500)

**Dark Mode** (OLED-optimized, deep, elegant):
* `Background`: `#000000` or `#09090B` (Linear style)
* `Card`: `#09090B` or `#121214`
* `Border`: `#27272A` (Zinc-800)
* `Foreground`: `#FAFAFA` (Zinc-50)
* `Primary`: `#FAFAFA`
* `Muted`: `#18181B` (Zinc-900)

## 9. Typography Scale

Use **Geist** (Vercel's font) or **Inter**. Tight letter spacing on headings, normal on body.

* `text-xs` (12px): Utility, timestamps, badges. (Medium weight)
* `text-sm` (14px): Base body copy, table data, sidebar links. (Regular)
* `text-base` (16px): Standard text, inputs, dropdowns. (Regular)
* `text-lg` (18px): Card titles, modal headers. (Semibold, `-tracking-tight`)
* `text-2xl` (24px): Page headers, Dashboard title. (Semibold, `-tracking-tighter`)
* `text-4xl` (36px): KPI numbers. (Bold, `-tracking-tighter`, tabular-nums)

## 10. Detailed Layout Specification

* **Border Radius**: Subdued. `var(--radius)` = `0.5rem` (8px). Forms and buttons use `0.375rem` (6px).
* **Spacing Scale**: Base 4px scale.
    * Page padding: `p-6` or `p-8` for desktop.
    * Card padding: `p-5`.
    * Gap between sections: `gap-6` or `gap-8`.
* **Elevation**: Use borders instead of shadows in Light mode. In Dark mode, use a very subtle white radial gradient behind cards to simulate lighting (glassmorphism), rather than drop shadows which are invisible on black backgrounds.

## 11. Suggested Responsive Behavior

* **Mobile ( < 768px )**: Sidebar hidden behind a Hamburger menu (Sheet). KPI cards stack 1 column. Data tables convert to card-lists (avoid horizontal scrolling if possible).
* **Tablet ( 768px - 1024px )**: Sidebar auto-collapses to icon-only mode. Grid layouts shift from 3 columns to 2 columns.
* **Desktop ( > 1024px )**: Sidebar expanded by default. Right-side action queue panel becomes visible.
* **Ultrawide ( > 1600px )**: Max-width constraints on the main container (`max-w-[1600px]`) to prevent text lines from becoming too long. Container centers on screen.

## 12. Premium Micro-Interactions ("Wow" Factor)

1. **Spotlight Effect**: On the AI Insights panel or Priority Issue cards, track the mouse cursor and render a subtle radial gradient (glow) that follows the pointer over the card border, similar to Linear's website.
2. **Command Palette Magic**: When hitting `Cmd+K`, the background slightly dims and blurs (`backdrop-blur-sm`). Typing feels instant, and results transition in with a stagger.
3. **Number Ticking**: When KPIs load or update, the numbers shouldn't just change; they should roll or tick up to the new value (e.g., using Framer Motion's `useSpring`).
4. **Interactive Avatars & Issue Previews**: Hovering over an issue `#ID` anywhere in the app reveals a beautifully delayed `HoverCard` containing the issue title, status, and assignee without clicking.
5. **Magnetic Buttons**: For primary calls to action (like "New Issue"), the button slightly pulls towards the cursor when hovered near, adding a tactile, app-like feel.
6. **Dynamic Island Notifications**: Instead of standard toast messages, success/error states drop down from the top center like an iOS dynamic island, expanding to show details and shrinking away smoothly.
