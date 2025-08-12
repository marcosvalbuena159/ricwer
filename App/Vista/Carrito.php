<?php
// Include database connection and necessary classes
include_once 'config/database.php';
include_once 'classes/Cls_usuario.php';
include_once 'classes/Cls_producto.php';

// Start session to manage cart and user state
session_start();

// Check if user is logged in
$loggedIn = isset($_SESSION['usuario_id']);

// Initialize products class
$producto = new Cls_producto();

// Get cart items from session
$cart = isset($_SESSION['cart']) ? $_SESSION['cart'] : [];

// Initialize cart variables
$subtotal = 0;
$shipping = 0;
$tax = 0;
$total = 0;

// Calculate cart totals
if(!empty($cart)) {
    foreach($cart as $item) {
        $subtotal += $item['price'] * $item['quantity'];
    }
    
    // Calculate shipping (free over $100)
    $shipping = $subtotal > 100 ? 0 : 9.99;
    
    // Calculate tax (assuming 8%)
    $tax = $subtotal * 0.08;
    
    // Calculate total
    $total = $subtotal + $shipping + $tax;
}

// Handle cart actions (would typically be handled via AJAX)
if(isset($_POST['action'])) {
    $action = $_POST['action'];
    
    if($action == 'update') {
        // Code to update cart item quantity
    } elseif($action == 'remove') {
        // Code to remove item from cart
    }
    
    // Redirect back to cart page to refresh
    header('Location: carrito.php');
    exit();
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shopping Cart | Ricwer</title>
    <link rel="stylesheet" href="public/css/index.css">
    <link rel="stylesheet" href="public/css/carrito.css">
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
                    <a href="carrito.php" class="icon active"><i class="fas fa-shopping-cart"></i><span class="cart-count"><?php echo count($cart); ?></span></a>
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
            <h1>Shopping Cart</h1>
            <nav class="breadcrumb">
                <a href="index.php">Home</a> / 
                <span>Shopping Cart</span>
            </nav>
        </div>
    </section>

    <!-- Cart Section -->
    <section class="cart-section">
        <div class="container">
            <?php if(empty($cart)): ?>
            <!-- Empty Cart -->
            <div class="empty-cart">
                <div class="empty-cart-icon">
                    <i class="fas fa-shopping-cart"></i>
                </div>
                <h2>Your cart is empty</h2>
                <p>Looks like you haven't added any products to your cart yet.</p>
                <a href="index.php" class="btn btn-primary">Continue Shopping</a>
            </div>
            <?php else: ?>
            <!-- Cart with items -->
            <div class="cart-container">
                <div class="cart-items">
                    <table class="cart-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Price</th>
                                <th>Quantity</th>
                                <th>Subtotal</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Sample products - in real implementation, would loop through cart items -->
                            <tr>
                                <td class="product-col">
                                    <div class="product-info">
                                        <img src="/api/placeholder/80/80" alt="Runner Pro">
                                        <div>
                                            <h3>Runner Pro</h3>
                                            <p>Men's Running Shoes</p>
                                            <p>Color: Blue | Size: 9</p>
                                        </div>
                                    </div>
                                </td>
                                <td class="price-col">$129.99</td>
                                <td class="quantity-col">
                                    <div class="quantity-selector">
                                        <button class="quantity-minus">-</button>
                                        <input type="number" value="1" min="1" max="10">
                                        <button class="quantity-plus">+</button>
                                    </div>
                                </td>
                                <td class="subtotal-col">$129.99</td>
                                <td class="remove-col">
                                    <button class="remove-item"><i class="fas fa-trash"></i></button>
                                </td>
                            </tr>
                            <tr>
                                <td class="product-col">
                                    <div class="product-info">
                                        <img src="/api/placeholder/80/80" alt="Performance Tee">
                                        <div>
                                            <h3>Performance Tee</h3>
                                            <p>Men's Training</p>
                                            <p>Color: Navy | Size: L</p>
                                        </div>
                                    </div>
                                </td>
                                <td class="price-col">$34.99</td>
                                <td class="quantity-col">
                                    <div class="quantity-selector">
                                        <button class="quantity-minus">-</button>
                                        <input type="number" value="2" min="1" max="10">
                                        <button class="quantity-plus">+</button>
                                    </div>
                                </td>
                                <td class="subtotal-col">$69.98</td>
                                <td class="remove-col">
                                    <button class="remove-item"><i class="fas fa-trash"></i></button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div class="cart-actions">
                        <div class="coupon">
                            <input type="text" placeholder="Coupon code">
                            <button class="btn btn-secondary">Apply Coupon</button>
                        </div>
                        <button class="btn btn-primary update-cart">Update Cart</button>
                    </div>
                </div>
                
                <div class="cart-summary">
                    <h2>Order Summary</h2>
                    <div class="summary-row">
                        <span>Subtotal</span>
                        <span>$199.97</span>
                    </div>
                    <div class="summary-row">
                        <span>Shipping</span>
                        <span>Free</span>
                    </div>
                    <div class="summary-row">
                        <span>Tax</span>
                        <span>$16.00</span>
                    </div>
                    <div class="summary-row total">
                        <span>Total</span>
                        <span>$215.97</span>
                    </div>
                    <a href="pago.php" class="btn btn-primary checkout-btn">Proceed to Checkout</a>
                    <div class="secure-checkout">
                        <i class="fas fa-lock"></i> Secure Checkout
                    </div>
                    <div class="payment-methods">
                        <h3>We Accept</h3>
                        <div class="payment-icons">
                            <img src="/api/placeholder/200/30" alt="Payment Methods">
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Recommended Products -->
            <div class="recommended-products">
                <h2>You May Also Like</h2>
                <div class="product-grid">
                    <?php for($i = 0; $i < 4; $i++): ?>
                    <div class="product-item">
                        <div class="product-image">
                            <img src="/api/placeholder/150/150" alt="Recommended Product">
                            <div class="product-overlay">
                                <a href="#" class="btn-quick-view">Quick View</a>
                            </div>
                        </div>
                        <div class="product-info">
                            <h3>Elite Product <?php echo $i+1; ?></h3>
                            <p class="product-category">Sportswear</p>
                            <p class="product-price">$<?php echo rand(49, 99); ?>.99</p>
                        </div>
                    </div>
                    <?php endfor; ?>
                </div>
            </div>
            <?php endif; ?>
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
    <script src="https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.8.1/slick.min.js"></script>
    <script src="public/js/index.js"></script>
</body>
</html>