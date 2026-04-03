import { useState, useRef, useCallback } from 'react'
import { Send, Paperclip, Mic, Zap, Square } from 'lucide-react'
import { useChatStore } from '@/stores/chat-store'

export function ChatInput() {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { sendMessage, isStreaming, cancelGeneration } = useChatStore()

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed || isStreaming) return
    sendMessage(trimmed)
    setText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [text, isStreaming, sendMessage])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    // Auto-resize
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }

  return (
    <div className="shrink-0 border-t border-border bg-bg-secondary/50 backdrop-blur-sm">
      <div className="max-w-3xl mx-auto px-4 py-3">
        <div className="flex items-end gap-2 bg-bg-secondary border border-border rounded-xl px-3 py-2 focus-within:border-accent/40 transition-colors">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask Lynx anything..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary resize-none outline-none max-h-[200px] py-1 leading-relaxed"
          />

          <div className="flex items-center gap-0.5 shrink-0 pb-0.5">
            <button
              className="p-1.5 rounded-md text-text-tertiary hover:text-text-secondary hover:bg-bg-tertiary transition-colors"
              title="Attach file"
            >
              <Paperclip size={16} />
            </button>
            <button
              className="p-1.5 rounded-md text-text-tertiary hover:text-text-secondary hover:bg-bg-tertiary transition-colors"
              title="Voice input"
            >
              <Mic size={16} />
            </button>
            <button
              className="p-1.5 rounded-md text-text-tertiary hover:text-text-secondary hover:bg-bg-tertiary transition-colors"
              title="Commands"
            >
              <Zap size={16} />
            </button>

            {isStreaming ? (
              <button
                onClick={cancelGeneration}
                className="p-1.5 rounded-md bg-error/15 text-error hover:bg-error/25 transition-colors ml-1"
                title="Stop generating"
              >
                <Square size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!text.trim()}
                className="p-1.5 rounded-md bg-accent text-white hover:bg-accent-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors ml-1"
                title="Send message"
              >
                <Send size={16} />
              </button>
            )}
          </div>
        </div>
        <p className="text-[10px] text-text-tertiary text-center mt-1.5">
          Lynx can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  )
}
