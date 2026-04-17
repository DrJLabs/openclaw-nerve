# File Tree Touch Context Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the file tree's touch-only inline add-to-chat affordance with a long-press gesture that opens the same row action menu used by desktop right click, so future menu additions automatically appear on touch devices.

**Architecture:** Keep `FileTreePanel` as the owner of menu state, positioning, toast/error flows, and destructive actions. Extract row action eligibility and metadata into a shared action builder inside the file-browser feature, then have both desktop right-click and touch long-press feed that same menu state and renderer. `FileTreeNode` should detect touch long-press and notify the parent without owning menu contents.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, existing Lucide icons, existing file-browser state/actions.

---

### Task 1: Extract a shared file-tree action builder

**Files:**
- Create: `src/features/file-browser/fileTreeMenuActions.ts`
- Create: `src/features/file-browser/fileTreeMenuActions.test.ts`
- Modify: `src/features/file-browser/FileTreePanel.tsx`
- Test: `src/features/file-browser/FileTreePanel.test.tsx`

- [ ] **Step 1: Write a failing unit test for the shared action builder**

Add `src/features/file-browser/fileTreeMenuActions.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { buildFileTreeMenuActions } from './fileTreeMenuActions';
import type { TreeEntry } from './types';

const fileEntry: TreeEntry = {
  name: 'package.json',
  path: 'package.json',
  type: 'file',
  children: null,
};

describe('buildFileTreeMenuActions', () => {
  it('returns add-to-chat, rename, and trash actions for a normal file', () => {
    const actions = buildFileTreeMenuActions(fileEntry, {
      addToChatEnabled: true,
      canAddToChat: true,
      isCustomWorkspace: false,
      onRestore: vi.fn(),
      onAddToChat: vi.fn(),
      onRename: vi.fn(),
      onTrash: vi.fn(),
    });

    expect(actions.map((action) => action.id)).toEqual(['add-to-chat', 'rename', 'trash']);
    expect(actions.map((action) => action.label)).toEqual(['Add to chat', 'Rename', 'Move to Trash']);
  });
});
```

- [ ] **Step 2: Run the new unit test to verify it fails because the module does not exist yet**

Run:

```bash
npm test -- --run src/features/file-browser/fileTreeMenuActions.test.ts
```

Expected: FAIL with a module resolution error for `./fileTreeMenuActions`.

- [ ] **Step 3: Create a shared menu action module with stable action metadata types**

Add `src/features/file-browser/fileTreeMenuActions.ts` with the shared action model and builder:

```ts
import type { LucideIcon } from 'lucide-react';
import { Paperclip, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import type { TreeEntry } from './types';

export interface FileTreeMenuAction {
  id: 'restore' | 'add-to-chat' | 'rename' | 'trash';
  label: string;
  icon: LucideIcon;
  destructive?: boolean;
  onSelect: () => void;
}

export interface FileTreeMenuActionOptions {
  addToChatEnabled: boolean;
  canAddToChat: boolean;
  isCustomWorkspace: boolean;
  onRestore: () => void;
  onAddToChat: () => void;
  onRename: () => void;
  onTrash: () => void;
}

function isTrashItemPath(filePath: string): boolean {
  return filePath.startsWith('.trash/') && filePath !== '.trash';
}

export function buildFileTreeMenuActions(
  entry: TreeEntry,
  options: FileTreeMenuActionOptions,
): FileTreeMenuAction[] {
  const path = entry.path;
  const inTrash = isTrashItemPath(path);
  const actions: FileTreeMenuAction[] = [];

  if (inTrash) {
    actions.push({
      id: 'restore',
      label: 'Restore',
      icon: RotateCcw,
      onSelect: options.onRestore,
    });
    return actions;
  }

  if (path !== '.trash' && options.canAddToChat && (entry.type === 'directory' || options.addToChatEnabled)) {
    actions.push({
      id: 'add-to-chat',
      label: 'Add to chat',
      icon: Paperclip,
      onSelect: options.onAddToChat,
    });
  }

  if (path !== '.trash') {
    actions.push({
      id: 'rename',
      label: 'Rename',
      icon: Pencil,
      onSelect: options.onRename,
    });
  }

  if (path !== '.trash') {
    actions.push({
      id: 'trash',
      label: options.isCustomWorkspace ? 'Permanently Delete' : 'Move to Trash',
      icon: Trash2,
      destructive: true,
      onSelect: options.onTrash,
    });
  }

  return actions;
}
```

- [ ] **Step 4: Add a regression test proving `FileTreePanel` consumes the shared builder output**

Add a new test block in `src/features/file-browser/FileTreePanel.test.tsx` that right-clicks a file row and asserts the desktop menu still shows the expected labels after the action builder is introduced:

```tsx
it('renders menu actions from the shared action builder for files', async () => {
  render(
    <FileTreePanel
      workspaceAgentId="agent-a"
      onOpenFile={mockOnOpenFile}
      onAddToChat={mockOnAddToChat}
      addToChatEnabled={true}
      onRemapOpenPaths={mockOnRemapOpenPaths}
      onCloseOpenPaths={mockOnCloseOpenPaths}
      collapsed={false}
      onCollapseChange={vi.fn()}
    />
  );

  fireEvent.contextMenu(screen.getByText('package.json'), new MouseEvent('contextmenu', { bubbles: true }));

  expect(await screen.findByText('Add to chat')).toBeInTheDocument();
  expect(screen.getByText('Rename')).toBeInTheDocument();
  expect(screen.getByText('Move to Trash')).toBeInTheDocument();
});
```

- [ ] **Step 5: Refactor `FileTreePanel.tsx` to consume the shared action builder**

In `src/features/file-browser/FileTreePanel.tsx`:

1. Import the builder:

```ts
import { buildFileTreeMenuActions } from './fileTreeMenuActions';
```

2. Remove direct `showRestore`, `showAddToChat`, `showRename`, and `showTrashAction` JSX gating and replace it with one computed action array:

```ts
const menuEntry = visibleContextMenu?.entry ?? null;
const menuActions = menuEntry
  ? buildFileTreeMenuActions(menuEntry, {
      addToChatEnabled,
      canAddToChat: Boolean(onAddToChat) && menuEntry.path !== '.trash' && !menuEntry.path.startsWith('.trash/'),
      isCustomWorkspace: Boolean(workspaceInfo?.isCustomWorkspace),
      onRestore: () => { void restoreEntry(menuEntry.path); },
      onAddToChat: () => {
        const itemKind = menuEntry.type === 'directory' ? 'directory' : 'file';
        void Promise
          .resolve(onAddToChat?.(menuEntry.path, itemKind, workspaceAgentId))
          .catch((error: unknown) => {
            const fallbackMessage = itemKind === 'directory'
              ? 'Failed to add directory to chat'
              : 'Failed to add file to chat';
            const message = error instanceof Error ? error.message : fallbackMessage;
            console.error('[FileTreePanel] add-to-chat failed:', error);
            showToastForAgent(workspaceAgentId, { type: 'error', message }, 4500);
          });
      },
      onRename: () => startRename(menuEntry),
      onTrash: () => { void moveToTrash(menuEntry); },
    })
  : [];
```

3. Render the menu from `menuActions`:

```tsx
{menuActions.length > 0 ? (
  menuActions.map((action) => {
    const Icon = action.icon;
    return (
      <button
        key={action.id}
        className={`w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 ${
          action.destructive
            ? 'text-destructive hover:bg-destructive/10'
            : 'text-foreground hover:bg-muted/60'
        }`}
        onClick={() => {
          setContextMenu(null);
          action.onSelect();
        }}
      >
        <Icon size={12} />
        {action.label}
      </button>
    );
  })
) : (
  <div className="px-3 py-1.5 text-xs text-muted-foreground">
    No actions
  </div>
)}
```

- [ ] **Step 6: Run the focused test suite to verify the shared action refactor passes**

Run:

```bash
npm test -- --run src/features/file-browser/fileTreeMenuActions.test.ts src/features/file-browser/FileTreePanel.test.tsx
```

Expected: PASS with the new builder test and the existing desktop context-menu coverage green.

- [ ] **Step 7: Commit the shared action refactor**

Run:

```bash
git add src/features/file-browser/fileTreeMenuActions.ts src/features/file-browser/fileTreeMenuActions.test.ts src/features/file-browser/FileTreePanel.tsx src/features/file-browser/FileTreePanel.test.tsx
git commit -m "refactor(file-browser): share file tree menu actions"
```

### Task 2: Add touch long-press opening for the shared menu

**Files:**
- Modify: `src/features/file-browser/FileTreeNode.tsx`
- Modify: `src/features/file-browser/FileTreePanel.tsx`
- Test: `src/features/file-browser/FileTreePanel.test.tsx`

- [ ] **Step 1: Add a failing touch long-press test for files**

In `src/features/file-browser/FileTreePanel.test.tsx`, add a touch interaction test using fake timers:

```tsx
it('opens the shared row menu on touch long press without triggering file open', async () => {
  vi.useFakeTimers();

  render(
    <FileTreePanel
      workspaceAgentId="agent-a"
      onOpenFile={mockOnOpenFile}
      onAddToChat={mockOnAddToChat}
      addToChatEnabled={true}
      onRemapOpenPaths={mockOnRemapOpenPaths}
      onCloseOpenPaths={mockOnCloseOpenPaths}
      collapsed={false}
      onCollapseChange={vi.fn()}
    />
  );

  const row = screen.getByTitle('package.json');
  fireEvent.pointerDown(row, { pointerType: 'touch', clientX: 24, clientY: 32 });
  vi.advanceTimersByTime(500);

  expect(await screen.findByText('Add to chat')).toBeInTheDocument();
  expect(mockOnOpenFile).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the test to verify it fails before implementation**

Run:

```bash
npm test -- --run src/features/file-browser/FileTreePanel.test.tsx
```

Expected: FAIL because touch long-press is not implemented yet.

- [ ] **Step 3: Add touch long-press props and internal timer handling to `FileTreeNode.tsx`**

Update `FileTreeNodeProps` to add a parent callback:

```ts
onTouchLongPress?: (entry: TreeEntry, anchorRect: DOMRect) => void;
```

Inside `FileTreeNode`, add refs for timer state and long-press suppression:

```ts
const longPressTimerRef = useRef<number | null>(null);
const touchStartRef = useRef<{ x: number; y: number } | null>(null);
const longPressTriggeredRef = useRef(false);
const LONG_PRESS_MS = 450;
const MOVE_TOLERANCE_PX = 10;
```

Implement pointer handlers on the row:

```ts
const clearLongPress = () => {
  if (longPressTimerRef.current !== null) {
    window.clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  }
  touchStartRef.current = null;
};

const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
  if (event.pointerType !== 'touch' || isRenaming) return;
  longPressTriggeredRef.current = false;
  touchStartRef.current = { x: event.clientX, y: event.clientY };
  const anchorRect = event.currentTarget.getBoundingClientRect();
  longPressTimerRef.current = window.setTimeout(() => {
    longPressTriggeredRef.current = true;
    onTouchLongPress?.(entry, anchorRect);
    clearLongPress();
  }, LONG_PRESS_MS);
};

const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
  if (event.pointerType !== 'touch' || !touchStartRef.current) return;
  const dx = Math.abs(event.clientX - touchStartRef.current.x);
  const dy = Math.abs(event.clientY - touchStartRef.current.y);
  if (dx > MOVE_TOLERANCE_PX || dy > MOVE_TOLERANCE_PX) {
    clearLongPress();
  }
};

const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
  if (event.pointerType === 'touch') clearLongPress();
};

const handlePointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
  if (event.pointerType === 'touch') clearLongPress();
};
```

Short-circuit normal click behavior after a completed long press:

```ts
const handleClick = () => {
  if (longPressTriggeredRef.current) {
    longPressTriggeredRef.current = false;
    return;
  }
  if (isRenaming) return;
  onSelect(entry.path);
  if (isDir) onToggleDir(entry.path);
};
```

Wire the handlers on the row element and suppress the native touch menu:

```tsx
onPointerDown={handlePointerDown}
onPointerMove={handlePointerMove}
onPointerUp={handlePointerUp}
onPointerCancel={handlePointerCancel}
onContextMenu={(e) => {
  if (longPressTriggeredRef.current) {
    e.preventDefault();
    longPressTriggeredRef.current = false;
    return;
  }
  onContextMenu(entry, e);
}}
style={{ paddingLeft: depth * 16 + 8, WebkitTouchCallout: 'none' as const }}
```

- [ ] **Step 4: Add a row-anchor opener in `FileTreePanel.tsx` and pass it to every node**

Add a touch-specific opener beside `handleContextMenu`:

```ts
const openTouchContextMenu = useCallback((entry: TreeEntry, anchorRect: DOMRect) => {
  selectFile(entry.path);
  contextMenuSessionIdRef.current += 1;
  setContextMenu({
    agentId: workspaceAgentId,
    sessionId: contextMenuSessionIdRef.current,
    x: anchorRect.left + MENU_CURSOR_OFFSET,
    y: anchorRect.top + MENU_ROW_TOP_OFFSET,
    entry,
  });
}, [selectFile, workspaceAgentId]);
```

Pass it into every `FileTreeNode`:

```tsx
onTouchLongPress={openTouchContextMenu}
```

- [ ] **Step 5: Remove the compact-only paperclip affordance**

Delete the `Paperclip` import and the `showCompactAddToChat` button path from `src/features/file-browser/FileTreeNode.tsx`. The menu should now be the only row-action surface for both desktop and touch.

- [ ] **Step 6: Expand test coverage for cancelation and non-touch behavior**

Add two more tests in `src/features/file-browser/FileTreePanel.test.tsx`:

1. Movement cancels long press:

```tsx
it('cancels touch long press when the pointer moves beyond tolerance', () => {
  vi.useFakeTimers();
  render(/* same panel setup */);

  const row = screen.getByTitle('package.json');
  fireEvent.pointerDown(row, { pointerType: 'touch', clientX: 10, clientY: 10 });
  fireEvent.pointerMove(row, { pointerType: 'touch', clientX: 40, clientY: 40 });
  vi.advanceTimersByTime(500);

  expect(screen.queryByText('Add to chat')).not.toBeInTheDocument();
});
```

2. Mouse pointer does not use long-press:

```tsx
it('does not open the menu from a mouse pointer long hold', () => {
  vi.useFakeTimers();
  render(/* same panel setup */);

  const row = screen.getByTitle('package.json');
  fireEvent.pointerDown(row, { pointerType: 'mouse', clientX: 24, clientY: 32 });
  vi.advanceTimersByTime(500);

  expect(screen.queryByText('Add to chat')).not.toBeInTheDocument();
});
```

- [ ] **Step 7: Run the focused tests to verify the long-press implementation passes**

Run:

```bash
npm test -- --run src/features/file-browser/FileTreePanel.test.tsx
```

Expected: PASS with new touch long-press coverage green.

- [ ] **Step 8: Commit the touch long-press implementation**

Run:

```bash
git add src/features/file-browser/FileTreeNode.tsx src/features/file-browser/FileTreePanel.tsx src/features/file-browser/FileTreePanel.test.tsx
git commit -m "feat(file-browser): open row menu on touch long press"
```

### Task 3: Final verification and branch readiness

**Files:**
- Verify: `src/features/file-browser/FileTreeNode.tsx`
- Verify: `src/features/file-browser/FileTreePanel.tsx`
- Verify: `src/features/file-browser/fileTreeMenuActions.ts`
- Verify: `src/features/file-browser/FileTreePanel.test.tsx`

- [ ] **Step 1: Run the focused file-browser tests one more time**

Run:

```bash
npm test -- --run src/features/file-browser/FileTreePanel.test.tsx
```

Expected: PASS with all file-tree menu and touch interaction tests green.

- [ ] **Step 2: Run a production build to catch type and bundle regressions**

Run:

```bash
npm run build
```

Expected: successful `tsc -b`, `vite build`, and `build:server` completion with exit code `0`.

- [ ] **Step 3: Inspect the branch diff to confirm scope stayed limited**

Run:

```bash
git status --short
git diff --stat master...HEAD
```

Expected: only the spec, plan, shared action module, file-tree panel/node changes, and related tests are present.

- [ ] **Step 4: Commit any final verification-only adjustments if needed**

If build/test required a last small fix, commit it with:

```bash
git add <touched-files>
git commit -m "test(file-browser): finalize touch context menu coverage"
```
