<?php
require_once __DIR__ . '/PHP/db.php';
$user = gogo_require_login();
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gogo Order</title>
    <link rel="stylesheet" href="base.css">
    <link rel="stylesheet" href="index.css">
    <link rel="stylesheet" href="itemModal.css">

    <!-- Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Prata&display=swap" rel="stylesheet">
</head>

<body>

    <div class="global-taskbar">
        <div class="taskbar-left">
            <a class="taskbar-logo-link" href="index.php">
                <img src="img/logo.png" class="taskbar-logo" alt="Gogo Order">
                <span class="taskbar-title">Gogo Order</span>
            </a>
        </div>
        <div class="taskbar-center">
            <a class="taskbar-link" href="index.php">Home</a>
            <a class="taskbar-link" href="HTML/cart.php">Cart</a>
            <a class="taskbar-link" href="HTML/view-order.php">Orders</a>
        </div>
        <div class="taskbar-right">
            <div class="taskbar-user-menu">
                <button class="user-menu-btn" id="user-menu-btn">
                    <?php echo htmlspecialchars(trim(($user['first_name'] ?? '') . ' ' . ($user['last_name'] ?? ''))) ?: 'Account'; ?>
                    <i class="fa-solid fa-caret-down"></i>
                </button>
                <div class="user-menu" id="user-menu" style="display:none;">
                    <button data-open-profile>Account Settings</button>
                    <a data-admin-link href="HTML/admin-dashboard.php" style="display:none;">Go to Admin</a>
                    <a href="PHP/logout.php">Logout</a>
                </div>
            </div>
        </div>
    </div>

    <div class="container">

        <!-- Main Content -->
        <main class="main">
            <?php include __DIR__ . '/HTML/account-modal.html'; ?>

            <!-- Hero -->
            <section class="hero">
                <div class="hero-banner">
                    <img src="img/Banner.png" alt="Banner">
                    <div class="hero-content">
                        <p class="hero-label">Deal of the weekend</p>
                        <h2>Hello, <?php echo htmlspecialchars($user['first_name'] ?? ''); ?></h2>
                        <p>Get <span class="blue">FREE delivery</span> on every weekend</p>
                        <button class="hero-btn" onclick="document.querySelector('.categories').scrollIntoView({behavior:'smooth'})">Check Menu</button>
                    </div>
                </div>
                <div class="hero-promo">
                    <img src="img/Food/Entree/Burger.png" alt="Burger">
                    <h1>50% off</h1>
                    <p>The full price of burgers</p>
                </div>
            </section>

            <!-- Menu Categories -->
            <section class="categories">
                <div class="search-bar">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input id="menu-search" type="text" placeholder="Search...">
                </div>
                <div class="section-title">
                    <h3>Menu category</h3>
                    <a href="#menu" id="view-all-btn">View All <i class="fa-solid fa-arrow-right"></i></a>
                </div>

                <div class="category-list">
                    <!-- Filled by JS -->
                </div>
            </section>

            <!-- Menu Items -->
            <section id="menu" class="menu-items">
                <!-- Filled by JS -->
            </section>
        </main>

        <!-- Cart -->
        <aside class="cart">
            <h3>My Cart</h3>

            <div data-empty-cart class="muted" style="display:none;">Your cart is empty.</div>
            <div class="cart-items"></div>

            <div class="cart-summary">
                <div class="cart-total-row">
                    <span>Subtotal</span>
                    <strong data-cart-total>$0.00</strong>
                </div>
                <button class="checkout-btn">Checkout</button>
            </div>
        </aside>

    </div>

    <!-- Item Modal -->
    <div class="item-modal" id="item-modal">
        <div class="modal-content">
            <button class="modal-close" id="modal-close">
                <i class="fa-solid fa-times"></i>
            </button>
            <div id="modal-item-details">
                <!-- Modal content will be filled by JS -->
            </div>
        </div>
    </div>

    <script src="JS/utils.js"></script>
    <script src="JS/topbar.js"></script>
    <script src="JS/account.js"></script>
    <script src="JS/client-app.js"></script>
</body>

</html>
