"use strict";

window.onload = () => {
  const out = document.getElementById("diagnosis-out");
  const btn = document.getElementById("start");
  const url = document.getElementById("url");
  const dnsOrder = document.getElementById("dns-order");
  const happyEyeballs = document.getElementById("happy-eyeballs");

  btn.addEventListener("click", () => {
    if (btn.disabled) return;
    out.textContent = "";
    diagnosis.start({
      url: url.value.trim(),
      dnsOrder: dnsOrder.value,
      happyEyeballs: happyEyeballs.checked,
    });
    btn.innerText = "running...";
    btn.disabled = true;
  });

  diagnosis.onLog((arg) => {
    console.log(arg);
    out.textContent += arg + "\n";
  });

  diagnosis.onEnd((arg) => {
    btn.disabled = false;
    btn.innerText = "start";
  });
};
