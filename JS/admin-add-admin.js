// JS/admin-add-admin.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("add-admin-form");
  const msg = document.getElementById("add-admin-msg");
  const err = document.getElementById("add-admin-err");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (msg) msg.style.display = "none";
    if (err) err.style.display = "none";

    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());

    fetch("../PHP/api-admins.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((body) => {
        if (body.error) throw new Error(body.error);
        if (msg) {
          msg.textContent = `Admin created. Temporary password: ${body.generated_password}`;
          msg.style.display = "block";
        } else {
          alert("Admin created. Temporary password: " + body.generated_password);
        }
        form.reset();
      })
      .catch((e) => {
        if (err) {
          err.textContent = e.message || "Failed to create admin";
          err.style.display = "block";
        } else {
          alert(e.message || "Failed to create admin");
        }
      });
  });
});
