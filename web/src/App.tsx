import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, Loader2, Plus } from 'lucide-react'
import { api } from './api/client'
import { BackgroundCanvas } from './components/BackgroundCanvas'
import { Navbar } from './components/Navbar'
import { NoteCard } from './components/NoteCard'
import { NoteModal } from './components/NoteModal'
import { Sidebar } from './components/Sidebar'
import { SunflowerMascot } from './components/SunflowerMascot'
import type { Category, CreateNoteRequest, Note, UpdateNoteRequest } from './types'

export function App() {
  const [categories, setCategories] = useState<Category[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Theme State with LocalStorage Persistence
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  })

  useEffect(() => {
    document.documentElement.classList.remove('dark', 'light')
    document.documentElement.classList.add(theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

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
    <div className="min-h-screen relative selection:bg-amber-500/30 selection:text-amber-900 dark:selection:text-amber-200">
      {/* Dynamic Ambient Background: Liquid Sunflower Mesh with Cursor Illumination */}
      <BackgroundCanvas theme={theme} />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Floating Glass Navigation Bar */}
        <Navbar
          search={search}
          onSearchChange={setSearch}
          onNewNote={() => {
            setEditingNote(null)
            setIsModalOpen(true)
          }}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row gap-6">
          {/* Floating Sidebar */}
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
          <section className="flex-1 flex flex-col gap-5">
            {/* Section Header */}
            <div className="glass-panel rounded-2xl px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-[var(--text-main)] tracking-tight m-0">
                  {selectedCategory ? selectedCategory.title : 'All Notes'}
                </h2>
                {selectedCategory && (
                  <span
                    className="w-3 h-3 rounded-full shadow-sm"
                    style={{
                      backgroundColor: selectedCategory.color,
                      boxShadow: `0 0 10px ${selectedCategory.color}`,
                    }}
                  />
                )}
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10 font-mono font-medium text-[var(--text-sub)]">
                  {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
                </span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-2xl glass-panel border border-rose-500/30 text-rose-600 dark:text-rose-300 text-sm flex items-center gap-3 bg-rose-500/10">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Loading Skeleton */}
            {loading && (
              <div className="py-24 glass-panel rounded-2xl flex flex-col items-center justify-center gap-3 text-[var(--text-muted)]">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                <span className="text-sm font-medium">Brewing notes...</span>
              </div>
            )}

            {/* Empty State with Sunflower Mascot */}
            {!loading && filteredNotes.length === 0 && (
              <div className="py-20 glass-panel rounded-3xl flex flex-col items-center justify-center text-center p-8 gap-5 relative overflow-hidden">
                <div className="relative">
                  <div className="absolute -inset-4 bg-amber-400/25 rounded-full blur-xl animate-pulse-slow" />
                  <SunflowerMascot size={96} animate={true} />
                </div>
                <div className="max-w-md flex flex-col items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-600 dark:text-amber-300 text-xs font-semibold">
                    <span>🌻 Sunny says: "Plant an idea!"</span>
                  </div>
                  <h3 className="text-xl font-bold text-[var(--text-main)] tracking-tight">
                    {search ? 'No notes matched your search' : 'Your garden of ideas is waiting!'}
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-sub)] max-w-sm leading-relaxed">
                    {search
                      ? `We couldn't find any note matching "${search}". Try another keyword or clear filter.`
                      : 'Capture thoughts, write Markdown documentation, or organize your daily tasks in radiant liquid glass.'}
                  </p>
                </div>
                {!search && (
                  <button
                    onClick={() => {
                      setEditingNote(null)
                      setIsModalOpen(true)
                    }}
                    className="glass-button-primary px-6 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-xl"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Plant your first note</span>
                  </button>
                )}
              </div>
            )}

            {/* True Liquid Glass Notes Grid */}
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
