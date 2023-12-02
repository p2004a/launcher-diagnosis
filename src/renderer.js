"use strict";

window.onload = () => {
  const out = document.getElementById("diagnosis-out");
  const btn = document.getElementById("start");

  btn.addEventListener("click", () => {
    if (btn.disabled) return;
    out.textContent = "";
    diagnosis.start();
    btn.disabled = true;
  });

  diagnosis.onLog((arg) => {
    console.log(arg);
    out.textContent += arg + "\n";
  });

  diagnosis.onEnd((arg) => {
    btn.disabled = false;
  });
};
