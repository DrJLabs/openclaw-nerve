import { useMemo, useState } from 'react';
import { Eye, PencilLine } from 'lucide-react';
import { MarkdownRenderer } from '@/features/markdown/MarkdownRenderer';
import type { OpenFile } from './types';
import { FileEditor } from './FileEditor';

interface MarkdownDocumentViewProps {
  file: OpenFile;
  onContentChange: (path: string, content: string) => void;
  onSave: (path: string) => void;
  onRetry: (path: string) => void;
  onOpenWorkspacePath?: (path: string, basePath?: string) => void | Promise<void>;
}

export function MarkdownDocumentView({
  file,
  onContentChange,
  onSave,
  onRetry,
  onOpenWorkspacePath,
}: MarkdownDocumentViewProps) {
  const [mode, setMode] = useState<'preview' | 'edit'>('preview');

  const previewContent = useMemo(() => (
    file.loading || file.error ? '' : file.content
  ), [file.content, file.error, file.loading]);

  return (
    <div className="h-full flex flex-col min-h-0 bg-background/20">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-3 py-2 shrink-0 bg-card/55">
        <div className="min-w-0">
          <div className="text-[0.733rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Markdown document
          </div>
          <div className="truncate text-[0.8rem] text-foreground/90">{file.path}</div>
        </div>
        <div
          className="inline-flex items-center rounded-xl border border-border/70 bg-background/55 p-1"
          role="tablist"
          aria-label="Document mode"
        >
          <button
            type="button"
            role="tab"
            id="markdown-document-tab-preview"
            aria-selected={mode === 'preview'}
            aria-controls="markdown-document-panel-preview"
            tabIndex={mode === 'preview' ? 0 : -1}
            className={`inline-flex min-h-8 items-center gap-2 rounded-[10px] px-3 text-[0.733rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
              mode === 'preview'
                ? 'bg-card text-foreground shadow-[0_10px_30px_rgba(0,0,0,0.12)]'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            data-active={mode === 'preview'}
            onClick={() => setMode('preview')}
          >
            <Eye size={14} />
            Preview
          </button>
          <button
            type="button"
            role="tab"
            id="markdown-document-tab-edit"
            aria-selected={mode === 'edit'}
            aria-controls="markdown-document-panel-edit"
            tabIndex={mode === 'edit' ? 0 : -1}
            className={`inline-flex min-h-8 items-center gap-2 rounded-[10px] px-3 text-[0.733rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
              mode === 'edit'
                ? 'bg-card text-foreground shadow-[0_10px_30px_rgba(0,0,0,0.12)]'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            data-active={mode === 'edit'}
            onClick={() => setMode('edit')}
          >
            <PencilLine size={14} />
            Edit
          </button>
        </div>
      </div>

      {mode === 'preview' ? (
        <div
          className="flex-1 min-h-0 overflow-y-auto px-4 py-4 md:px-6"
          role="tabpanel"
          id="markdown-document-panel-preview"
          aria-labelledby="markdown-document-tab-preview"
        >
          <MarkdownRenderer
            content={previewContent}
            className="markdown-document-content"
            currentDocumentPath={file.path}
            onOpenWorkspacePath={(targetPath, basePath) => onOpenWorkspacePath?.(targetPath, basePath ?? file.path)}
          />
        </div>
      ) : (
        <div
          className="flex-1 min-h-0"
          role="tabpanel"
          id="markdown-document-panel-edit"
          aria-labelledby="markdown-document-tab-edit"
        >
          <FileEditor
            file={file}
            onContentChange={onContentChange}
            onSave={onSave}
            onRetry={onRetry}
          />
        </div>
      )}
    </div>
  );
}
