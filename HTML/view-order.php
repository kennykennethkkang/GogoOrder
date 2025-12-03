<?php
require_once __DIR__ . '/../PHP/db.php';
$user = gogo_require_login();
$fullName = trim(($user['first_name'] ?? '') . ' ' . ($user['last_name'] ?? ''));
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gogo Order - Orders</title>
    <link rel="stylesheet" href="../base.css">
    <link rel="stylesheet" href="../CSS/customer-pages.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Prata&family=Poppins:wght@300;400;500;600&display=swap"
        rel="stylesheet">
</head>

<body class="page-body">
    <div class="global-taskbar">
        <div class="taskbar-left">
            <a class="taskbar-logo-link" href="../index.php">
                <img src="../img/logo.png" class="taskbar-logo" alt="Gogo Order">
                <span class="taskbar-title">Gogo Order</span>
            </a>
        </div>
        <div class="taskbar-center">
            <a class="taskbar-link" href="../index.php">Home</a>
            <a class="taskbar-link" href="cart.php">Cart</a>
            <a class="taskbar-link" href="view-order.php">Orders</a>
        </div>
        <div class="taskbar-right">
            <div class="taskbar-user-menu">
                <button class="user-menu-btn" id="user-menu-btn">
                    <?php echo htmlspecialchars($fullName ?: 'Account'); ?>
                    <i class="fa-solid fa-caret-down"></i>
                </button>
                <div class="user-menu" id="user-menu" style="display:none;">
                    <button data-open-profile>Account Settings</button>
                    <a data-admin-link href="admin-dashboard.php" style="display:none;">Go to Admin</a>
                    <a href="../PHP/logout.php">Logout</a>
                </div>
            </div>
        </div>
    </div>

    <div class="page-container">
        <div id="account-modal" class="account-modal">
            <div class="account-modal-content">
                <button class="account-close" data-close-account-modal>&times;</button>
                <h3 id="account-modal-title">Account Settings</h3>
                <p>Update your profile and password.</p>
                <form id="account-form" class="account-form">
                    <div class="auth-two-col">
                        <div>
                            <label>First name</label>
                            <input type="text" name="first_name" placeholder="First name" required>
                        </div>
                        <div>
                            <label>Last name</label>
                            <input type="text" name="last_name" placeholder="Last name" required>
                        </div>
                    </div>
                    <div>
                        <label>Phone</label>
                        <input type="text" name="phone" placeholder="Phone">
                    </div>
                    <div>
                        <label>New password (optional)</label>
                        <input type="password" name="password" placeholder="New password">
                    </div>
                    <button type="submit">Save</button>
                </form>
            </div>
        </div>
        <main class="page-main">
            <h1 class="page-title">Your Orders</h1>
            <div class="content-card">
                <div data-order-list>
                    <!-- filled by JS -->
                </div>
            </div>
        </main>
    </div>

    <script src="../JS/topbar.js"></script>
    <script src="../JS/account.js"></script>
    <script src="../JS/global-sidebar.js"></script>
    <script src="../JS/customer-orders.js"></script>
</body>

</html>
