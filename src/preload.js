"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("diagnosis", {
  start: (url) => ipcRenderer.send("start-diagnosis", url),
  onLog: (callback) => ipcRenderer.on("log", (event, arg) => callback(arg)),
  onEnd: (callback) =>
    ipcRenderer.on("end-diagnosis", (event, arg) => callback(arg)),
  setDnsResultOrder: (order) => ipcRenderer.send("set-dns-result-order", order),
});
