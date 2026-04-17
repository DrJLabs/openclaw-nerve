import { describe, expect, it, vi } from 'vitest';
import { buildFileTreeMenuActions } from './fileTreeMenuActions';
import type { TreeEntry } from './types';

const fileEntry: TreeEntry = {
  name: 'package.json',
  path: 'package.json',
  type: 'file',
  children: null,
};

const trashedFileEntry: TreeEntry = {
  name: 'package.json',
  path: '.trash/package.json',
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

  it('keeps restore and rename actions for files already in trash', () => {
    const actions = buildFileTreeMenuActions(trashedFileEntry, {
      addToChatEnabled: true,
      canAddToChat: true,
      isCustomWorkspace: false,
      onRestore: vi.fn(),
      onAddToChat: vi.fn(),
      onRename: vi.fn(),
      onTrash: vi.fn(),
    });

    expect(actions.map((action) => action.id)).toEqual(['restore', 'rename', 'trash']);
    expect(actions.map((action) => action.label)).toEqual(['Restore', 'Rename', 'Move to Trash']);
  });
});
