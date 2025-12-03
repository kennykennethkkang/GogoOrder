// JS/admin-auth.js
(async function () {
  const wrapper = document.getElementById("admin-wrapper");
  const apiBase = "../PHP";

  function redirectToLogin() {
    window.location.href = "admin-auth.php";
  }

  try {
    const res = await fetch(`${apiBase}/api-auth.php`);
    const data = await res.json();
    if (!data.user || data.user.role !== "admin") {
      return redirectToLogin();
    }

    if (wrapper) {
      wrapper.classList.add("visible");
    }

    document.querySelectorAll("[data-admin-name]").forEach((el) => {
      el.textContent =
        (data.user.first_name || "") + " " + (data.user.last_name || "");
    });
  } catch (err) {
    console.error("Admin auth check failed", err);
    redirectToLogin();
  }
})();
