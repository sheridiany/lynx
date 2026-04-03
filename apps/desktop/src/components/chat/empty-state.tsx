import { Sparkles, Globe, FileText, Code, Lightbulb } from 'lucide-react'

const suggestions = [
  { icon: Globe, label: 'Search the web', prompt: 'Search the web for the latest AI news' },
  { icon: FileText, label: 'Summarize a file', prompt: 'Summarize the contents of my README file' },
  { icon: Code, label: 'Write code', prompt: 'Write a TypeScript function to parse CSV data' },
  { icon: Lightbulb, label: 'Brainstorm ideas', prompt: 'Brainstorm 5 project ideas using AI' },
]

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      <div className="mb-6">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
          <Sparkles size={28} className="text-accent" />
        </div>
      </div>
      <h1 className="text-xl font-semibold text-text-primary mb-1">Welcome to Lynx</h1>
      <p className="text-sm text-text-secondary mb-8">Your personal AI assistant. How can I help?</p>

      <div className="grid grid-cols-2 gap-2 max-w-md w-full">
        {suggestions.map((s) => (
          <button
            key={s.label}
            className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-bg-secondary border border-border hover:border-accent/30 hover:bg-accent/5 text-left transition-all group"
          >
            <s.icon size={16} className="text-text-tertiary group-hover:text-accent transition-colors shrink-0" />
            <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
