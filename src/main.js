"use strict";

const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.setMenuBarVisibility(false);
  win.loadFile("src/index.html");
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());

ipcMain.on("start-diagnosis", (event, arg) => {
  const start = Date.now();
  function send(msg) {
    event.sender.send(
      "log",
      `${((Date.now() - start) / 1000).toFixed(3).padStart(7)}: ${msg}`
    );
  }
  send("start");

  setTimeout(() => {
    send("done.");
    event.sender.send("end-diagnosis");
  }, 1000);
});
