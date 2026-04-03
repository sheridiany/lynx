import { Brain, Monitor, Clock, User } from 'lucide-react'

export function ContextPanel() {
  return (
    <aside className="w-[280px] shrink-0 bg-bg-secondary border-l border-border flex flex-col overflow-y-auto">
      <div className="p-3 border-b border-border">
        <h2 className="text-xs font-medium text-text-tertiary uppercase tracking-wider">Context</h2>
      </div>

      {/* Memory section */}
      <section className="p-3 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <Brain size={14} className="text-accent" />
          <h3 className="text-xs font-medium text-text-secondary">Memory</h3>
        </div>
        <p className="text-xs text-text-tertiary">No memories stored yet. Start chatting to build context.</p>
      </section>

      {/* System section */}
      <section className="p-3 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <Monitor size={14} className="text-info" />
          <h3 className="text-xs font-medium text-text-secondary">System</h3>
        </div>
        <div className="space-y-1 text-xs text-text-tertiary">
          <p>Platform: {navigator.platform}</p>
          <p>Language: {navigator.language}</p>
        </div>
      </section>

      {/* Time section */}
      <section className="p-3 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <Clock size={14} className="text-warning" />
          <h3 className="text-xs font-medium text-text-secondary">Time</h3>
        </div>
        <div className="space-y-1 text-xs text-text-tertiary">
          <p>{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p>{Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
        </div>
      </section>

      {/* User section */}
      <section className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <User size={14} className="text-success" />
          <h3 className="text-xs font-medium text-text-secondary">Profile</h3>
        </div>
        <p className="text-xs text-text-tertiary">No profile configured yet.</p>
      </section>
    </aside>
  )
}
