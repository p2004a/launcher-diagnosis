"use strict";

const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");
const got = require("got");
const axios = require("axios");

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

ipcMain.on("start-diagnosis", (event, url) => {
  const start = Date.now();
  function send(msg) {
    event.sender.send(
      "log",
      `${((Date.now() - start) / 1000).toFixed(3).padStart(7)}: ${msg}`
    );
  }
  send("start");

  scenario(send, url)
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
async function scenario(log, url) {
  for (let fetcher of [fetchWithGot, fetchWithFetch, fetchWithAxios]) {
    log(`requesting ${url} with ${fetcher.name}`);
    try {
      await fetcher(log, url);
    } catch (err) {
      log(`fetching failed with: ${err}`);
    }
  }
}

function getTimings(res) {
  const timings = res.timings;
  const start = timings.start;
  res = {};
  for (let key in timings) {
    res[key] = timings[key] - start;
  }
  return res;
}

async function fetchWithGot(log, url) {
  const res = await got(url, {
    timeout: { request: 90000 },
    hooks: {
      beforeRetry: [
        (options, error, retryCount) => {
          log(`error in query, will retry: ${JSON.stringify(error)}`);
        },
      ],
      beforeRequest: [
        (options) => {
          log(`starting real requests`);
        },
      ],
    },
  });
  log(`got response: ${res.statusCode}: ${res.statusMessage}`);
  log(`timings: ${JSON.stringify(res.timings.phases)}`);
}

async function fetchWithFetch(log, url) {
  const ac = new AbortController();
  const timeoutId = setTimeout(() => {
    log(`aborting request`);
    ac.abort();
  }, 60000);
  const res = await fetch(url, {
    signal: ac.signal,
  });
  log(`got response: ${res.status}: ${res.statusText}`);
  clearTimeout(timeoutId);
}

async function fetchWithAxios(log, url) {
  const res = await axios.get(url, {
    timeout: 90000,
  });
  log(`got response: ${res.status}: ${res.statusText}`);
}
