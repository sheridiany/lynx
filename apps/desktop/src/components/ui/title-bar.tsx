import { useState, useRef, useEffect } from 'react'
import { Minus, Square, X, PanelLeftClose, PanelRightClose, Sparkles, ChevronDown } from 'lucide-react'
import { useChatStore } from '@/stores/chat-store'
import { AVAILABLE_MODELS, getModelName } from '@/lib/models'

interface TitleBarProps {
  onToggleSidebar: () => void
  onToggleContext: () => void
}

export function TitleBar({ onToggleSidebar, onToggleContext }: TitleBarProps) {
  const { selectedModel, setSelectedModel, connected } = useChatStore()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [dropdownOpen])

  // Group models by provider
  const providers = AVAILABLE_MODELS.reduce<Record<string, typeof AVAILABLE_MODELS>>((acc, model) => {
    if (!acc[model.provider]) acc[model.provider] = []
    acc[model.provider].push(model)
    return acc
  }, {})

  return (
    <header className="titlebar-drag-region flex items-center h-10 px-3 bg-bg-secondary border-b border-border select-none shrink-0">
      {/* Left: sidebar toggle + logo */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-md hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
          title="Toggle sidebar"
        >
          <PanelLeftClose size={16} />
        </button>
        <div className="flex items-center gap-1.5 ml-1">
          <Sparkles size={16} className="text-accent" />
          <span className="text-sm font-semibold text-text-primary">Lynx</span>
        </div>
        <div className="flex items-center gap-1.5 ml-3">
          <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-success' : 'bg-error'}`} />
          <span className="text-xs text-text-secondary">{connected ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      {/* Center: model selector dropdown */}
      <div className="flex-1 flex justify-center">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
          >
            {getModelName(selectedModel)}
            <ChevronDown size={12} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-56 bg-bg-elevated border border-border rounded-lg shadow-lg py-1 z-50 max-h-80 overflow-y-auto">
              {Object.entries(providers).map(([provider, models]) => (
                <div key={provider}>
                  <div className="px-3 py-1.5">
                    <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">{provider}</span>
                  </div>
                  {models.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.id)
                        setDropdownOpen(false)
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                        model.id === selectedModel
                          ? 'text-accent bg-accent/10'
                          : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                      }`}
                    >
                      {model.name}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: context toggle + window controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={onToggleContext}
          className="p-1.5 rounded-md hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
          title="Toggle context panel"
        >
          <PanelRightClose size={16} />
        </button>

        <div className="flex items-center ml-2">
          <button
            className="p-1.5 rounded-md hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
            title="Minimize"
          >
            <Minus size={14} />
          </button>
          <button
            className="p-1.5 rounded-md hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
            title="Maximize"
          >
            <Square size={12} />
          </button>
          <button
            className="p-1.5 rounded-md hover:bg-[#e8193850] text-text-secondary hover:text-error transition-colors"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </header>
  )
}
