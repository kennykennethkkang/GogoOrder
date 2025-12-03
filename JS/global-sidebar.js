// JS/global-sidebar.js
(function () {
  const mount = document.getElementById("global-sidebar");
  if (!mount) return;

  const path = window.location.pathname;
  const isHtmlSubdir = path.includes("/HTML/");

  // Where to load the snippet from
  const snippetPath = isHtmlSubdir
    ? "global-sidebar.html"
    : "HTML/global-sidebar.html";

  fetch(snippetPath)
    .then((res) => {
      if (!res.ok) throw new Error("Failed to load global sidebar");
      return res.text();
    })
    .then((html) => {
      mount.innerHTML = html;

      // Fix logo path so it works from / and /HTML/
      const logo = mount.querySelector("[data-logo]");
      if (logo) {
        logo.src = isHtmlSubdir ? "../img/logo.png" : "img/logo.png";
      }

      // Map nav targets → hrefs depending on location
      const links = mount.querySelectorAll(".nav-icons a[data-nav]");

      links.forEach((a) => {
        const target = a.getAttribute("data-nav");
        let href = "#";

        if (isHtmlSubdir) {
          // We are on /HTML/*.php
          switch (target) {
            case "home":
              href = "../index.php";
              break;
            case "menu":
              href = "view-order.php";
              break;
            case "account":
              href = "login.php";
              break;
            case "cart":
              href = "cart.php";
              break;
          }
        } else {
          // We are on /index.php (root)
          switch (target) {
            case "home":
              href = "index.php";
              break;
            case "menu":
              href = "HTML/view-order.php";
              break;
            case "account":
              href = "HTML/login.php";
              break;
            case "cart":
              href = "HTML/cart.php";
              break;
          }
        }

        a.href = href;
      });

      // Highlight active icon based on current page
      const currentFile =
        path.substring(path.lastIndexOf("/") + 1) || "index.html";

      let activeNav = "home";
      if (
        currentFile === "login.php" ||
        currentFile === "signup.php" ||
        currentFile === "admin-auth.php"
      ) {
        activeNav = "account";
      } else if (currentFile === "cart.php") {
        activeNav = "cart";
      } else if (currentFile === "view-order.php") {
        activeNav = "menu";
      }

      links.forEach((a) => {
        if (a.getAttribute("data-nav") === activeNav) {
          a.classList.add("active");
        }
      });
    })
    .catch((err) => {
      console.error("Global sidebar error:", err);
    });
})();
