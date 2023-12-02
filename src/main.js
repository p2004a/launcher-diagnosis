"use strict";

const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");
const got = require("got");

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

  scenario(send)
    .then(() => {
      send("done.");
      event.sender.send("end-diagnosis");
    })
    .catch((err) => {
      send("error.");
      send(JSON.stringify(err));
      event.sender.send("end-diagnosis");
    });
});

// Diagnosis scenario
async function scenario(log) {
  const url = "https://launcher-config.beyondallreason.dev/config.json";
  //const url = "https://httpbin.org/status/500";

  log(`requesting ${url}`);
  const request = got(url, {
    timeout: { request: 90000 },
    hooks: {
      beforeRetry: [
        (options, error, retryCount) => {
          log(`error in query, will retry: ${JSON.stringify(error)}`);
        },
      ],
      beforeRequest: [
        (options) => {
          log(`starting real request}`);
        },
      ],
    },
  });

  const response = await request;
  log(`got response: ${response.statusCode} ${response.statusMessage}`);
}
