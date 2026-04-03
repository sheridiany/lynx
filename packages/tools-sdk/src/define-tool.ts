export interface ToolDefinition<TInput = Record<string, unknown>, TOutput = unknown> {
  name: string
  description: string
  category?: string
  parameters: {
    type: 'object'
    properties: Record<string, {
      type: string
      description?: string
      default?: unknown
      enum?: unknown[]
      items?: { type: string }
    }>
    required?: string[]
  }
  confirmationRequired?: boolean
  execute: (input: TInput) => Promise<TOutput>
}

export function defineTool<TInput = Record<string, unknown>, TOutput = unknown>(
  definition: ToolDefinition<TInput, TOutput>
): ToolDefinition<TInput, TOutput> {
  return definition
}
