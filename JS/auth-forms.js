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

  const forgotModal = document.getElementById("forgot-password-modal");
  const forgotForm = document.getElementById("forgot-password-form");
  const forgotError = document.getElementById("forgot-error");
  const forgotSuccess = document.getElementById("forgot-success");
  const openForgot = document.getElementById("open-forgot-password");
  const closeForgot = document.getElementById("close-forgot-password");
  const closeForgotLink = document.getElementById("close-forgot-password-link");


  function toggleModal(modal, show) {
    if (!modal) return;
    modal.style.display = show ? "flex" : "none";
  }

  if (openSignup) {
    openSignup.addEventListener("click", (e) => {
      e.preventDefault();
      toggleModal(signupModal, true);
    });
  }
  if (closeSignup) {
    closeSignup.addEventListener("click", (e) => {
      e.preventDefault();
      toggleModal(signupModal, false);
    });
  }
  if (signupModal) {
    signupModal.addEventListener("click", (e) => {
      if (e.target === signupModal) toggleModal(signupModal, false);
    });
  }

  if (openForgot) {
    openForgot.addEventListener("click", (e) => {
      e.preventDefault();
      hideMsgs(loginError, loginSuccess, signupError, signupSuccess, forgotError, forgotSuccess);
      toggleModal(forgotModal, true);
    });
  }
  if (closeForgot) {
    closeForgot.addEventListener("click", (e) => {
      e.preventDefault();
      toggleModal(forgotModal, false);
    });
  }
  if (closeForgotLink) {
    closeForgotLink.addEventListener("click", (e) => {
      e.preventDefault();
      toggleModal(forgotModal, false);
    });
  }
  if (forgotModal) {
    forgotModal.addEventListener("click", (e) => {
      if (e.target === forgotModal) toggleModal(forgotModal, false);
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      hideMsgs(loginError, loginSuccess, signupError, signupSuccess, forgotError, forgotSuccess);
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
          showMsg(loginSuccess, "Login successful. Redirecting...", false);
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
      hideMsgs(loginError, loginSuccess, signupError, signupSuccess, forgotError, forgotSuccess);
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

  if (forgotForm) {
    forgotForm.addEventListener("submit", (e) => {
      e.preventDefault();
      hideMsgs(loginError, loginSuccess, signupError, signupSuccess, forgotError, forgotSuccess);
      const email = document.getElementById("forgot-email")?.value;

      if (!email) {
        showMsg(forgotError, "Email is required.");
        return;
      }

      fetch("../PHP/api-auth.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request-reset",
          email: email,
        }),
      })
        .then((res) => res.json().then((body) => [res.ok, body]))
        .then(([ok, body]) => {
          if (!ok || body.error) {
            throw new Error(body.error || "Failed to send reset link");
          }
          let message = body.message || "Password reset link has been sent.";
          
          // For local dev: show the reset URL
          if (body.reset_url) {
            message += "\n\nReset link (for local development):\n" + body.reset_url;
            showMsg(forgotSuccess, message);
            // Copy to clipboard if possible
            if (navigator.clipboard) {
              navigator.clipboard.writeText(body.reset_url).then(() => {
                console.log("Reset link copied to clipboard");
              });
            }
          } else {
            showMsg(forgotSuccess, message);
          }
          
          // Clear the form
          if (document.getElementById("forgot-email")) {
            document.getElementById("forgot-email").value = "";
          }
        })
        .catch((err) => showMsg(forgotError, err.message || "Failed to send reset link"));
    });
  }
})();
