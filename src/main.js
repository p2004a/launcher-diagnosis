"use strict";

const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");
const got = require("got");
const axios = require("axios");
const dns = require("node:dns").promises;
const net = require("node:net");
const { setDefaultResultOrder, getDefaultResultOrder } = require("node:dns");

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

ipcMain.on("start-diagnosis", (event, config) => {
  const start = Date.now();
  function send(msg) {
    event.sender.send(
      "log",
      `${((Date.now() - start) / 1000).toFixed(3).padStart(7)}: ${msg}`
    );
  }
  send("start");

  scenario(send, config.url, config.dnsOrder, config.happyEyeballs)
    .then(() => {
      send("done.");
      event.sender.send("end-diagnosis");
    })
    .catch((err) => {
      send("error.");
      send(err.toString());
      event.sender.send("end-diagnosis");
    });
});

// Diagnosis scenario
async function scenario(log, url, dnsOrder, happyEyeballs) {
  setDefaultResultOrder(dnsOrder);
  log(`dns result order: ${getDefaultResultOrder()}`);
  const parsedUrl = new URL(url);
  const servers = await dns.lookup(parsedUrl.hostname, { all: true });
  log(
    `resolved ${parsedUrl.hostname} to: ${servers
      .map((s) => s.address)
      .join(", ")}`
  );

  net.setDefaultAutoSelectFamily(happyEyeballs);
  log(`happy eyeballs: ${net.getDefaultAutoSelectFamily()}`);

  for (let fetcher of [fetchWithGot, fetchWithFetch, fetchWithAxios]) {
    log(`requesting ${url} with ${fetcher.name}`);
    try {
      await fetcher(log, url);
    } catch (err) {
      log(`fetching failed with: ${err}`);
    }
  }
}

async function fetchWithGot(log, url) {
  const res = await got(url, {
    timeout: { request: 30000 },
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
  }, 30000);
  const res = await fetch(url, {
    signal: ac.signal,
  });
  log(`got response: ${res.status}: ${res.statusText}`);
  clearTimeout(timeoutId);
}

async function fetchWithAxios(log, url) {
  const res = await axios.get(url, {
    timeout: 30000,
  });
  log(`got response: ${res.status}: ${res.statusText}`);
}
