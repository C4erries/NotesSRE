import { Edit2, Pin, Trash2 } from 'lucide-react'
import type { Category, Note } from '../types'
import { MarkdownPreview } from './MarkdownPreview'

interface Props {
  note: Note
  category?: Category
  onTogglePin: (id: string, currentPin: boolean) => void
  onEdit: (note: Note) => void
  onDelete: (id: string) => void
}

export function NoteCard({ note, category, onTogglePin, onEdit, onDelete }: Props) {
  const formattedDate = new Date(note.updated_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <article
      className={`glass-card rounded-2xl p-5 flex flex-col justify-between gap-4 relative group transition-all duration-300 ${
        note.is_pinned
          ? 'border-amber-400/50 shadow-[0_12px_36px_-6px_rgba(245,158,11,0.22)] ring-1 ring-amber-400/30'
          : ''
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 relative z-10">
        {category ? (
          <span
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1.5 shadow-sm backdrop-blur-md"
            style={{
              backgroundColor: `${category.color}20`,
              borderColor: `${category.color}50`,
              color: category.color,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: category.color, boxShadow: `0 0 8px ${category.color}` }}
            />
            {category.title}
          </span>
        ) : (
          <span className="text-[11px] text-[var(--text-muted)] font-mono px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
            Uncategorized
          </span>
        )}

        <div className="flex items-center gap-1">
          {/* Quick Pin Toggle Button (FT-3.4) with Yellow/Amber Accent */}
          <button
            onClick={() => onTogglePin(note.id, note.is_pinned)}
            title={note.is_pinned ? 'Unpin note' : 'Pin note to top'}
            className={`p-1.5 rounded-xl transition cursor-pointer ${
              note.is_pinned
                ? 'text-amber-500 bg-amber-400/25 shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                : 'text-[var(--text-muted)] hover:text-amber-500 hover:bg-black/5 dark:hover:bg-white/10 opacity-70 group-hover:opacity-100'
            }`}
          >
            <Pin className={`w-4 h-4 ${note.is_pinned ? 'fill-amber-400' : ''}`} />
          </button>

          {/* Edit */}
          <button
            onClick={() => onEdit(note)}
            title="Edit note"
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-amber-600 dark:hover:text-amber-300 hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer opacity-60 group-hover:opacity-100"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          {/* Delete */}
          <button
            onClick={() => {
              if (confirm(`Delete note "${note.title}"?`)) {
                onDelete(note.id)
              }
            }}
            title="Delete note"
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer opacity-60 group-hover:opacity-100"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Title & Markdown Content */}
      <div className="flex-1 flex flex-col gap-2">
        <h3 className="text-base font-semibold text-[var(--text-main)] tracking-tight leading-snug break-words m-0">
          {note.title}
        </h3>
        <div className="max-h-48 overflow-y-auto pr-1">
          <MarkdownPreview content={note.content} />
        </div>
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-black/5 dark:border-white/[0.06] flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono">
        <span>Updated {formattedDate}</span>
        {note.is_pinned && (
          <span className="text-amber-500 font-sans text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Pinned
          </span>
        )}
      </div>
    </article>
  )
}
