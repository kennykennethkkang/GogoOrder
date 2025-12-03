<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Gogo Order – All Pages</title>
    <link rel="stylesheet" href="../base.css">
    <style>
        body {
            font-family: "Poppins", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            background: #f4f6fb;
            margin: 0;
            padding: 40px 24px;
        }

        h1 {
            font-size: 28px;
            margin-bottom: 12px;
            color: #1e3a5f;
        }

        p {
            color: #666;
            margin-bottom: 24px;
        }

        ul {
            list-style: none;
            padding-left: 0;
            max-width: 480px;
        }

        li {
            margin-bottom: 10px;
        }

        a {
            text-decoration: none;
            color: #ff7b29;
            font-weight: 500;
        }

        a:hover {
            text-decoration: underline;
        }

        .category {
            margin-top: 24px;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            color: #9b9b9b;
        }
    </style>
</head>

<body>
    <h1>Gogo Order – All Pages</h1>
    <p>Use this page while developing to quickly open any screen.</p>

    <div class="category">Customer</div>
    <ul>
        <li><a href="../index.php" target="_blank">Main Menu (index.php)</a></li>
        <li><a href="login.php" target="_blank">Login / Sign Up</a></li>
        <li><a href="cart.php" target="_blank">Cart</a></li>
        <li><a href="view-order.php" target="_blank">View Order</a></li>
    </ul>

    <div class="category">Admin</div>
    <ul>
        <li><a href="admin-auth.php" target="_blank">Admin Login / Sign Up</a></li>
        <li><a href="admin-dashboard.php" target="_blank">Admin Dashboard</a></li>
        <li><a href="admin-view-orders.php" target="_blank">Admin – View Orders</a></li>
        <li><a href="admin-menu-list.php" target="_blank">Admin – Edit Menu List</a></li>
        <li><a href="admin-menu-add.php" target="_blank">Admin – Add Menu Item</a></li>
        <li><a href="admin-menu-edit.php?id=1" target="_blank">Admin – Edit Menu Item (example id=1)</a></li>
    </ul>

</body>

</html>
