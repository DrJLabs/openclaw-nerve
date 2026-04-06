import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MarkdownDocumentView } from './MarkdownDocumentView';
import type { OpenFile } from './types';

vi.mock('@/features/markdown/MarkdownRenderer', () => ({
  MarkdownRenderer: ({ content, className }: { content: string; className?: string }) => (
    <div data-testid="markdown-renderer" className={className}>{content}</div>
  ),
}));

vi.mock('./FileEditor', () => ({
  FileEditor: () => <div data-testid="file-editor" />,
}));

const file: OpenFile = {
  path: 'docs/guide.md',
  name: 'guide.md',
  content: '# Guide',
  savedContent: '# Guide',
  dirty: false,
  locked: false,
  mtime: 0,
  loading: false,
};

describe('MarkdownDocumentView', () => {
  it('renders preview mode without a nested card or horizontal padding shell', () => {
    render(
      <MarkdownDocumentView
        file={file}
        onContentChange={vi.fn()}
        onSave={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    const renderer = screen.getByTestId('markdown-renderer');
    expect(renderer.closest('article')).toBeNull();
    expect(renderer.parentElement).not.toHaveClass('px-5');
    expect(renderer.parentElement).not.toHaveClass('md:px-6');
  });
});
