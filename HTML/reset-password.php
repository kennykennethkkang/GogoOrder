<?php
require_once __DIR__ . '/../PHP/auth.php';
if (gogo_current_user()) {
    header('Location: ../index.php');
    exit;
}

$token = $_GET['token'] ?? '';
$tokenValid = false;
$email = '';

if ($token) {
    $result = gogo_verify_reset_token($token);
    if ($result['ok']) {
        $tokenValid = true;
        $email = $result['email'] ?? '';
    }
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gogo Order - Reset Password</title>
    <link rel="stylesheet" href="../CSS/auth.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Prata&family=Poppins:wght@300;400;500;600&display=swap"
        rel="stylesheet">
</head>

<body class="auth-body">
    <div class="auth-wrapper">
        <div class="auth-logo">
            <img src="../img/logo.png" alt="Gogo Order">
            <span>Reset Password</span>
        </div>
        <div class="auth-grid">
            <div class="auth-card">
                <?php if (!$token): ?>
                    <h2 class="auth-title">Invalid Link</h2>
                    <p class="auth-subtitle">No reset token provided.</p>
                    <div class="auth-footer">
                        <a href="login.php">Back to Login</a>
                    </div>
                <?php elseif (!$tokenValid): ?>
                    <h2 class="auth-title">Invalid or Expired Link</h2>
                    <p class="auth-subtitle">This password reset link is invalid or has expired.</p>
                    <div id="reset-error" class="auth-error" style="display:none;"></div>
                    <div class="auth-footer">
                        <a href="login.php">Back to Login</a>
                        <a href="#" id="request-new-reset">Request New Reset Link</a>
                    </div>
                <?php else: ?>
                    <h2 class="auth-title">Reset Your Password</h2>
                    <p class="auth-subtitle">Enter your new password below.</p>
                    <div id="reset-error" class="auth-error" style="display:none;"></div>
                    <div id="reset-success" class="auth-success" style="display:none;"></div>
                    <form class="auth-form" id="reset-password-form">
                        <input type="hidden" id="reset-token" value="<?php echo htmlspecialchars($token); ?>">
                        <div>
                            <label for="reset-email">Email</label>
                            <input id="reset-email" type="email" value="<?php echo htmlspecialchars($email); ?>" readonly disabled>
                        </div>
                        <div>
                            <label for="new-password">New Password <span class="required-star">*</span></label>
                            <input id="new-password" name="password" type="password" placeholder="Enter new password" required minlength="6">
                        </div>
                        <div>
                            <label for="confirm-new-password">Confirm New Password <span class="required-star">*</span></label>
                            <input id="confirm-new-password" name="confirm_password" type="password" placeholder="Confirm new password" required minlength="6">
                        </div>
                        <button class="auth-btn" type="submit">Reset Password</button>
                        <div class="auth-footer">
                            <a href="login.php">Back to Login</a>
                        </div>
                    </form>
                <?php endif; ?>
            </div>
        </div>
    </div>
    <script src="../JS/utils.js"></script>
    <script src="../JS/reset-password.js"></script>
</body>

</html>

