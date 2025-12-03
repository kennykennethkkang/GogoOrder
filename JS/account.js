// JS/account.js
// Combined account+password modal for both customers/admins.

(function () {
  const isHtmlSubdir = window.location.pathname.includes("/HTML/");
  const apiBase = isHtmlSubdir ? "../PHP" : "PHP";

  const menuBtn = document.getElementById("user-menu-btn");
  const menu = document.getElementById("user-menu");
  const modal = document.getElementById("account-modal");
  const modalTitle = document.getElementById("account-modal-title");
  const form = document.getElementById("account-form");
  let currentUser = null;

  function toggleMenu(show) {
    if (!menu) return;
    menu.style.display = show ? "flex" : "none";
  }

  function openModal() {
    if (!modal) return;
    modal.style.display = "flex";
    if (modalTitle) modalTitle.textContent = "Account Settings";
    if (form && currentUser) {
      form.elements["first_name"].value = currentUser.first_name || "";
      form.elements["last_name"].value = currentUser.last_name || "";
      form.elements["phone"].value = currentUser.phone || "";
      form.elements["password"].value = "";
    }
  }

  function closeModal() {
    if (modal) modal.style.display = "none";
  }

  document.addEventListener("click", (e) => {
    if (menuBtn && menuBtn.contains(e.target)) {
      toggleMenu(menu?.style.display !== "flex");
      return;
    }
    if (menu && !menu.contains(e.target)) {
      toggleMenu(false);
    }
    if (modal && modal.style.display === "flex" && e.target === modal) {
      closeModal();
    }
  });

  document.querySelectorAll("[data-open-profile]").forEach((btn) => {
    btn.addEventListener("click", () => {
      toggleMenu(false);
      openModal();
    });
  });

  document.querySelectorAll("[data-close-account-modal]").forEach((btn) => {
    btn.addEventListener("click", closeModal);
  });

  // Fetch current user to prefill
  fetch(`${apiBase}/api-auth.php`)
    .then((res) => res.json())
    .then((data) => {
      currentUser = data.user || null;
    })
    .catch(() => {
      currentUser = null;
    });

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const payload = {
        first_name: data.get("first_name"),
        last_name: data.get("last_name"),
        phone: data.get("phone"),
        password: data.get("password") || "",
      };
      fetch(`${apiBase}/api-user.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((res) => res.json())
        .then((body) => {
          if (body.error) throw new Error(body.error);
          alert("Account updated");
          closeModal();
          window.location.reload();
        })
        .catch((err) => alert(err.message || "Failed to update account"));
    });
  }
})();
