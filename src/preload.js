"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("diagnosis", {
  start: () => ipcRenderer.send("start-diagnosis"),
  onLog: (callback) => ipcRenderer.on("log", (event, arg) => callback(arg)),
  onEnd: (callback) =>
    ipcRenderer.on("end-diagnosis", (event, arg) => callback(arg)),
});
