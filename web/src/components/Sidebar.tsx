import { useState } from 'react'
import { Folder, Plus, Trash2, X } from 'lucide-react'
import type { Category } from '../types'

interface Props {
  categories: Category[]
  selectedCategoryId: string | null
  onSelectCategory: (id: string | null) => void
  onCreateCategory: (title: string, color: string) => Promise<void>
  onDeleteCategory: (id: string) => Promise<void>
  totalNotesCount: number
  notesByCategory: Record<string, number>
}

const PRESET_COLORS = [
  '#F59E0B', // Amber / Warm Yellow
  '#EAB308', // Sun Yellow
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#EF4444', // Red
  '#10B981', // Emerald
  '#06B6D4', // Cyan
]

export function Sidebar({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onCreateCategory,
  onDeleteCategory,
  totalNotesCount,
  notesByCategory,
}: Props) {
  const [isCreating, setIsCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    try {
      setSubmitting(true)
      await onCreateCategory(title.trim(), color)
      setTitle('')
      setIsCreating(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <aside className="w-full md:w-64 glass-panel rounded-2xl p-4 flex flex-col gap-4 self-start">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold tracking-wider text-[var(--text-sub)] uppercase">Categories</h2>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-sub)] hover:text-[var(--text-main)] transition cursor-pointer"
          title="Add category"
        >
          {isCreating ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>

      {/* New Category Inline Form */}
      {isCreating && (
        <form
          onSubmit={handleSubmit}
          className="p-3 rounded-xl bg-black/5 dark:bg-white/[0.04] border border-white/20 dark:border-white/10 flex flex-col gap-3 animate-in fade-in duration-200"
        >
          <input
            type="text"
            placeholder="Category title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs rounded-lg glass-input"
            autoFocus
          />

          <div className="flex items-center gap-1.5 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                className={`w-5 h-5 rounded-full border transition cursor-pointer ${
                  color === c ? 'scale-125 border-amber-500 shadow-md ring-2 ring-amber-400/40' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-2.5 py-1 text-xs text-[var(--text-sub)] hover:text-[var(--text-main)] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="glass-button-primary px-3 py-1 text-xs rounded-lg font-medium text-white disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      )}

      {/* Category List */}
      <nav className="flex flex-col gap-1">
        <button
          onClick={() => onSelectCategory(null)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition cursor-pointer ${
            selectedCategoryId === null
              ? 'bg-amber-500/15 dark:bg-white/15 text-[var(--text-main)] font-semibold border border-amber-500/30 dark:border-white/20 shadow-sm'
              : 'text-[var(--text-sub)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Folder className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span>All Notes</span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 font-mono text-[var(--text-sub)]">
            {totalNotesCount}
          </span>
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id
          const count = notesByCategory[cat.id] || 0

          return (
            <div
              key={cat.id}
              className={`group flex items-center justify-between px-3 py-2 rounded-xl text-sm transition cursor-pointer ${
                isSelected
                  ? 'bg-amber-500/15 dark:bg-white/15 text-[var(--text-main)] font-semibold border border-amber-500/30 dark:border-white/20 shadow-sm'
                  : 'text-[var(--text-sub)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              onClick={() => onSelectCategory(cat.id)}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-[0_0_8px]"
                  style={{
                    backgroundColor: cat.color,
                    boxShadow: `0 0 10px ${cat.color}80`,
                  }}
                />
                <span className="truncate">{cat.title}</span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 font-mono text-[var(--text-sub)]">
                  {count}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(`Delete category "${cat.title}"? Associated notes will not be deleted.`)) {
                      onDeleteCategory(cat.id)
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:text-rose-500 transition p-1 rounded"
                  title="Delete category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
