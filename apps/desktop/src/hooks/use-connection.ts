import { useEffect } from 'react'
import { useChatStore } from '@/stores/chat-store'

export function useConnection() {
  const connect = useChatStore((s) => s.connect)
  const disconnect = useChatStore((s) => s.disconnect)
  const connected = useChatStore((s) => s.connected)

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  return { connected }
}
