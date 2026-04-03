import { ArrowLeft, Cpu, Info } from 'lucide-react'
import { useChatStore } from '@/stores/chat-store'
import { AVAILABLE_MODELS } from '@/lib/models'

interface SettingsPanelProps {
  onClose: () => void
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { selectedModel, setSelectedModel } = useChatStore()

  // Group models by provider
  const providers = AVAILABLE_MODELS.reduce<Record<string, typeof AVAILABLE_MODELS>>((acc, model) => {
    if (!acc[model.provider]) acc[model.provider] = []
    acc[model.provider].push(model)
    return acc
  }, {})

  return (
    <main className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-6 py-4 border-b border-border">
        <button
          onClick={onClose}
          className="p-1.5 rounded-md hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
          title="Back to chat"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-base font-semibold text-text-primary">Settings</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-6 space-y-8">
          {/* LLM Provider Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Cpu size={16} className="text-accent" />
              <h2 className="text-sm font-semibold text-text-primary">LLM Provider</h2>
            </div>
            <div className="bg-bg-secondary border border-border rounded-lg p-4 space-y-4">
              <div>
                <label htmlFor="model-select" className="block text-xs font-medium text-text-secondary mb-2">
                  Model
                </label>
                <select
                  id="model-select"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-bg-tertiary border border-border rounded-md px-3 py-2 text-sm text-text-primary outline-none focus:border-accent/40 transition-colors appearance-none cursor-pointer"
                >
                  {Object.entries(providers).map(([provider, models]) => (
                    <optgroup key={provider} label={provider}>
                      {models.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <p className="text-xs text-text-tertiary">
                Select the AI model to use for chat completions. Different models have different capabilities and speeds.
              </p>
            </div>
          </section>

          {/* About Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Info size={16} className="text-info" />
              <h2 className="text-sm font-semibold text-text-primary">About</h2>
            </div>
            <div className="bg-bg-secondary border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">App name</span>
                <span className="text-sm text-text-primary font-medium">Lynx</span>
              </div>
              <div className="border-t border-border" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">Version</span>
                <span className="text-sm text-text-primary font-mono">0.1.0</span>
              </div>
              <div className="border-t border-border" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">Description</span>
                <span className="text-sm text-text-primary">Local-first personal AI assistant</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
