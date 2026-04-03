import type { LLMProviderType } from './types'

export const WS_PORT = 3721
export const WS_PATH = '/ws'
export const API_PORT = 3722
export const API_VERSION = 'v1'
export const APP_NAME = 'Lynx'
export const APP_VERSION = '0.1.0'
export const DEFAULT_MODEL = 'claude-sonnet-4-20250514'
export const DEFAULT_PROVIDER: LLMProviderType = 'anthropic'
export const MAX_AGENT_STEPS = 15
export const MAX_AGENT_REPLANS = 3
export const AGENT_TIMEOUT_MS = 5 * 60 * 1000
