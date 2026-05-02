interface ElectronAPI {
  exportData: (data: string) => Promise<boolean>
  importData: () => Promise<string | null>
  closeApp: () => void
}

interface Window {
  electronAPI?: ElectronAPI
}
