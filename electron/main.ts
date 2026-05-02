import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { writeFile, readFile } from 'fs/promises'
import { is } from '@electron-toolkit/utils'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'OfferTrack',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      sandbox: false
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// IPC: 导出数据
ipcMain.handle('export-data', async (_event, data: string) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: '导出数据',
    defaultPath: `offer-track-export-${new Date().toISOString().slice(0, 10)}.json`,
    filters: [{ name: 'JSON', extensions: ['json'] }],
  })
  if (!canceled && filePath) {
    await writeFile(filePath, data, 'utf-8')
    return true
  }
  return false
})

// IPC: 导入数据
ipcMain.handle('import-data', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: '导入数据',
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile'],
  })
  if (!canceled && filePaths.length > 0) {
    const content = await readFile(filePaths[0], 'utf-8')
    return content
  }
  return null
})

// IPC: 关闭应用
ipcMain.on('close-app', () => {
  app.quit()
})

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
