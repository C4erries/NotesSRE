import { useEffect, useState } from 'react'
import { Activity, Moon, Plus, Search, Sun } from 'lucide-react'
import { api } from '../api/client'
import { SunflowerMascot } from './SunflowerMascot'

interface Props {
  search: string
  onSearchChange: (val: string) => void
  onNewNote: () => void
  theme: 'dark' | 'light'
  onToggleTheme: () => void
}

export function Navbar({ search, onSearchChange, onNewNote, theme, onToggleTheme }: Props) {
  const [dbHealthy, setDbHealthy] = useState<boolean | null>(null)

  useEffect(() => {
    const checkHealth = () => {
      api
        .getHealth()
        .then((res) => setDbHealthy(res.status === 'ok' && res.db === 'up'))
        .catch(() => setDbHealthy(false))
    }

    checkHealth()
    const interval = setInterval(checkHealth, 15000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="sticky top-3 z-30 w-full max-w-7xl mx-auto px-4 sm:px-6">
      <div className="glass-panel rounded-2xl px-4 lg:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Sunflower Mascot */}
        <div className="flex items-center gap-3">
          <SunflowerMascot size={38} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-[var(--text-main)] m-0 flex items-center gap-1.5">
                Sunflower <span className="text-amber-500">Notes</span>
              </h1>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-500 dark:text-amber-300 border border-amber-400/25 font-bold">
                SRE Lab 1
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-sub)]">
              <span className="relative flex h-2 w-2">
                {dbHealthy === true ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </>
                ) : dbHealthy === false ? (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                ) : (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 animate-pulse"></span>
                )}
              </span>
              <span className="font-mono text-[11px]">
                {dbHealthy === true
                  ? 'Postgres Online'
                  : dbHealthy === false
                    ? 'Postgres Offline'
                    : 'Pinging DB...'}
              </span>
              <Activity className="w-3 h-3 text-[var(--text-muted)] ml-0.5" />
            </div>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2.5 flex-1 max-w-md justify-end">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="text"
              placeholder="Search notes..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-xl glass-input"
            />
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 rounded-xl glass-button-secondary flex items-center justify-center transition cursor-pointer shrink-0 text-amber-500 hover:text-amber-400"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 fill-amber-400/20" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600 fill-indigo-600/20" />
            )}
          </button>

          <button
            onClick={onNewNote}
            className="glass-button-primary px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 cursor-pointer shadow-lg shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Note</span>
          </button>
        </div>
      </div>
    </header>
  )
}
