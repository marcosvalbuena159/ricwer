<?php
require_once 'config.php';

$errors = [];
$success = false;

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Validate inputs
    $tipoDoc = sanitize($_POST['tipoDoc']);
    $numDoc = sanitize($_POST['numDoc']);
    $nombre = sanitize($_POST['nombre']);
    $apellido = sanitize($_POST['apellido']);
    $direccion = sanitize($_POST['direccion']);
    $telefono = sanitize($_POST['telefono']);
    $correo = sanitize($_POST['correo']);
    $password = sanitize($_POST['password']);
    $confirmPassword = sanitize($_POST['confirmPassword']);
    
    // Basic validation
    if (empty($nombre)) {
        $errors[] = "Name is required";
    }
    
    if (empty($apellido)) {
        $errors[] = "Last name is required";
    }
    
    if (empty($correo)) {
        $errors[] = "Email is required";
    } elseif (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
        $errors[] = "Invalid email format";
    }
    
    if (empty($password)) {
        $errors[] = "Password is required";
    } elseif (strlen($password) < 6) {
        $errors[] = "Password must be at least 6 characters";
    }
    
    if ($password !== $confirmPassword) {
        $errors[] = "Passwords do not match";
    }
    
    // Check if email already exists
    $checkEmail = $conn->prepare("SELECT correoUsuario FROM usuario WHERE correoUsuario = ?");
    $checkEmail->bind_param("s", $correo);
    $checkEmail->execute();
    $result = $checkEmail->get_result();
    
    if ($result->num_rows > 0) {
        $errors[] = "Email already registered";
    }
    
    // If no errors, proceed with registration
    if (empty($errors)) {
        // Default profile image placeholder
        $defaultImage = file_get_contents("public/images/default-avatar.jpg");
        
        // Insert new user
        $stmt = $conn->prepare("INSERT INTO usuario (tipoDocUsuario, numdocUsuario, nombreUsuario, apellidoUsuario, direccionUsuario, telefonoUsuario, correoUsuario, passwordUsuario, fotoUsuario, estadoUsuario, idRolUsuarioFK) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Activo', 2)");
        $stmt->bind_param("ssssssssb", $tipoDoc, $numDoc, $nombre, $apellido, $direccion, $telefono, $correo, $password, $defaultImage);
        
        if ($stmt->execute()) {
            $success = true;
        } else {
            $errors[] = "Registration failed: " . $conn->error;
        }
        
        $stmt->close();
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register - Ricwer</title>
    <link rel="stylesheet" href="public/css/index.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        .registration-form {
            padding: 80px 0;
            background-color: var(--light-gray);
        }
        
        .form-container {
            max-width: 800px;
            margin: 0 auto;
            background-color: var(--white);
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
            padding: 40px;
        }
        
        .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group.full-width {
            grid-column: span 2;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
        }
        
        .form-group input,
        .form-group select {
            width: 100%;
            padding: 12px 15px;
            border: 1px solid var(--gray);
            border-radius: 4px;
            font-size: 1rem;
        }
        
        .form-group input:focus,
        .form-group select:focus {
            outline: none;
            border-color: var(--primary);
        }
        
        .form-actions {
            margin-top: 20px;
            text-align: center;
        }
        
        .login-link {
            margin-top: 15px;
            display: block;
            text-align: center;
        }
        
        .alert {
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 4px;
        }
        
        .alert-success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .alert-danger {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
    </style>
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
                    <a href="login.php" class="nav-link">Login</a>
                    <a href="registro.php" class="nav-link">Register</a>
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
                    <a href="carrito.php" class="icon"><i class="fas fa-shopping-cart"></i><span class="cart-count">0</span></a>
                </div>
            </div>
        </div>
    </header>

    <!-- Registration Form -->
    <section class="registration-form">
        <div class="container">
            <div class="form-container">
                <h2 class="section-title">Create Account</h2>
                
                <?php if ($success): ?>
                    <div class="alert alert-success">
                        Registration successful! You can now <a href="login.php">login</a> to your account.
                    </div>
                <?php endif; ?>
                
                <?php if (!empty($errors)): ?>
                    <div class="alert alert-danger">
                        <ul>
                            <?php foreach ($errors as $error): ?>
                                <li><?php echo $error; ?></li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                <?php endif; ?>
                
                <form action="registro.php" method="POST">
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="tipoDoc">Document Type</label>
                            <select name="tipoDoc" id="tipoDoc" required>
                                <option value="">Select document type</option>
                                <option value="DNI">DNI</option>
                                <option value="Passport">Passport</option>
                                <option value="Driver License">Driver License</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="numDoc">Document Number</label>
                            <input type="text" name="numDoc" id="numDoc" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="nombre">First Name</label>
                            <input type="text" name="nombre" id="nombre" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="apellido">Last Name</label>
                            <input type="text" name="apellido" id="apellido" required>
                        </div>
                        
                        <div class="form-group full-width">
                            <label for="direccion">Address</label>
                            <input type="text" name="direccion" id="direccion" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="telefono">Phone Number</label>
                            <input type="tel" name="telefono" id="telefono" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="correo">Email</label>
                            <input type="email" name="correo" id="correo" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="password">Password</label>
                            <input type="password" name="password" id="password" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="confirmPassword">Confirm Password</label>
                            <input type="password" name="confirmPassword" id="confirmPassword" required>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Create Account</button>
                    </div>
                </form>
                
                <div class="login-link">
                    Already have an account? <a href="login.php">Login here</a>
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
    <script src="https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.8.1/slick.min.js"></script>
    <script src="public/js/index.js"></script>
</body>
</html>