const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('tryOn', {
  listGarments: () => ipcRenderer.invoke('garments:list'),
  readGarment: (name) => ipcRenderer.invoke('garments:read', name)
});
