import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, FileText, Loader2, Plus, Sparkles } from 'lucide-react'
import { api } from './api/client'
import { Navbar } from './components/Navbar'
import { NoteCard } from './components/NoteCard'
import { NoteModal } from './components/NoteModal'
import { Sidebar } from './components/Sidebar'
import type { Category, CreateNoteRequest, Note, UpdateNoteRequest } from './types'

export function App() {
  const [categories, setCategories] = useState<Category[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)

  // Fetch categories
  const loadCategories = useCallback(async () => {
    try {
      const data = await api.getCategories()
      setCategories(data)
    } catch (err: unknown) {
      console.error('Failed to load categories', err)
    }
  }, [])

  // Fetch notes
  const loadNotes = useCallback(async (categoryId?: string | null) => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getNotes(categoryId)
      setNotes(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load notes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    loadNotes(selectedCategoryId)
  }, [selectedCategoryId, loadNotes])

  // Category Actions
  const handleCreateCategory = async (title: string, color: string) => {
    try {
      await api.createCategory({ title, color })
      await loadCategories()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to create category')
    }
  }

  const handleDeleteCategory = async (id: string) => {
    try {
      await api.deleteCategory(id)
      if (selectedCategoryId === id) {
        setSelectedCategoryId(null)
      }
      await loadCategories()
      await loadNotes(selectedCategoryId === id ? null : selectedCategoryId)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete category')
    }
  }

  // Note Actions
  const handleSaveNote = async (data: CreateNoteRequest | UpdateNoteRequest) => {
    if (editingNote) {
      await api.updateNote(editingNote.id, data as UpdateNoteRequest)
    } else {
      await api.createNote(data as CreateNoteRequest)
    }
    await loadNotes(selectedCategoryId)
    await loadCategories()
  }

  const handleTogglePin = async (id: string, currentPin: boolean) => {
    const targetNote = notes.find((n) => n.id === id)
    if (!targetNote) return

    // Optimistic UI update
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_pinned: !currentPin } : n)),
    )

    try {
      await api.updateNote(id, {
        title: targetNote.title,
        content: targetNote.content,
        category_id: targetNote.category_id,
        is_pinned: !currentPin,
      })
      await loadNotes(selectedCategoryId)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update pin state')
      await loadNotes(selectedCategoryId)
    }
  }

  const handleDeleteNote = async (id: string) => {
    try {
      await api.deleteNote(id)
      setNotes((prev) => prev.filter((n) => n.id !== id))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete note')
    }
  }

  // Fast lookups
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>()
    for (const c of categories) {
      map.set(c.id, c)
    }
    return map
  }, [categories])

  const notesByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    for (const n of notes) {
      if (n.category_id) {
        map[n.category_id] = (map[n.category_id] || 0) + 1
      }
    }
    return map
  }, [notes])

  // Filtered notes by search query
  const filteredNotes = useMemo(() => {
    if (!search.trim()) return notes
    const q = search.toLowerCase()
    return notes.filter(
      (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q),
    )
  }, [notes, search])

  const selectedCategory = selectedCategoryId ? categoryMap.get(selectedCategoryId) : null

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 relative selection:bg-indigo-500/30">
      {/* Background Liquid Glass Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-[128px]" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-[130px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navigation Bar */}
        <Navbar
          search={search}
          onSearchChange={setSearch}
          onNewNote={() => {
            setEditingNote(null)
            setIsModalOpen(true)
          }}
        />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <Sidebar
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
            onCreateCategory={handleCreateCategory}
            onDeleteCategory={handleDeleteCategory}
            totalNotesCount={notes.length}
            notesByCategory={notesByCategory}
          />

          {/* Notes Grid */}
          <section className="flex-1 flex flex-col gap-6">
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-white tracking-tight m-0">
                  {selectedCategory ? selectedCategory.title : 'All Notes'}
                </h2>
                {selectedCategory && (
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: selectedCategory.color,
                      boxShadow: `0 0 10px ${selectedCategory.color}`,
                    }}
                  />
                )}
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 font-mono text-slate-400">
                  {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
                </span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Loading Skeleton */}
            {loading && (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                <span className="text-sm">Loading notes...</span>
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredNotes.length === 0 && (
              <div className="py-20 glass-panel rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center p-8 gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 shadow-inner">
                  {search ? <FileText className="w-6 h-6" /> : <Sparkles className="w-6 h-6 text-indigo-400" />}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white mb-1">
                    {search ? 'No notes found' : 'No notes yet'}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm">
                    {search
                      ? `No notes matching "${search}". Try refining your search query.`
                      : 'Capture ideas, write documentation, or organize tasks with markdown notes.'}
                  </p>
                </div>
                {!search && (
                  <button
                    onClick={() => {
                      setEditingNote(null)
                      setIsModalOpen(true)
                    }}
                    className="glass-button-primary px-4 py-2 rounded-xl text-sm font-medium text-white flex items-center gap-2 cursor-pointer shadow-lg mt-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create first note</span>
                  </button>
                )}
              </div>
            )}

            {/* Notes Grid Display */}
            {!loading && filteredNotes.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
                {filteredNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    category={note.category_id ? categoryMap.get(note.category_id) : undefined}
                    onTogglePin={handleTogglePin}
                    onEdit={(n) => {
                      setEditingNote(n)
                      setIsModalOpen(true)
                    }}
                    onDelete={handleDeleteNote}
                  />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Note Creation/Editing Modal */}
      <NoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveNote}
        initialNote={editingNote}
        categories={categories}
        defaultCategoryId={selectedCategoryId}
      />
    </div>
  )
}
export default App
