<?php
// Include database connection and necessary classes
include_once 'config/database.php';
include_once 'classes/Cls_usuario.php';
include_once 'classes/Cls_producto.php';
include_once 'classes/Cls_pedido.php';

// Start session to manage cart and user state
session_start();

// Check if user is logged in
$loggedIn = isset($_SESSION['usuario_id']);

// Redirect to login if not logged in
if (!$loggedIn) {
    header('Location: login.php?redirect=pago.php');
    exit();
}

// Initialize classes
$usuario = new Cls_usuario();
$producto = new Cls_producto();
$pedido = new Cls_pedido();

// Get user information
$user = $usuario->getUserById($_SESSION['usuario_id']);

// Get cart items from session
$cart = isset($_SESSION['cart']) ? $_SESSION['cart'] : [];

// Check if cart is empty
if (empty($cart)) {
    header('Location: carrito.php');
    exit();
}

// Calculate cart totals
$subtotal = 0;
foreach($cart as $item) {
    $subtotal += $item['price'] * $item['quantity'];
}

// Calculate shipping (free over $100)
$shipping = $subtotal > 100 ? 0 : 9.99;

// Calculate tax (8%)
$tax = $subtotal * 0.08;

// Calculate total
$total = $subtotal + $shipping + $tax;

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Process payment and create order
    // In a real application, you would integrate with PayPal API here
    
    // Create new order
    $orderData = [
        'usuario_id' => $_SESSION['usuario_id'],
        'total' => $total,
        'shipping_address' => $_POST['address'],
        'payment_method' => 'PayPal',
        'status' => 'pending'
    ];
    
    $orderId = $pedido->createPedido($orderData);
    
    // Add order items
    foreach($cart as $item) {
        $pedido->addDetallePedido([
            'pedido_id' => $orderId,
            'producto_id' => $item['id'],
            'cantidad' => $item['quantity'],
            'precio' => $item['price'],
            'subtotal' => $item['price'] * $item['quantity']
        ]);
    }
    
    // Clear cart
    $_SESSION['cart'] = [];
    
    // Redirect to thank you page
    header('Location: gracias.php?order_id=' . $orderId);
    exit();
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Checkout | Ricwer</title>
    <link rel="stylesheet" href="public/css/index.css">
    <link rel="stylesheet" href="public/css/pago.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <!-- Loader -->
    <div id="loader-wrapper">
        <div class="loader"></div>
        <div class="loader-logo">
            <img src="/api/placeholder/200/200" alt="Ricwer Logo">
        </div>
    </div>

    <!-- Header -->
    <header>
        <div class="top-nav">
            <div class="container">
                <div class="nav-left">
                    <a href="#" class="nav-link">Help</a>
                    <a href="#" class="nav-link">Order Tracker</a>
                    <a href="#" class="nav-link">Newsletter</a>
                </div>
                <div class="nav-right">
                    <?php if($loggedIn): ?>
                        <a href="profile.php" class="nav-link">My Account</a>
                        <a href="logout.php" class="nav-link">Logout</a>
                    <?php else: ?>
                        <a href="login.php" class="nav-link">Login</a>
                        <a href="registro.php" class="nav-link">Register</a>
                    <?php endif; ?>
                </div>
            </div>
        </div>
        <div class="main-nav">
            <div class="container">
                <div class="logo">
                    <a href="index.php">
                        <img src="/api/placeholder/150/50" alt="Ricwer">
                    </a>
                </div>
                <nav>
                    <ul class="menu">
                        <li><a href="#">Men</a></li>
                        <li><a href="#">Women</a></li>
                        <li><a href="calzado_hombre.php">Men's Footwear</a></li>
                        <li><a href="#">Accessories</a></li>
                        <li><a href="#">Sale</a></li>
                    </ul>
                </nav>
                <div class="nav-icons">
                    <a href="#" class="icon"><i class="fas fa-search"></i></a>
                    <a href="#" class="icon"><i class="fas fa-user"></i></a>
                    <a href="carrito.php" class="icon"><i class="fas fa-shopping-cart"></i><span class="cart-count"><?php echo count($cart); ?></span></a>
                </div>
                <div class="mobile-toggle">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </div>
    </header>

    <!-- Page Banner -->
    <section class="page-banner">
        <div class="container">
            <h1>Checkout</h1>
            <nav class="breadcrumb">
                <a href="index.php">Home</a> / 
                <a href="carrito.php">Cart</a> / 
                <span>Checkout</span>
            </nav>
        </div>
    </section>

    <!-- Checkout Section -->
    <section class="checkout-section">
        <div class="container">
            <div class="checkout-process">
                <div class="process-step completed">
                    <div class="step-number">1</div>
                    <div class="step-text">Shopping Cart</div>
                </div>
                <div class="process-step active">
                    <div class="step-number">2</div>
                    <div class="step-text">Payment</div>
                </div>
                <div class="process-step">
                    <div class="step-number">3</div>
                    <div class="step-text">Confirmation</div>
                </div>
            </div>

            <div class="checkout-content">
                <div class="checkout-form">
                    <h2>Shipping Details</h2>
                    <form id="payment-form" method="post">
                        <div class="form-group">
                            <label for="fullname">Full Name</label>
                            <input type="text" id="fullname" name="fullname" value="<?php echo $user['nombreUsuario'] . ' ' . $user['apellidoUsuario']; ?>" required>
                        </div>
                        <div class="form-group">
                            <label for="email">Email Address</label>
                            <input type="email" id="email" name="email" value="<?php echo $user['correoUsuario']; ?>" required>
                        </div>
                        <div class="form-group">
                            <label for="phone">Phone Number</label>
                            <input type="tel" id="phone" name="phone" value="<?php echo $user['telefonoUsuario']; ?>" required>
                        </div>
                        <div class="form-group">
                            <label for="address">Shipping Address</label>
                            <input type="text" id="address" name="address" value="<?php echo $user['direccionUsuario']; ?>" required>
                        </div>
                        <div class="form-row">
                            <div class="form-group half">
                                <label for="city">City</label>
                                <input type="text" id="city" name="city" required>
                            </div>
                            <div class="form-group half">
                                <label for="zip">Postal Code</label>
                                <input type="text" id="zip" name="zip" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="country">Country</label>
                            <select id="country" name="country" required>
                                <option value="">Select Country</option>
                                <option value="US">United States</option>
                                <option value="CA">Canada</option>
                                <option value="MX">Mexico</option>
                                <option value="UK">United Kingdom</option>
                                <option value="AU">Australia</option>
                                <option value="FR">France</option>
                                <option value="DE">Germany</option>
                            </select>
                        </div>

                        <h2>Payment Method</h2>
                        <div class="payment-options">
                            <div class="payment-option active">
                                <input type="radio" id="paypal" name="payment_method" value="paypal" checked>
                                <label for="paypal">
                                    <img src="/api/placeholder/100/40" alt="PayPal">
                                    <span>PayPal</span>
                                </label>
                            </div>
                            <div class="payment-option disabled">
                                <input type="radio" id="credit-card" name="payment_method" value="credit-card" disabled>
                                <label for="credit-card">
                                    <img src="/api/placeholder/100/40" alt="Credit Card">
                                    <span>Credit Card (Coming Soon)</span>
                                </label>
                            </div>
                        </div>

                        <!-- PayPal Information -->
                        <div id="paypal-info" class="payment-info active">
                            <p>You'll be redirected to PayPal to complete your payment.</p>
                            <img src="/api/placeholder/200/50" alt="PayPal Secure" class="payment-logo">
                        </div>

                        <button type="submit" class="btn btn-primary btn-large">Continue to PayPal</button>
                    </form>
                </div>

                <div class="order-summary">
                    <h2>Order Summary</h2>
                    <div class="order-items">
                        <?php foreach($cart as $item): ?>
                        <div class="order-item">
                            <div class="item-image">
                                <img src="/api/placeholder/80/80" alt="<?php echo $item['name']; ?>">
                                <span class="item-quantity"><?php echo $item['quantity']; ?></span>
                            </div>
                            <div class="item-details">
                                <h4><?php echo $item['name']; ?></h4>
                                <p class="item-variant">Color: <?php echo isset($item['color']) ? $item['color'] : 'Default'; ?> | Size: <?php echo isset($item['size']) ? $item['size'] : 'Default'; ?></p>
                            </div>
                            <div class="item-price">$<?php echo number_format($item['price'] * $item['quantity'], 2); ?></div>
                        </div>
                        <?php endforeach; ?>
                    </div>

                    <div class="promo-code">
                        <input type="text" placeholder="Enter promo code">
                        <button class="btn btn-secondary">Apply</button>
                    </div>

                    <div class="summary-totals">
                        <div class="summary-row">
                            <span>Subtotal</span>
                            <span>$<?php echo number_format($subtotal, 2); ?></span>
                        </div>
                        <div class="summary-row">
                            <span>Shipping</span>
                            <span><?php echo $shipping > 0 ? '$' . number_format($shipping, 2) : 'Free'; ?></span>
                        </div>
                        <div class="summary-row">
                            <span>Tax</span>
                            <span>$<?php echo number_format($tax, 2); ?></span>
                        </div>
                        <div class="summary-row total">
                            <span>Total</span>
                            <span>$<?php echo number_format($total, 2); ?></span>
                        </div>
                    </div>

                    <div class="secure-checkout">
                        <i class="fas fa-lock"></i> Secure Checkout
                    </div>
                    <div class="payment-methods">
                        <p>We Accept</p>
                        <img src="/api/placeholder/200/30" alt="Payment Methods">
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer>
        <div class="container">
            <div class="footer-grid">
                <div class="footer-col">
                    <h4>Products</h4>
                    <ul>
                        <li><a href="#">Men's Shoes</a></li>
                        <li><a href="#">Women's Shoes</a></li>
                        <li><a href="#">Clothing</a></li>
                        <li><a href="#">Accessories</a></li>
                        <li><a href="#">New Arrivals</a></li>
                    </ul>
                </div>
                <div class="footer-col">
                    <h4>Support</h4>
                    <ul>
                        <li><a href="#">Help Center</a></li>
                        <li><a href="#">Order Status</a></li>
                        <li><a href="#">Shipping Info</a></li>
                        <li><a href="#">Returns & Exchanges</a></li>
                        <li><a href="#">Contact Us</a></li>
                    </ul>
                </div>
                <div class="footer-col">
                    <h4>Company</h4>
                    <ul>
                        <li><a href="#">About Ricwer</a></li>
                        <li><a href="#">Careers</a></li>
                        <li><a href="#">Press</a></li>
                        <li><a href="#">Investors</a></li>
                        <li><a href="#">Sustainability</a></li>
                    </ul>
                </div>
                <div class="footer-col">
                    <h4>Connect with Us</h4>
                    <div class="social-links">
                        <a href="#"><i class="fab fa-facebook-f"></i></a>
                        <a href="#"><i class="fab fa-twitter"></i></a>
                        <a href="#"><i class="fab fa-instagram"></i></a>
                        <a href="#"><i class="fab fa-youtube"></i></a>
                    </div>
                    <div class="app-links">
                        <p>Download Our App</p>
                        <div class="app-buttons">
                            <a href="#"><img src="/api/placeholder/120/40" alt="App Store"></a>
                            <a href="#"><img src="/api/placeholder/120/40" alt="Google Play"></a>
                        </div>
                    </div>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2025 Ricwer. All rights reserved.</p>
                <div class="footer-links">
                    <a href="#">Privacy Policy</a>
                    <a href="#">Terms of Service</a>
                    <a href="#">Cookies Settings</a>
                </div>
                <div class="payment-methods">
                    <img src="/api/placeholder/200/30" alt="Payment Methods">
                </div>
            </div>
        </div>
    </footer>

    <!-- Scripts -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
    <script src="public/js/index.js"></script>
    <script src="public/js/pago.js"></script>
</body>
</html>