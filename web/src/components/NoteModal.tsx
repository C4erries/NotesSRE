import { useEffect, useState } from 'react'
import { Eye, PenLine, Pin, X } from 'lucide-react'
import type { Category, CreateNoteRequest, Note, UpdateNoteRequest } from '../types'
import { MarkdownPreview } from './MarkdownPreview'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (data: CreateNoteRequest | UpdateNoteRequest) => Promise<void>
  initialNote?: Note | null
  categories: Category[]
  defaultCategoryId?: string | null
}

export function NoteModal({
  isOpen,
  onClose,
  onSave,
  initialNote,
  categories,
  defaultCategoryId,
}: Props) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [isPinned, setIsPinned] = useState(false)
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialNote) {
      setTitle(initialNote.title)
      setContent(initialNote.content)
      setCategoryId(initialNote.category_id)
      setIsPinned(initialNote.is_pinned)
    } else {
      setTitle('')
      setContent('')
      setCategoryId(defaultCategoryId || null)
      setIsPinned(false)
    }
    setActiveTab('write')
    setError(null)
  }, [initialNote, defaultCategoryId, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Title cannot be empty')
      return
    }

    try {
      setSaving(true)
      setError(null)
      await onSave({
        title: title.trim(),
        content,
        category_id: categoryId || null,
        is_pinned: isPinned,
      })
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save note')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200"
      style={{ backgroundColor: 'var(--modal-overlay)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-2xl glass-panel rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--text-main)] tracking-tight m-0">
            {initialNote ? 'Edit Note' : 'Create New Note'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-sub)] mb-1.5">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Weekly SRE Sync"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl glass-input text-sm"
              autoFocus
            />
          </div>

          {/* Category & Pin Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-sub)] mb-1.5">Category</label>
              <select
                value={categoryId || ''}
                onChange={(e) => setCategoryId(e.target.value || null)}
                className="w-full px-3.5 py-2 rounded-xl glass-input text-sm bg-slate-100 dark:bg-slate-900"
              >
                <option value="">No category (Uncategorized)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-[var(--text-main)]">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded bg-black/10 dark:bg-white/10 border-black/20 dark:border-white/20 text-amber-500 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <div className="flex items-center gap-1.5 font-medium">
                  <Pin className={`w-3.5 h-3.5 ${isPinned ? 'text-amber-500 fill-amber-500' : 'text-[var(--text-muted)]'}`} />
                  <span>Pin to top of list</span>
                </div>
              </label>
            </div>
          </div>

          {/* Content with Markdown Tabs */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[var(--text-sub)]">Content (Markdown)</label>
              <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-0.5 rounded-lg border border-black/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveTab('write')}
                  className={`px-2.5 py-1 text-xs rounded-md flex items-center gap-1 transition cursor-pointer ${
                    activeTab === 'write' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 font-semibold' : 'text-[var(--text-sub)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <PenLine className="w-3 h-3" />
                  <span>Write</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`px-2.5 py-1 text-xs rounded-md flex items-center gap-1 transition cursor-pointer ${
                    activeTab === 'preview' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 font-semibold' : 'text-[var(--text-sub)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span>Preview</span>
                </button>
              </div>
            </div>

            {activeTab === 'write' ? (
              <textarea
                placeholder="Type your markdown note here... (# Heading, - List item, **bold**)"
                rows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm font-mono leading-relaxed resize-y"
              />
            ) : (
              <div className="w-full min-h-[12rem] max-h-72 overflow-y-auto px-4 py-3 rounded-xl bg-black/5 dark:bg-white/[0.02] border border-black/10 dark:border-white/10">
                {content.trim() ? (
                  <MarkdownPreview content={content} />
                ) : (
                  <span className="text-xs text-[var(--text-muted)] italic">No content to preview</span>
                )}
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/10 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="glass-button-secondary px-4 py-2 rounded-xl text-sm font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="glass-button-primary px-5 py-2 rounded-xl text-sm font-medium disabled:opacity-50 cursor-pointer shadow-lg"
            >
              {saving ? 'Saving...' : initialNote ? 'Save Changes' : 'Create Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
