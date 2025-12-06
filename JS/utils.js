// JS/utils.js
// Shared utility functions

function normalizeImage(raw) {
  if (!raw) return "/img/placeholder.png";
  if (String(raw).startsWith("http")) return raw;
  return "/" + String(raw).replace(/^\/?/, "");
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

