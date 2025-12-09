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

  // Helper function to reset forgot password form
  function resetForgotPasswordForm() {
    const questionContainer = document.getElementById("security-question-container");
    const answerContainer = document.getElementById("security-answer-container");
    const passwordContainer = document.getElementById("password-fields-container");
    const submitBtn = document.getElementById("forgot-submit-btn");
    const checkEmailBtn = document.getElementById("forgot-check-email-btn");
    
    if (questionContainer) questionContainer.style.display = "none";
    if (answerContainer) answerContainer.style.display = "none";
    if (passwordContainer) passwordContainer.style.display = "none";
    if (submitBtn) submitBtn.style.display = "none";
    if (checkEmailBtn) checkEmailBtn.style.display = "block";
    
    // Clear form fields
    const emailField = document.getElementById("forgot-email");
    const answerField = document.getElementById("forgot-security-answer");
    const passwordField = document.getElementById("forgot-password");
    const confirmPasswordField = document.getElementById("forgot-confirm-password");
    
    if (emailField) emailField.value = "";
    if (answerField) answerField.value = "";
    if (passwordField) passwordField.value = "";
    if (confirmPasswordField) confirmPasswordField.value = "";
  }

  if (openForgot) {
    openForgot.addEventListener("click", (e) => {
      e.preventDefault();
      hideMsgs(loginError, loginSuccess, signupError, signupSuccess, forgotError, forgotSuccess);
      resetForgotPasswordForm();
      toggleModal(forgotModal, true);
    });
  }
  if (closeForgot) {
    closeForgot.addEventListener("click", (e) => {
      e.preventDefault();
      resetForgotPasswordForm();
      toggleModal(forgotModal, false);
    });
  }
  if (closeForgotLink) {
    closeForgotLink.addEventListener("click", (e) => {
      e.preventDefault();
      resetForgotPasswordForm();
      toggleModal(forgotModal, false);
    });
  }
  if (forgotModal) {
    forgotModal.addEventListener("click", (e) => {
      if (e.target === forgotModal) {
        resetForgotPasswordForm();
        toggleModal(forgotModal, false);
      }
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

      const securityQuestion = data.get("security_question");
      const securityAnswer = data.get("security_answer");
      
      if (!securityQuestion || !securityAnswer) {
        showMsg(signupError, "Security question and answer are required.");
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
        security_question: securityQuestion,
        security_answer: securityAnswer,
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

  // Handle "Check Email" button click
  const checkEmailBtn = document.getElementById("forgot-check-email-btn");
  if (checkEmailBtn) {
    checkEmailBtn.addEventListener("click", (e) => {
      e.preventDefault();
      hideMsgs(loginError, loginSuccess, signupError, signupSuccess, forgotError, forgotSuccess);
      const email = document.getElementById("forgot-email")?.value;

      if (!email) {
        showMsg(forgotError, "Email is required.");
        return;
      }

      // Get security question for this email
      fetch(`../PHP/api-auth.php?action=get-security-question&email=${encodeURIComponent(email)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })
        .then((res) => res.json().then((body) => [res.ok, body]))
        .then(([ok, body]) => {
          if (!ok || body.error) {
            // Show error message (e.g., "Account does not exist with this email")
            showMsg(forgotError, body.error || body.message || "Failed to get security question");
            return;
          }
          
          if (!body.security_question) {
            showMsg(forgotError, "No security question found for this account.");
            return;
          }
          
          // Show security question and answer field
          const questionDisplay = document.getElementById("forgot-security-question-display");
          const questionContainer = document.getElementById("security-question-container");
          const answerContainer = document.getElementById("security-answer-container");
          const passwordContainer = document.getElementById("password-fields-container");
          const submitBtn = document.getElementById("forgot-submit-btn");
          
          if (questionDisplay && questionContainer && answerContainer && passwordContainer && submitBtn) {
            questionDisplay.value = body.security_question || "";
            questionContainer.style.display = "block";
            answerContainer.style.display = "block";
            passwordContainer.style.display = "block";
            checkEmailBtn.style.display = "none";
            submitBtn.style.display = "block";
          }
        })
        .catch((err) => showMsg(forgotError, err.message || "Failed to get security question"));
    });
  }

  if (forgotForm) {
    forgotForm.addEventListener("submit", (e) => {
      e.preventDefault();
      hideMsgs(loginError, loginSuccess, signupError, signupSuccess, forgotError, forgotSuccess);
      const email = document.getElementById("forgot-email")?.value;
      const securityAnswer = document.getElementById("forgot-security-answer")?.value;
      const password = document.getElementById("forgot-password")?.value;
      const confirmPassword = document.getElementById("forgot-confirm-password")?.value;

      if (!email) {
        showMsg(forgotError, "Email is required.");
        return;
      }

      if (!securityAnswer) {
        showMsg(forgotError, "Security answer is required.");
        return;
      }

      if (!password) {
        showMsg(forgotError, "Password is required.");
        return;
      }

      if (password !== confirmPassword) {
        showMsg(forgotError, "Passwords do not match.");
        return;
      }

      if (password.length < 6) {
        showMsg(forgotError, "Password must be at least 6 characters.");
        return;
      }

      fetch("../PHP/api-auth.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset-by-email",
          email: email,
          security_answer: securityAnswer,
          password: password,
        }),
      })
        .then((res) => res.json().then((body) => [res.ok, body]))
        .then(([ok, body]) => {
          if (!ok || body.error) {
            throw new Error(body.error || "Failed to reset password");
          }
          
          // Use explicit message that doesn't mention links
          const successMessage = body.message && !body.message.toLowerCase().includes('link') 
            ? body.message 
            : "Password has been reset successfully!";
          showMsg(forgotSuccess, successMessage);
          
          // Clear the form
          if (document.getElementById("forgot-email")) {
            document.getElementById("forgot-email").value = "";
          }
          if (document.getElementById("forgot-security-answer")) {
            document.getElementById("forgot-security-answer").value = "";
          }
          if (document.getElementById("forgot-password")) {
            document.getElementById("forgot-password").value = "";
          }
          if (document.getElementById("forgot-confirm-password")) {
            document.getElementById("forgot-confirm-password").value = "";
          }

          // Reset form visibility
          const questionContainer = document.getElementById("security-question-container");
          const answerContainer = document.getElementById("security-answer-container");
          const passwordContainer = document.getElementById("password-fields-container");
          const submitBtn = document.getElementById("forgot-submit-btn");
          if (questionContainer && answerContainer && passwordContainer && submitBtn && checkEmailBtn) {
            questionContainer.style.display = "none";
            answerContainer.style.display = "none";
            passwordContainer.style.display = "none";
            submitBtn.style.display = "none";
            checkEmailBtn.style.display = "block";
          }

          // Close modal after a short delay
          setTimeout(() => {
            toggleModal(forgotModal, false);
          }, 2000);
        })
        .catch((err) => showMsg(forgotError, err.message || "Failed to reset password"));
    });
  }
})();
