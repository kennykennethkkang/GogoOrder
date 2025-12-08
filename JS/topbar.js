// JS/topbar.js
// Shows admin-only links (e.g., "Go to Admin") without flashing chips in customer nav.
(function () {
  const isHtmlSubdir = window.location.pathname.includes("/HTML/");
  const apiBase = isHtmlSubdir ? "../PHP" : "PHP";

  function setAdminVisibility(isAdmin) {
    document.querySelectorAll("[data-admin-link]").forEach((el) => {
      el.style.display = isAdmin ? (el.dataset.display || "block") : "none";
    });
  }

  fetch(`${apiBase}/api-auth.php`)
    .then((res) => res.json())
    .then((data) => {
      const isAdmin = data.user && data.user.role === "admin";
      setAdminVisibility(isAdmin);
    })
    .catch(() => setAdminVisibility(false));
})();
