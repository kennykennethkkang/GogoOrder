// JS/utils.js
// Shared utility functions

function normalizeImage(raw) {
  // keeps images working whether they are absolute or relative
  if (!raw || raw === "") return "img/logo.png";
  if (String(raw).startsWith("http")) return raw;
  // Remove leading slash if present, ensure it starts with img/
  const path = String(raw).replace(/^\/+/, "");
  return path.startsWith("img/") ? path : "img/" + path;
}

function showMsg(el, msg, autoHide = true) {
  // quick helper to show a message element
  if (!el) return;
  el.textContent = msg;
  el.style.display = "block";
  if (autoHide) {
    setTimeout(() => {
      el.style.display = "none";
    }, 5000);
  }
}

function hideMsgs(...elements) {
  // hide a list of elements safely
  elements.forEach((el) => {
    if (el) el.style.display = "none";
  });
}
