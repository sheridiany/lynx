import { useState } from 'react'
import { TitleBar } from './components/ui/title-bar'
import { Sidebar } from './components/sidebar/sidebar'
import { ChatView } from './components/chat/chat-view'
import { ContextPanel } from './components/panels/context-panel'
import { SettingsPanel } from './components/settings/settings-panel'
import { useConnection } from './hooks/use-connection'

export function App() {
  useConnection()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [contextPanelOpen, setContextPanelOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div className="flex flex-col h-screen bg-bg-primary">
      <TitleBar
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        onToggleContext={() => setContextPanelOpen(!contextPanelOpen)}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          onOpenSettings={() => setSettingsOpen(true)}
        />
        {settingsOpen ? (
          <SettingsPanel onClose={() => setSettingsOpen(false)} />
        ) : (
          <ChatView />
        )}
        {contextPanelOpen && <ContextPanel />}
      </div>
    </div>
  )
}
