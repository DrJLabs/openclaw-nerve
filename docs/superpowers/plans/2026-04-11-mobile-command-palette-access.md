# Mobile Command Palette Access Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add mobile-friendly access to Nerve's existing command palette through a visible top-bar trigger plus a narrow-screen floating action button, while preserving the existing Cmd/Ctrl+K shortcut.

**Architecture:** Keep palette state ownership in `App.tsx`, which already controls `paletteOpen` and `handleOpenPalette`. Add a new `onOpenCommandPalette` prop to `TopBar` for a visible header trigger, and render a mobile-only floating trigger in `App.tsx` that calls the same handler. This keeps behavior centralized and minimizes UI risk.

**Tech Stack:** React, TypeScript, existing Lucide icons, current responsive Tailwind/CSS utility patterns.

---

### Task 1: Wire a top-bar command palette trigger

**Files:**
- Modify: `src/components/TopBar.tsx`
- Modify: `src/App.tsx`
- Test: existing app smoke/build verification

- [ ] **Step 1: Add a new TopBar prop for opening the command palette**

Update the `TopBarProps` interface and component props destructuring to accept:

```ts
onOpenCommandPalette: () => void;
```

- [ ] **Step 2: Add a visible top-bar trigger with icon + Commands label**

Add a new button in the existing top-bar controls using the established `buttonBase` styling so it matches the cockpit chrome. The button should:
- call `onOpenCommandPalette`
- use an appropriate icon from `lucide-react` (prefer `Command`)
- render visible text `Commands`
- include `title="Open command palette"`
- include `aria-label="Open command palette"`

- [ ] **Step 3: Pass the existing palette open handler from App into TopBar**

In `src/App.tsx`, pass:

```tsx
<TopBar
  ...
  onOpenCommandPalette={handleOpenPalette}
/>
```

- [ ] **Step 4: Run build/type verification**

Run:

```bash
npm run build
```

Expected: successful production build with no TypeScript errors.

### Task 2: Add a mobile-only floating action button

**Files:**
- Modify: `src/App.tsx`
- Test: existing app smoke/build verification

- [ ] **Step 1: Render a narrow-screen-only FAB near the app shell root**

In `src/App.tsx`, add a floating button that:
- is only visible on small screens
- calls `handleOpenPalette`
- uses the same icon + `Commands` label
- stays above content but below modal overlays
- avoids interfering with desktop layout

Recommended characteristics:
- fixed positioning near bottom-right
- hidden at larger breakpoints
- strong contrast consistent with existing cockpit styling
- `aria-label="Open command palette"`

- [ ] **Step 2: Ensure the FAB does not appear while the palette is already open**

Gate the FAB render on `!paletteOpen` so it does not duplicate the active overlay affordance.

- [ ] **Step 3: Re-run build verification**

Run:

```bash
npm run build
```

Expected: successful production build with no regressions.

### Task 3: Rebuild, redeploy, and verify on `local`

**Files:**
- Modify: deployed build artifacts or service state as produced by repo scripts
- Test: local service health + UI availability

- [ ] **Step 1: Identify the local rebuild/deploy command path used by this repo**

Inspect package scripts and any deployment docs or service scripts to determine the correct rebuild/restart flow.

- [ ] **Step 2: Run the rebuild/redeploy flow on `local`**

Execute the repo-appropriate production rebuild and service restart flow.

- [ ] **Step 3: Verify health and access**

Run the concrete health checks exposed by the repo/service (for example `/health` and any local listener checks), and confirm the service is back up after deployment.

### Task 4: Create a clean feature branch from `master` and replay the change

**Files:**
- Modify: same source files as Tasks 1-2 on a fresh branch from `master`
- Test: same build verification

- [ ] **Step 1: Confirm `master` is clean and create a fresh feature branch from it**

Use a descriptive branch name such as:

```bash
git checkout master
git checkout -b feat/mobile-command-palette-access
```

- [ ] **Step 2: Reapply the exact source changes from `local` onto the new branch**

Copy or cherry-pick only the intended command-palette access changes.

- [ ] **Step 3: Run build verification again on the feature branch**

Run:

```bash
npm run build
```

Expected: successful production build.

- [ ] **Step 4: Summarize the diff between `local` and the feature branch result**

Confirm the feature branch contains only the intended mobile command palette access changes.
