<?php
// PHP/auth.php
// Lightweight auth helpers for login/signup/logout.

declare(strict_types=1);

require_once __DIR__ . '/db.php';

function gogo_sync_user_json(array $user): void
{
    // keep the json file in sync with what's in sqlite for admins or customers
    $roleFile = $user['role'] === 'admin' ? __DIR__ . '/../JSON/admins.json' : __DIR__ . '/../JSON/costumers.json';
    $data = [];
    if (is_readable($roleFile)) {
        $decoded = json_decode((string) file_get_contents($roleFile), true);
        if (is_array($decoded)) {
            $data = $decoded;
        }
    }

    $maxId = 0;
    foreach ($data as &$row) {
        if (isset($row['id']) && (int) $row['id'] > 0) {
            $maxId = max($maxId, (int) $row['id']);
        }
    }
    unset($row);

    $found = false;
    foreach ($data as &$row) {
        if (isset($row['email']) && strtolower($row['email']) === strtolower($user['email'])) {
            $row['id'] = $user['id'];
            $row['first_name'] = $user['first_name'] ?? '';
            $row['last_name'] = $user['last_name'] ?? '';
            $row['phone'] = $user['phone'] ?? '';
            $found = true;
            break;
        }
    }
    unset($row);

    if (!$found) {
        $data[] = [
            'id' => $user['id'] ?? ($maxId + 1),
            'first_name' => $user['first_name'] ?? '',
            'last_name' => $user['last_name'] ?? '',
            'email' => $user['email'] ?? '',
            'phone' => $user['phone'] ?? '',
        ];
    }

    // Backfill ids
    $maxId = 0;
    foreach ($data as &$row) {
        if (isset($row['id']) && (int) $row['id'] > 0) {
            $maxId = max($maxId, (int) $row['id']);
        }
    }
    unset($row);
    foreach ($data as &$row) {
        if (!isset($row['id']) || (int) $row['id'] === 0) {
            $maxId++;
            $row['id'] = $maxId;
        }
    }
    unset($row);

    file_put_contents($roleFile, json_encode($data, JSON_PRETTY_PRINT));
}

function gogo_register_user(array $data, string $role = 'customer'): array
{
    // handles sign up and drops the new person into the session
    $pdo = gogo_db();
    $email = strtolower(trim($data['email'] ?? ''));
    $password = $data['password'] ?? '';
    $first = trim($data['first_name'] ?? '');
    $last = trim($data['last_name'] ?? '');
    $phone = trim($data['phone'] ?? '');
    $securityQuestion = trim($data['security_question'] ?? '');
    $securityAnswer = trim($data['security_answer'] ?? '');

    if ($email === '' || $password === '') {
        return ['ok' => false, 'message' => 'Email and password are required.'];
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return ['ok' => false, 'message' => 'Email is not valid.'];
    }

    if (strlen($password) < 6) {
        return ['ok' => false, 'message' => 'Password must be at least 6 characters.'];
    }

    if ($securityQuestion === '' || $securityAnswer === '') {
        return ['ok' => false, 'message' => 'Security question and answer are required.'];
    }

    $role = $role === 'admin' ? 'admin' : 'customer';

    $check = $pdo->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
    $check->execute([':email' => $email]);
    if ($check->fetch(PDO::FETCH_ASSOC)) {
        return ['ok' => false, 'message' => 'Account already exists for this email.'];
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $securityAnswerHash = password_hash(strtolower($securityAnswer), PASSWORD_DEFAULT);

    $stmt = $pdo->prepare('
        INSERT INTO users (first_name, last_name, email, phone, password_hash, role, security_question, security_answer_hash)
        VALUES (:first, :last, :email, :phone, :pass, :role, :security_q, :security_a)
    ');

    $stmt->execute([
        ':first' => $first,
        ':last' => $last,
        ':email' => $email,
        ':phone' => $phone,
        ':pass' => $hash,
        ':role' => $role,
        ':security_q' => $securityQuestion,
        ':security_a' => $securityAnswerHash,
    ]);

    $id = (int) $pdo->lastInsertId();
    gogo_store_credentials($pdo, $id, $email, $hash, $role);
    $_SESSION['user_id'] = $id;

    $userData = gogo_current_user();
    if ($userData) {
        gogo_sync_user_json($userData);
    }

    return ['ok' => true, 'user' => $userData];
}

function gogo_login_user(string $email, string $password, ?string $expectedRole = null): array
{
    // simple login: check email/password hash and set session
    $pdo = gogo_db();
    $email = strtolower(trim($email));

    $stmt = $pdo->prepare('
        SELECT u.*, c.password_hash
        FROM auth_credentials c
        JOIN users u ON u.id = c.user_id
        WHERE lower(c.username) = :email
        LIMIT 1
    ');
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        // Fallback for legacy rows without credentials entry.
        $fallback = $pdo->prepare('SELECT * FROM users WHERE email = :email LIMIT 1');
        $fallback->execute([':email' => $email]);
        $user = $fallback->fetch(PDO::FETCH_ASSOC);
    }

    if (!$user || !password_verify($password, $user['password_hash'])) {
        return ['ok' => false, 'message' => 'Invalid email or password.'];
    }

    // Backfill credentials row for any legacy account.
    gogo_store_credentials($pdo, (int) $user['id'], $email, $user['password_hash'], $user['role'] ?? 'customer');

    if ($expectedRole !== null && $user['role'] !== $expectedRole) {
        return ['ok' => false, 'message' => 'You do not have access to this area.'];
    }

    $_SESSION['user_id'] = (int) $user['id'];

    return ['ok' => true, 'user' => gogo_current_user()];
}

function gogo_assert_admin(): array
{
    // quick helper to force admin-only routes
    return gogo_require_login('admin');
}

function gogo_request_password_reset(string $email): array
{
    $pdo = gogo_db();
    $email = strtolower(trim($email));

    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return ['ok' => false, 'message' => 'Valid email is required.'];
    }

    // Find user by email
    $stmt = $pdo->prepare('SELECT id, email, first_name FROM users WHERE email = :email LIMIT 1');
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // Always return success to prevent email enumeration
    if (!$user) {
        return ['ok' => true, 'message' => 'If an account exists with that email, a password reset link has been generated.'];
    }

    // Invalidate any existing tokens for this user
    $pdo->prepare('UPDATE password_reset_tokens SET used = 1 WHERE user_id = :uid AND used = 0')->execute([':uid' => (int) $user['id']]);

    // Generate secure token
    $token = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', time() + 3600); // 1 hour from now

    // Store token
    $stmt = $pdo->prepare('
        INSERT INTO password_reset_tokens (user_id, token, expires_at)
        VALUES (:uid, :token, :expires)
    ');
    $stmt->execute([
        ':uid' => (int) $user['id'],
        ':token' => $token,
        ':expires' => $expiresAt,
    ]);

    // Generate the reset link
    $resetUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http')
        . '://' . $_SERVER['HTTP_HOST']
        . dirname($_SERVER['PHP_SELF'])
        . '/HTML/reset-password.php?token=' . $token;

    return [
        'ok' => true,
        'message' => 'Password reset link has been generated.',
        'reset_url' => $resetUrl,
    ];
}

function gogo_reset_password(string $token, string $newPassword): array
{
    $pdo = gogo_db();
    $token = trim($token);
    $newPassword = trim($newPassword);

    if ($token === '' || $newPassword === '') {
        return ['ok' => false, 'message' => 'Token and password are required.'];
    }

    if (strlen($newPassword) < 6) {
        return ['ok' => false, 'message' => 'Password must be at least 6 characters.'];
    }

    // Find valid token
    $stmt = $pdo->prepare('
        SELECT prt.*, u.id as user_id, u.email
        FROM password_reset_tokens prt
        JOIN users u ON u.id = prt.user_id
        WHERE prt.token = :token
        AND prt.used = 0
        AND datetime(prt.expires_at) > datetime("now")
        LIMIT 1
    ');
    $stmt->execute([':token' => $token]);
    $tokenData = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$tokenData) {
        return ['ok' => false, 'message' => 'Invalid or expired reset token.'];
    }

    $userId = (int) $tokenData['user_id'];
    $newHash = password_hash($newPassword, PASSWORD_DEFAULT);

    // Update password in users table
    $stmt = $pdo->prepare('UPDATE users SET password_hash = :hash WHERE id = :uid');
    $stmt->execute([':hash' => $newHash, ':uid' => $userId]);

    // Update password in auth_credentials table
    $stmt = $pdo->prepare('
        UPDATE auth_credentials
        SET password_hash = :hash
        WHERE user_id = :uid
    ');
    $stmt->execute([':hash' => $newHash, ':uid' => $userId]);

    // Mark token as used
    $stmt = $pdo->prepare('UPDATE password_reset_tokens SET used = 1 WHERE token = :token');
    $stmt->execute([':token' => $token]);

    // Invalidate all other tokens for this user
    $stmt = $pdo->prepare('UPDATE password_reset_tokens SET used = 1 WHERE user_id = :uid AND token != :token');
    $stmt->execute([':uid' => $userId, ':token' => $token]);

    return ['ok' => true, 'message' => 'Password has been reset successfully.'];
}

function gogo_get_security_question(string $email): array
{
    $pdo = gogo_db();
    $email = strtolower(trim($email));

    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return ['ok' => false, 'message' => 'Valid email is required.'];
    }

    // Find user by email
    $stmt = $pdo->prepare('SELECT security_question FROM users WHERE email = :email LIMIT 1');
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // Check if account exists
    if (!$user) {
        return ['ok' => false, 'message' => 'Account does not exist with this email.'];
    }

    // Check if security question is set
    if (empty($user['security_question'])) {
        return ['ok' => false, 'message' => 'No security question found for this account. Please contact support.'];
    }

    return ['ok' => true, 'security_question' => $user['security_question']];
}

function gogo_reset_password_by_email(string $email, string $securityAnswer, string $newPassword): array
{
    $pdo = gogo_db();
    $email = strtolower(trim($email));
    $securityAnswer = trim($securityAnswer);
    $newPassword = trim($newPassword);

    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return ['ok' => false, 'message' => 'Valid email is required.'];
    }

    if ($securityAnswer === '') {
        return ['ok' => false, 'message' => 'Security answer is required.'];
    }

    if ($newPassword === '') {
        return ['ok' => false, 'message' => 'Password is required.'];
    }

    if (strlen($newPassword) < 6) {
        return ['ok' => false, 'message' => 'Password must be at least 6 characters.'];
    }

    // Find user by email
    $stmt = $pdo->prepare('SELECT id, role, security_question, security_answer_hash FROM users WHERE email = :email LIMIT 1');
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // Always return success to prevent email enumeration
    if (!$user) {
        return ['ok' => true, 'message' => 'Password reset completed.'];
    }

    // Verify security answer
    if (empty($user['security_answer_hash']) || !password_verify(strtolower($securityAnswer), $user['security_answer_hash'])) {
        return ['ok' => false, 'message' => 'Incorrect security answer.'];
    }

    $userId = (int) $user['id'];
    $role = $user['role'] ?? 'customer';
    $newHash = password_hash($newPassword, PASSWORD_DEFAULT);

    // Update password in users table
    $stmt = $pdo->prepare('UPDATE users SET password_hash = :hash WHERE id = :uid');
    $stmt->execute([':hash' => $newHash, ':uid' => $userId]);

    // Update or insert password in auth_credentials table using the helper function
    // This ensures the row exists and is properly synced (uses INSERT ... ON CONFLICT)
    gogo_store_credentials($pdo, $userId, $email, $newHash, $role);

    return ['ok' => true, 'message' => 'Your password has been reset successfully. You can now sign in with your new password.'];
}

function gogo_verify_reset_token(string $token): array
{
    $pdo = gogo_db();
    $token = trim($token);

    if ($token === '') {
        return ['ok' => false, 'message' => 'Token is required.'];
    }

    $stmt = $pdo->prepare('
        SELECT prt.*, u.email
        FROM password_reset_tokens prt
        JOIN users u ON u.id = prt.user_id
        WHERE prt.token = :token
        AND prt.used = 0
        AND datetime(prt.expires_at) > datetime("now")
        LIMIT 1
    ');
    $stmt->execute([':token' => $token]);
    $tokenData = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$tokenData) {
        return ['ok' => false, 'message' => 'Invalid or expired reset token.'];
    }

    return ['ok' => true, 'email' => $tokenData['email']];
}
