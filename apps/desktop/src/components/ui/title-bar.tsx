import { Minus, Square, X, PanelLeftClose, PanelRightClose, Sparkles } from 'lucide-react'

interface TitleBarProps {
  onToggleSidebar: () => void
  onToggleContext: () => void
}

export function TitleBar({ onToggleSidebar, onToggleContext }: TitleBarProps) {
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
          <div className="w-1.5 h-1.5 rounded-full bg-success" />
          <span className="text-xs text-text-secondary">Online</span>
        </div>
      </div>

      {/* Center: model info */}
      <div className="flex-1 flex justify-center">
        <button className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors">
          Claude Sonnet 4
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
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
