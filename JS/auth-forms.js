// JS/auth-forms.js
// Unified login (customer + admin) and customer signup modal.

(function () {
  const loginForm = document.getElementById("unified-login");
  const loginError = document.getElementById("login-error");
  const loginSuccess = document.getElementById("login-success");

  const signupModal = document.getElementById("signup-modal");
  const signupForm = document.getElementById("customer-signup");
  const signupError = document.getElementById("signup-error");
  const signupSuccess = document.getElementById("signup-success");
  const openSignup = document.getElementById("open-signup");
  const closeSignup = document.getElementById("close-signup");

  function showMsg(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.style.display = "block";
  }

  function hideMsgs() {
    [loginError, loginSuccess, signupError, signupSuccess].forEach((el) => {
      if (el) el.style.display = "none";
    });
  }

  function toggleModal(show) {
    if (!signupModal) return;
    signupModal.style.display = show ? "flex" : "none";
  }

  if (openSignup) {
    openSignup.addEventListener("click", (e) => {
      e.preventDefault();
      toggleModal(true);
    });
  }
  if (closeSignup) {
    closeSignup.addEventListener("click", (e) => {
      e.preventDefault();
      toggleModal(false);
    });
  }
  if (signupModal) {
    signupModal.addEventListener("click", (e) => {
      if (e.target === signupModal) toggleModal(false);
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      hideMsgs();
      const data = new FormData(loginForm);
      const payload = {
        action: "login",
        email: data.get("email"),
        password: data.get("password"),
      };

      fetch("../PHP/api-auth.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((res) => res.json().then((body) => [res.ok, body]))
        .then(([ok, body]) => {
          if (!ok || body.error) {
            throw new Error(body.error || "Login failed");
          }
          const user = body.user || {};
          showMsg(loginSuccess, "Login successful. Redirecting...");
          if (user.role === "admin") {
            window.location.href = "admin-dashboard.php";
          } else {
            window.location.href = "../index.php";
          }
        })
        .catch((err) => showMsg(loginError, err.message || "Login failed"));
    });
  }

  if (signupForm) {
    signupForm.addEventListener("submit", (e) => {
      e.preventDefault();
      hideMsgs();
      const data = new FormData(signupForm);
      const password = data.get("password");
      const confirm = data.get("confirm_password");
      if (password !== confirm) {
        showMsg(signupError, "Passwords do not match.");
        return;
      }

      const payload = {
        action: "signup",
        role: "customer",
        first_name: data.get("first_name"),
        last_name: data.get("last_name"),
        email: data.get("email"),
        phone: data.get("phone"),
        password,
        confirm_password: confirm,
      };

      fetch("../PHP/api-auth.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((res) => res.json().then((body) => [res.ok, body]))
        .then(([ok, body]) => {
          if (!ok || body.error) {
            throw new Error(body.error || "Sign up failed");
          }
          showMsg(signupSuccess, "Account created! Redirecting...");
          setTimeout(() => {
            window.location.href = "../index.php";
          }, 800);
        })
        .catch((err) => showMsg(signupError, err.message || "Sign up failed"));
    });
  }
})();
