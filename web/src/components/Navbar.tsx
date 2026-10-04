import { useEffect, useState } from 'react'
import { Activity, Plus, Search, Sparkles } from 'lucide-react'
import { api } from '../api/client'

interface Props {
  search: string
  onSearchChange: (val: string) => void
  onNewNote: () => void
}

export function Navbar({ search, onSearchChange, onNewNote }: Props) {
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
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-white/[0.08] px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
      {/* Brand & SRE Probe */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500/30 to-purple-500/30 border border-white/20 flex items-center justify-center text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight text-white m-0">Notes Service</h1>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/10 text-indigo-300 border border-white/10">
              SRE Lab 1
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
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
                ? 'DB Connected'
                : dbHealthy === false
                  ? 'DB Offline'
                  : 'Checking DB...'}
            </span>
            <Activity className="w-3 h-3 text-slate-500 ml-0.5" />
          </div>
        </div>
      </div>

      {/* Search & Actions */}
      <div className="flex items-center gap-3 flex-1 max-w-md justify-end">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-xl glass-input placeholder:text-slate-500 text-white"
          />
        </div>

        <button
          onClick={onNewNote}
          className="glass-button-primary px-3.5 py-1.5 rounded-xl text-sm font-medium text-white flex items-center gap-1.5 cursor-pointer shadow-lg shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Note</span>
        </button>
      </div>
    </header>
  )
}
