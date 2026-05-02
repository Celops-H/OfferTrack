interface ElectronAPI {
  exportData: (data: string) => Promise<void>
  importData: () => Promise<string | null>
  closeApp: () => void
}

interface Window {
  electronAPI?: ElectronAPI
}
