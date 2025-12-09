// JS/admin-auth.js
(async function () {
  // the admin shell wrapper is hidden until we verify the session
  const wrapper = document.getElementById("admin-wrapper");
  const apiBase = "../PHP";

  function redirectToLogin() {
    window.location.href = "admin-auth.php";
  }

  try {
    const res = await fetch(`${apiBase}/api-auth.php`);
    const data = await res.json();
    // if not an admin, bounce to login
    if (!data.user || data.user.role !== "admin") {
      return redirectToLogin();
    }

    if (wrapper) {
      wrapper.classList.add("visible");
    }

    // drop the admin's name into any marked spots
    document.querySelectorAll("[data-admin-name]").forEach((el) => {
      el.textContent =
        (data.user.first_name || "") + " " + (data.user.last_name || "");
    });
  } catch (err) {
    console.error("Admin auth check failed", err);
    redirectToLogin();
  }
})();
