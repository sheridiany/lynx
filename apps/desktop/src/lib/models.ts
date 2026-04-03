export interface ModelOption {
  id: string
  name: string
  provider: string
}

export const AVAILABLE_MODELS: ModelOption[] = [
  // Anthropic
  { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', provider: 'Anthropic' },
  { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', provider: 'Anthropic' },
  { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', provider: 'Anthropic' },
  // OpenAI
  { id: 'gpt-5.4', name: 'GPT-5.4', provider: 'OpenAI' },
  { id: 'gpt-5.3-codex', name: 'GPT-5.3 Codex', provider: 'OpenAI' },
  // Google
  { id: 'gemini-3.1-pro', name: 'Gemini 3.1 Pro', provider: 'Google' },
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite', provider: 'Google' },
  // xAI
  { id: 'grok-4.20-beta', name: 'Grok 4.20 Beta', provider: 'xAI' },
  { id: 'grok-4.1-fast', name: 'Grok 4.1 Fast', provider: 'xAI' },
]

export function getModelName(modelId: string): string {
  const model = AVAILABLE_MODELS.find((m) => m.id === modelId)
  return model ? model.name : modelId
}
