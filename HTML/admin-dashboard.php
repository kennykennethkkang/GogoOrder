<?php
require_once __DIR__ . '/../PHP/db.php';
$admin = gogo_require_login('admin');
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gogo Order - Admin Dashboard</title>

    <link rel="stylesheet" href="../base.css">
    <link rel="stylesheet" href="../CSS/admin.css">

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&family=Prata&display=swap"
        rel="stylesheet">
</head>

<body class="admin-body">

    <div id="admin-wrapper">
        <!-- Sidebar -->
        <aside class="admin-sidebar">
            <div class="admin-logo">
                <img src="../img/logo.png" alt="Gogo Order Logo">
            </div>

            <div>
                <div class="admin-nav-section-title">Home</div>
                <nav class="admin-nav">
                    <a href="admin-dashboard.php" class="admin-nav-link active">
                        <i class="fa-solid fa-grid-2"></i> Dashboard
                    </a>
                </nav>
            </div>

            <div>
                <div class="admin-nav-section-title">Pages</div>
                <nav class="admin-nav">
                    <a href="admin-view-orders.php" class="admin-nav-link">
                        <i class="fa-solid fa-receipt"></i> View Orders
                    </a>
                    <a href="admin-menu-list.php" class="admin-nav-link">
                        <i class="fa-solid fa-utensils"></i> Edit Menu
                    </a>
                    <a href="admin-add-admin.php" class="admin-nav-link">
                        <i class="fa-solid fa-user-plus"></i> Add Admin
                    </a>
                </nav>
            </div>
        </aside>

        <!-- Main -->
        <main class="admin-main">
            <header class="admin-header">
                <div class="admin-header-right">
                    <a class="admin-switch" href="../index.php">Customer View</a>
                    <div class="taskbar-user-menu">
                        <?php $adminName = trim(($admin['first_name'] ?? '') . ' ' . ($admin['last_name'] ?? '')); ?>
                        <button class="user-menu-btn" id="user-menu-btn">
                            <?php echo htmlspecialchars($adminName !== '' ? $adminName : 'Admin'); ?>
                            <i class="fa-solid fa-caret-down"></i>
                        </button>
                        <div class="user-menu" id="user-menu" style="display:none;">
                            <button data-open-profile>Account Settings</button>
                            <a data-admin-link href="../index.php" style="display:none;" data-display="block">Customer View</a>
                            <a href="../PHP/logout.php">Logout</a>
                        </div>
                    </div>
                </div>
            </header>

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

            <section class="admin-content">
                <h1 class="admin-page-title">Welcome, Admin <span data-admin-name></span></h1>

                <div class="card-grid">
                    <article class="stat-card">
                        <h3>Pending Orders</h3>
                        <div class="stat-number" id="stat-pending">0</div>
                    </article>

                    <article class="stat-card">
                        <h3>Today's Completed Orders</h3>
                        <div class="stat-number" id="stat-completed-today">0</div>
                        <div class="stat-subtext">Total completed: <span id="stat-completed-total">0</span></div>
                    </article>

                    <article class="stat-card">
                        <h3>Menu Items</h3>
                        <div class="stat-number" id="stat-menu">0</div>
                    </article>
                </div>
            </section>
        </main>
    </div>

    <script src="../JS/admin-auth.js"></script>
    <script src="../JS/admin-dashboard.js"></script>
    <script src="../JS/account.js"></script>
</body>

</html>
