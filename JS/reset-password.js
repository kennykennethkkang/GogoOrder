// JS/reset-password.js
// Handle password reset form submission and new reset request.

(function () {
  // grab reset form pieces
  const resetForm = document.getElementById("reset-password-form");
  const resetError = document.getElementById("reset-error");
  const resetSuccess = document.getElementById("reset-success");
  const requestNewReset = document.getElementById("request-new-reset");

  if (resetForm) {
    resetForm.addEventListener("submit", (e) => {
      e.preventDefault();
      hideMsgs(resetError, resetSuccess);

      // collect fields from the form
      const token = document.getElementById("reset-token")?.value;
      const password = document.getElementById("new-password")?.value;
      const confirmPassword = document.getElementById("confirm-new-password")?.value;

      if (!token) {
        showMsg(resetError, "Invalid reset token.");
        return;
      }

      if (password !== confirmPassword) {
        showMsg(resetError, "Passwords do not match.");
        return;
      }

      if (password.length < 6) {
        showMsg(resetError, "Password must be at least 6 characters.");
        return;
      }

      fetch("../PHP/api-auth.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset-password",
          token: token,
          password: password,
        }),
      })
        .then((res) => res.json().then((body) => [res.ok, body]))
        .then(([ok, body]) => {
          if (!ok || body.error) {
            throw new Error(body.error || "Password reset failed");
          }
          showMsg(resetSuccess, "Password reset successfully! Redirecting to login...");
          setTimeout(() => {
            window.location.href = "login.php";
          }, 2000);
        })
        .catch((err) => showMsg(resetError, err.message || "Password reset failed"));
    });
  }

  if (requestNewReset) {
    requestNewReset.addEventListener("click", (e) => {
      e.preventDefault();
      const email = prompt("Enter your email address:");
      if (!email) return;

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
            alert(body.error || "Failed to generate reset link");
            return;
          }
          if (body.reset_url) {
            alert("Password reset link:\n\n" + body.reset_url);
          } else {
            alert(body.message || "Password reset link has been generated.");
          }
        })
        .catch((err) => alert(err.message || "Failed to generate reset link"));
    });
  }
})();
