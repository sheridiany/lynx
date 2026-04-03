import { User, Sparkles, Copy, RefreshCw } from 'lucide-react'
import type { MessageRole } from '@lynx/shared'

interface ChatMessageProps {
  message: {
    id: string
    role: MessageRole
    content: string
    createdAt: number
  }
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`group flex gap-3 ${isUser ? '' : ''}`}>
      {/* Avatar */}
      <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5 ${
        isUser
          ? 'bg-bg-tertiary text-text-secondary'
          : 'bg-accent/15 text-accent'
      }`}>
        {isUser ? <User size={14} /> : <Sparkles size={14} />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-text-secondary">
            {isUser ? 'You' : 'Lynx'}
          </span>
          <span className="text-[10px] text-text-tertiary">
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="text-sm leading-relaxed text-text-primary whitespace-pre-wrap break-words">
          {message.content}
        </div>

        {/* Actions (visible on hover) */}
        {!isUser && (
          <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-1 rounded hover:bg-bg-tertiary text-text-tertiary hover:text-text-secondary transition-colors" title="Copy">
              <Copy size={13} />
            </button>
            <button className="p-1 rounded hover:bg-bg-tertiary text-text-tertiary hover:text-text-secondary transition-colors" title="Regenerate">
              <RefreshCw size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
