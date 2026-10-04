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
    <article className="glass-card rounded-2xl p-5 flex flex-col justify-between gap-4 relative group">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2">
        {category ? (
          <span
            className="text-[11px] font-medium px-2.5 py-1 rounded-full border flex items-center gap-1.5"
            style={{
              backgroundColor: `${category.color}15`,
              borderColor: `${category.color}40`,
              color: category.color,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            {category.title}
          </span>
        ) : (
          <span className="text-[11px] text-slate-500 font-mono">Uncategorized</span>
        )}

        <div className="flex items-center gap-1">
          {/* Quick Pin Toggle Button (FT-3.4) */}
          <button
            onClick={() => onTogglePin(note.id, note.is_pinned)}
            title={note.is_pinned ? 'Unpin note' : 'Pin note to top'}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              note.is_pinned
                ? 'text-amber-400 bg-amber-400/10 hover:bg-amber-400/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 opacity-60 group-hover:opacity-100'
            }`}
          >
            <Pin className={`w-4 h-4 ${note.is_pinned ? 'fill-amber-400' : ''}`} />
          </button>

          {/* Edit */}
          <button
            onClick={() => onEdit(note)}
            title="Edit note"
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-white/5 transition cursor-pointer opacity-60 group-hover:opacity-100"
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
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 transition cursor-pointer opacity-60 group-hover:opacity-100"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Title & Markdown Content */}
      <div className="flex-1 flex flex-col gap-2">
        <h3 className="text-base font-semibold text-white tracking-tight leading-snug break-words m-0">
          {note.title}
        </h3>
        <div className="max-h-48 overflow-y-auto pr-1">
          <MarkdownPreview content={note.content} />
        </div>
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <span>Updated {formattedDate}</span>
        {note.is_pinned && (
          <span className="text-amber-400/80 font-sans text-[10px] uppercase font-semibold tracking-wider">
            Pinned
          </span>
        )}
      </div>
    </article>
  )
}
