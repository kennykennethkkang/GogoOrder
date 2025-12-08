// JS/utils.js
// Shared utility functions

function normalizeImage(raw) {
  if (!raw || raw === "") return "img/logo.png";
  if (String(raw).startsWith("http")) return raw;
  // Remove leading slash if present, ensure it starts with img/
  const path = String(raw).replace(/^\/+/, "");
  return path.startsWith("img/") ? path : "img/" + path;
}

function showMsg(el, msg, autoHide = true) {
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
  elements.forEach((el) => {
    if (el) el.style.display = "none";
  });
}

