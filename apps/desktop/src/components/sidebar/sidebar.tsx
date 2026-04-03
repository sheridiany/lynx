import { Plus, MessageSquare, Settings, Wrench, Trash2 } from 'lucide-react'
import { useChatStore } from '@/stores/chat-store'

interface SidebarProps {
  collapsed: boolean
  onOpenSettings: () => void
}

export function Sidebar({ collapsed, onOpenSettings }: SidebarProps) {
  const { conversations, activeConversationId, createConversation, setActiveConversation, deleteConversation } = useChatStore()

  if (collapsed) {
    return (
      <aside className="w-[52px] shrink-0 bg-bg-secondary border-r border-border flex flex-col items-center py-3 gap-2">
        <button
          onClick={createConversation}
          className="p-2 rounded-lg hover:bg-bg-tertiary text-text-secondary hover:text-accent transition-colors"
          title="New chat"
        >
          <Plus size={18} />
        </button>
        <div className="flex-1" />
        <button className="p-2 rounded-lg hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors" title="Tools">
          <Wrench size={18} />
        </button>
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
          title="Settings"
        >
          <Settings size={18} />
        </button>
      </aside>
    )
  }

  return (
    <aside className="w-60 shrink-0 bg-bg-secondary border-r border-border flex flex-col">
      {/* New chat button */}
      <div className="p-3">
        <button
          onClick={createConversation}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-tertiary hover:bg-accent/10 text-text-secondary hover:text-accent border border-border hover:border-accent/30 transition-all text-sm"
        >
          <Plus size={16} />
          New chat
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2">
        <div className="px-2 py-1.5">
          <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider">Recent</span>
        </div>
        {conversations.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <MessageSquare size={24} className="mx-auto mb-2 text-text-tertiary" />
            <p className="text-xs text-text-tertiary">No conversations yet</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              className={`group flex items-center rounded-lg mb-0.5 transition-colors ${
                conv.id === activeConversationId
                  ? 'bg-accent/10 border border-accent/20'
                  : 'hover:bg-bg-tertiary border border-transparent'
              }`}
            >
              <button
                onClick={() => setActiveConversation(conv.id)}
                className={`flex-1 text-left px-3 py-2 text-sm truncate ${
                  conv.id === activeConversationId ? 'text-accent' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {conv.title || 'New conversation'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id) }}
                className="hidden group-hover:flex items-center justify-center w-7 h-7 mr-1 rounded text-text-tertiary hover:text-error hover:bg-error/10 transition-colors"
                title="Delete conversation"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Bottom actions */}
      <div className="p-2 border-t border-border flex gap-1">
        <button className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors text-sm">
          <Wrench size={16} />
          Tools
        </button>
        <button
          onClick={onOpenSettings}
          className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors text-sm"
        >
          <Settings size={16} />
          Settings
        </button>
      </div>
    </aside>
  )
}
