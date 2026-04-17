# File Tree Touch Context Menu Design

**Goal:** Replace the current mobile-only inline add-to-chat affordance with a touch long-press interaction that opens the same file-tree action menu used by desktop right click, so future desktop menu additions automatically appear on touch devices as well.

**Non-goals:**
- Change normal tap behavior for files or directories.
- Change desktop right-click interaction semantics.
- Introduce a separate mobile-only action sheet or duplicate menu definition.

**Architecture:** Centralize file-tree row actions behind a shared action builder in the file-browser feature. `FileTreePanel` remains the state owner for menu visibility, positioning, destructive flows, and toast/error handling. `FileTreeNode` becomes responsible for input detection only: desktop mouse/keyboard behavior continues unchanged, while touch-capable devices gain long-press detection that asks `FileTreePanel` to open the shared anchored menu for the pressed entry.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, existing Lucide icons, existing Tailwind utility patterns.

---

## Current State

Today the desktop path and compact-layout mobile path are split:

- Desktop row actions are rendered inline inside `src/features/file-browser/FileTreePanel.tsx` as a context menu.
- Compact/mobile adds a separate paperclip button in `src/features/file-browser/FileTreeNode.tsx`.

This split means any future action added to the desktop menu must also be manually copied into the compact mobile affordance. That is the drift the new design removes.

## Design Overview

The file tree should have one action source and two openers:

- Desktop opener: existing right click / `contextmenu`.
- Touch opener: new long-press gesture on touch pointers.

Both openers must feed the same menu state and the same action list renderer. The visible menu remains an anchored popover near the pressed row, not a bottom sheet.

## Shared Action Model

Extract file-tree menu eligibility and rendering data into a shared builder, owned by the file-browser feature. The builder should accept:

- the selected `TreeEntry`
- workspace-scoped feature flags such as `addToChatEnabled`
- workspace mode such as custom-workspace vs default-workspace
- bound handlers for restore, add-to-chat, rename, and trash/delete

The builder should return ordered menu actions with enough data for rendering and execution:

- stable action id
- label
- icon component
- destructive styling flag
- click handler

This builder becomes the only place that decides:

- whether `Restore` appears for trash entries
- whether `Add to chat` appears for files and directories
- whether `Rename` is allowed
- whether trash action is labeled `Move to Trash` or `Permanently Delete`
- whether `No actions` should render

Future row actions must be added in this shared builder so both desktop and touch inherit them automatically.

## Ownership Boundaries

### `FileTreePanel`

`FileTreePanel` remains the owner of:

- active context-menu entry and anchor position
- restore / rename / trash / permanent-delete flows
- toast and error handling
- menu rendering
- workspace-agent scoping

It should expose two open paths into the same menu state:

- desktop `handleContextMenu(entry, event)`
- touch `openTouchContextMenu(entry, anchorRect)`

The desktop path can keep cursor-relative positioning. The touch path should anchor from the row bounds so the menu opens near the pressed row even when touch coordinates are noisy.

### `FileTreeNode`

`FileTreeNode` should stop rendering the compact-only paperclip button. Instead, it should:

- keep current click, double-click, keyboard, drag, and desktop context-menu behavior
- detect touch long-press gestures
- notify the parent when a long press completes

`FileTreeNode` should not know which actions exist in the menu.

## Touch Long-Press Behavior

Touch long-press should be enabled for any touch-capable device, not only compact layout.

### Long-press contract

- Start a timer on `pointerdown` when `pointerType === 'touch'`.
- Cancel the timer if the pointer is released before the threshold.
- Cancel the timer if movement exceeds a small tolerance so scroll gestures do not open the menu.
- Cancel the timer if the interaction is otherwise aborted or the row unmounts.
- When the timer completes, open the shared menu anchored to the pressed row.
- After a completed long press, suppress the follow-up tap/click behavior so the row does not also toggle or open a file.

### Native browser suppression

Suppress the browser’s native touch callout/context behavior on file-tree rows when the custom long-press path is active. This should be scoped to file-tree row interaction only, not applied globally.

### Positioning

Touch-opened menus should anchor to the pressed row’s bounding rect:

- horizontal position should stay inside the file-tree panel bounds
- vertical position should align near the row top edge, consistent with the current desktop menu visual language

Existing menu clamping logic should still enforce viewport and panel containment after render.

## Desktop Behavior

Desktop behavior remains functionally unchanged:

- right click opens the file-tree menu
- current actions remain available
- keyboard and double-click behavior stay intact

The only structural change is that desktop menu rendering now consumes the shared action list instead of hard-coded conditional JSX.

## Edge Cases

The design must handle the following cases correctly:

- Files vs directories use the same shared action source with different action visibility.
- Trash entries show restore only where appropriate.
- `.trash` root cannot be renamed and should not expose invalid actions.
- Custom workspaces continue to use permanent-delete semantics and labels.
- Add-to-chat failures still surface through the current toast/error path.
- Long press must not interfere with drag interactions initiated by mouse input.
- Short taps on touch devices must preserve existing row behavior.

## Testing Strategy

### Shared action coverage

Add tests for the shared action builder or equivalent extracted menu logic to prove:

- file vs directory action visibility
- trash vs non-trash action visibility
- add-to-chat gating
- custom-workspace delete labeling

### Touch interaction coverage

Add file-tree tests that prove:

- touch `pointerdown` starts long-press detection
- early release does not open the menu
- movement past the threshold cancels the menu
- completed long press opens the menu
- completed long press renders the same actions desktop gets
- completed long press suppresses normal tap/open behavior
- non-touch pointer input does not enter the long-press path

### Regression coverage

Keep and update desktop right-click tests so they still pass through the shared action source.

## Verification Plan

Before calling implementation complete, run fresh verification against the file-browser test surface first, then broader verification if the touched code expands:

```bash
npm test -- src/features/file-browser/FileTreePanel.test.tsx
```

If the extracted action builder lands in its own test file, run that directly as part of the same verification step.

## Implementation Notes

- Prefer extracting action-building logic before adding long-press behavior so there is only one menu definition during the transition.
- Remove the compact-layout paperclip affordance once touch long-press is in place and covered by tests.
- Keep touch detection local to file-tree rows so other cockpit surfaces are unaffected.
- Use pointer events rather than separate mouse/touch event trees to avoid divergent logic.
