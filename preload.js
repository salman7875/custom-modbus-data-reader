const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("api", {
  readWeight: () => ipcRenderer.invoke("modbus:read"),
  saveTest: (data) => ipcRenderer.invoke("db:save", data),
  generateReport: (data) => ipcRenderer.invoke("report:generate", data),
});
