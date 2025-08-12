<?php
// Include database connection and necessary classes
include_once 'config/database.php';
include_once 'classes/Cls_usuario.php';
include_once 'classes/Cls_producto.php';

// Initialize the product class
$producto = new Cls_producto();

// Get all men's footwear products
$productos = $producto->getProductosByCategoria('Calzado Hombre');

// Start session to manage user state
session_start();

// Check if user is logged in
$loggedIn = isset($_SESSION['usuario_id']);
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Men's Footwear | Ricwer</title>
    <link rel="stylesheet" href="public/css/index.css">
    <link rel="stylesheet" href="public/css/productos.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.8.1/slick.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.8.1/slick-theme.min.css">
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
                        <li><a href="calzado_hombre.php" class="active">Men's Footwear</a></li>
                        <li><a href="#">Accessories</a></li>
                        <li><a href="#">Sale</a></li>
                    </ul>
                </nav>
                <div class="nav-icons">
                    <a href="#" class="icon"><i class="fas fa-search"></i></a>
                    <a href="#" class="icon"><i class="fas fa-user"></i></a>
                    <a href="carrito.php" class="icon"><i class="fas fa-shopping-cart"></i><span class="cart-count">0</span></a>
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
            <h1>Men's Footwear</h1>
            <nav class="breadcrumb">
                <a href="index.php">Home</a> / 
                <span>Men's Footwear</span>
            </nav>
        </div>
    </section>

    <!-- Products Section -->
    <section class="products-section">
        <div class="container">
            <div class="products-grid">
                <!-- Filter Sidebar -->
                <div class="filter-sidebar">
                    <div class="filter-group">
                        <h3>Categories</h3>
                        <ul>
                            <li><a href="#" class="active">All Footwear</a></li>
                            <li><a href="#">Running</a></li>
                            <li><a href="#">Training</a></li>
                            <li><a href="#">Basketball</a></li>
                            <li><a href="#">Lifestyle</a></li>
                            <li><a href="#">Soccer</a></li>
                        </ul>
                    </div>
                    <div class="filter-group">
                        <h3>Price</h3>
                        <div class="price-slider">
                            <input type="range" min="0" max="300" value="150" class="slider" id="priceRange">
                            <div class="price-range">
                                <span>$0</span>
                                <span id="priceValue">$150</span>
                                <span>$300</span>
                            </div>
                        </div>
                    </div>
                    <div class="filter-group">
                        <h3>Color</h3>
                        <div class="color-options">
                            <label class="color-option">
                                <input type="checkbox" name="color" value="black">
                                <span class="color-dot" style="background-color: #000000;"></span>
                                <span>Black</span>
                            </label>
                            <label class="color-option">
                                <input type="checkbox" name="color" value="white">
                                <span class="color-dot" style="background-color: #FFFFFF; border: 1px solid #ccc;"></span>
                                <span>White</span>
                            </label>
                            <label class="color-option">
                                <input type="checkbox" name="color" value="blue">
                                <span class="color-dot" style="background-color: #0074B7;"></span>
                                <span>Blue</span>
                            </label>
                            <label class="color-option">
                                <input type="checkbox" name="color" value="red">
                                <span class="color-dot" style="background-color: #E53935;"></span>
                                <span>Red</span>
                            </label>
                            <label class="color-option">
                                <input type="checkbox" name="color" value="gray">
                                <span class="color-dot" style="background-color: #9E9E9E;"></span>
                                <span>Gray</span>
                            </label>
                        </div>
                    </div>
                    <div class="filter-group">
                        <h3>Size</h3>
                        <div class="size-options">
                            <label class="size-option">
                                <input type="checkbox" name="size" value="7">
                                <span>7</span>
                            </label>
                            <label class="size-option">
                                <input type="checkbox" name="size" value="7.5">
                                <span>7.5</span>
                            </label>
                            <label class="size-option">
                                <input type="checkbox" name="size" value="8">
                                <span>8</span>
                            </label>
                            <label class="size-option">
                                <input type="checkbox" name="size" value="8.5">
                                <span>8.5</span>
                            </label>
                            <label class="size-option">
                                <input type="checkbox" name="size" value="9">
                                <span>9</span>
                            </label>
                            <label class="size-option">
                                <input type="checkbox" name="size" value="9.5">
                                <span>9.5</span>
                            </label>
                            <label class="size-option">
                                <input type="checkbox" name="size" value="10">
                                <span>10</span>
                            </label>
                            <label class="size-option">
                                <input type="checkbox" name="size" value="10.5">
                                <span>10.5</span>
                            </label>
                            <label class="size-option">
                                <input type="checkbox" name="size" value="11">
                                <span>11</span>
                            </label>
                            <label class="size-option">
                                <input type="checkbox" name="size" value="11.5">
                                <span>11.5</span>
                            </label>
                            <label class="size-option">
                                <input type="checkbox" name="size" value="12">
                                <span>12</span>
                            </label>
                        </div>
                    </div>
                    <button class="btn btn-primary apply-filters">Apply Filters</button>
                </div>
                
                <!-- Products Display -->
                <div class="products-display">
                    <div class="products-header">
                        <div class="products-count">24 Products</div>
                        <div class="products-sort">
                            <label>Sort by:</label>
                            <select id="sortOptions">
                                <option value="featured">Featured</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="newest">Newest</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="products-grid-view">
                        <!-- Product Item - This would be dynamically generated from database -->
                        <div class="product-item">
                            <div class="product-image">
                                <img src="/api/placeholder/300/300" alt="Runner Pro">
                                <div class="product-overlay">
                                    <a href="#" class="btn-quick-view">Quick View</a>
                                    <a href="#" class="btn add-to-cart" data-product-id="1">Add to Cart</a>
                                </div>
                            </div>
                            <div class="product-info">
                                <h3>Runner Pro</h3>
                                <p class="product-category">Men's Running Shoes</p>
                                <p class="product-price">$129.99</p>
                                <div class="product-colors">
                                    <span class="color-dot" style="background-color: #0074B7;"></span>
                                    <span class="color-dot" style="background-color: #003B73;"></span>
                                    <span class="color-dot" style="background-color: #BFD7ED;"></span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Multiple product items for display -->
                        <?php for($i = 0; $i < 11; $i++): ?>
                        <div class="product-item">
                            <div class="product-image">
                                <img src="/api/placeholder/300/300" alt="Footwear Product">
                                <div class="product-overlay">
                                    <a href="#" class="btn-quick-view">Quick View</a>
                                    <a href="#" class="btn add-to-cart" data-product-id="<?php echo $i+2; ?>">Add to Cart</a>
                                </div>
                            </div>
                            <div class="product-info">
                                <h3>Elite Runner <?php echo $i+1; ?></h3>
                                <p class="product-category">Men's Athletic Shoes</p>
                                <p class="product-price">$<?php echo rand(79, 199); ?>.99</p>
                                <div class="product-colors">
                                    <span class="color-dot" style="background-color: #<?php echo dechex(rand(0, 16777215)); ?>;"></span>
                                    <span class="color-dot" style="background-color: #<?php echo dechex(rand(0, 16777215)); ?>;"></span>
                                </div>
                            </div>
                        </div>
                        <?php endfor; ?>
                    </div>
                    
                    <!-- Pagination -->
                    <div class="pagination">
                        <a href="#" class="active">1</a>
                        <a href="#">2</a>
                        <a href="#">3</a>
                        <a href="#" class="next"><i class="fas fa-chevron-right"></i></a>
                    </div>
                </div>
            </div>
        </div>
    </section>
    
    <!-- Featured Collection Banner -->
    <section class="featured-collection">
        <div class="container">
            <div class="collection-banner">
                <div class="collection-content">
                    <h2>Performance Series</h2>
                    <p>Engineered for athletes, designed for champions.</p>
                    <a href="#" class="btn btn-primary">Shop Collection</a>
                </div>
                <div class="collection-image">
                    <img src="/api/placeholder/600/400" alt="Performance Collection">
                </div>
            </div>
        </div>
    </section>

    <!-- Newsletter -->
    <section class="newsletter">
        <div class="container">
            <div class="newsletter-content">
                <h2>Join the Ricwer Club</h2>
                <p>Sign up for exclusive offers, new arrivals, and more.</p>
                <form class="newsletter-form">
                    <input type="email" placeholder="Your email address" required>
                    <button type="submit" class="btn btn-primary">Subscribe</button>
                </form>
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
    <script src="https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.8.1/slick.min.js"></script>
    <script src="public/js/index.js"></script>
    <script src="public/js/productos.js"></script>
</body>
</html>