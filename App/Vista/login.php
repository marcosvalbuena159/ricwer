<?php
// Initialize the session
session_start();
 
// Check if the user is already logged in, if yes then redirect to index page
if(isset($_SESSION["loggedin"]) && $_SESSION["loggedin"] === true){
    header("location: index.php");
    exit;
}
 
// Include database connection
require_once "config.php";
 
// Define variables and initialize with empty values
$correoUsuario = $passwordUsuario = "";
$correo_err = $password_err = $login_err = "";
 
// Processing form data when form is submitted
if($_SERVER["REQUEST_METHOD"] == "POST"){
 
    // Check if email is empty
    if(empty(trim($_POST["correoUsuario"]))){
        $correo_err = "Please enter your email.";
    } else{
        $correoUsuario = trim($_POST["correoUsuario"]);
    }
    
    // Check if password is empty
    if(empty(trim($_POST["passwordUsuario"]))){
        $password_err = "Please enter your password.";
    } else{
        $passwordUsuario = trim($_POST["passwordUsuario"]);
    }
    
    // Validate credentials
    if(empty($correo_err) && empty($password_err)){
        // Prepare a select statement
        $sql = "SELECT idUsuario, nombreUsuario, correoUsuario, passwordUsuario, idRolUsuarioFK FROM usuario WHERE correoUsuario = ?";
        
        if($stmt = mysqli_prepare($link, $sql)){
            // Bind variables to the prepared statement as parameters
            mysqli_stmt_bind_param($stmt, "s", $param_correo);
            
            // Set parameters
            $param_correo = $correoUsuario;
            
            // Attempt to execute the prepared statement
            if(mysqli_stmt_execute($stmt)){
                // Store result
                mysqli_stmt_store_result($stmt);
                
                // Check if email exists, if yes then verify password
                if(mysqli_stmt_num_rows($stmt) == 1){                    
                    // Bind result variables
                    mysqli_stmt_bind_result($stmt, $idUsuario, $nombreUsuario, $correoUsuario, $hashed_password, $idRolUsuarioFK);
                    if(mysqli_stmt_fetch($stmt)){
                        if($passwordUsuario == $hashed_password){
                            // Password is correct, so start a new session
                            session_start();
                            
                            // Store data in session variables
                            $_SESSION["loggedin"] = true;
                            $_SESSION["idUsuario"] = $idUsuario;
                            $_SESSION["nombreUsuario"] = $nombreUsuario;
                            $_SESSION["correoUsuario"] = $correoUsuario;
                            $_SESSION["idRolUsuarioFK"] = $idRolUsuarioFK;
                            
                            // Redirect user to home page
                            header("location: index.php");
                        } else{
                            // Password is not valid, display a generic error message
                            $login_err = "Invalid email or password.";
                        }
                    }
                } else{
                    // Email doesn't exist, display a generic error message
                    $login_err = "Invalid email or password.";
                }
            } else{
                echo "Oops! Something went wrong. Please try again later.";
            }

            // Close statement
            mysqli_stmt_close($stmt);
        }
    }
    
    // Close connection
    mysqli_close($link);
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Ricwer</title>
    <link rel="stylesheet" href="index.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- Custom CSS for login page -->
    <style>
        .login-container {
            background-color: var(--light-gray);
            padding: 60px 0;
            min-height: calc(100vh - 200px);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .login-form {
            max-width: 400px;
            width: 100%;
            background-color: var(--white);
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
        }
        
        .login-form h2 {
            text-align: center;
            margin-bottom: 30px;
            color: var(--primary);
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
        }
        
        .form-control {
            width: 100%;
            padding: 12px 15px;
            border: 1px solid var(--gray);
            border-radius: 4px;
            font-size: 1rem;
            transition: var(--transition);
        }
        
        .form-control:focus {
            border-color: var(--primary);
            outline: none;
            box-shadow: 0 0 0 2px rgba(0, 116, 183, 0.2);
        }
        
        .is-invalid {
            border-color: #dc3545;
        }
        
        .invalid-feedback {
            color: #dc3545;
            font-size: 0.9rem;
            margin-top: 5px;
        }
        
        .btn-login {
            width: 100%;
            padding: 12px;
            background-color: var(--primary);
            color: var(--white);
            border: none;
            border-radius: 4px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: var(--transition);
        }
        
        .btn-login:hover {
            background-color: var(--secondary);
        }
        
        .login-options {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 20px;
            font-size: 0.9rem;
        }
        
        .login-options a {
            color: var(--primary);
        }
        
        .login-options a:hover {
            text-decoration: underline;
        }
        
        .social-login {
            margin-top: 30px;
            text-align: center;
        }
        
        .social-login p {
            position: relative;
            margin-bottom: 20px;
        }
        
        .social-login p:before {
            content: '';
            position: absolute;
            top: 50%;
            left: 0;
            width: 45%;
            height: 1px;
            background-color: var(--gray);
        }
        
        .social-login p:after {
            content: '';
            position: absolute;
            top: 50%;
            right: 0;
            width: 45%;
            height: 1px;
            background-color: var(--gray);
        }
        
        .social-buttons {
            display: flex;
            justify-content: center;
            gap: 15px;
        }
        
        .social-button {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background-color: #f5f5f5;
            color: #333;
            transition: var(--transition);
        }
        
        .social-button:hover {
            transform: translateY(-3px);
        }
        
        .social-button.facebook {
            background-color: #3b5998;
            color: white;
        }
        
        .social-button.google {
            background-color: #dd4b39;
            color: white;
        }
        
        .social-button.twitter {
            background-color: #1da1f2;
            color: white;
        }
        
        .register-link {
            text-align: center;
            margin-top: 30px;
        }
        
        .register-link a {
            color: var(--primary);
            font-weight: 600;
        }
        
        .register-link a:hover {
            text-decoration: underline;
        }
        
        .alert {
            padding: 12px 15px;
            margin-bottom: 20px;
            border-radius: 4px;
            color: #721c24;
            background-color: #f8d7da;
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

    <!-- Login Section -->
    <section class="login-container">
        <div class="login-form">
            <h2>Sign In</h2>
            
            <?php 
            if(!empty($login_err)){
                echo '<div class="alert">' . $login_err . '</div>';
            }        
            ?>

            <form action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]); ?>" method="post">
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" name="correoUsuario" class="form-control <?php echo (!empty($correo_err)) ? 'is-invalid' : ''; ?>" value="<?php echo $correoUsuario; ?>">
                    <span class="invalid-feedback"><?php echo $correo_err; ?></span>
                </div>    
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" name="passwordUsuario" class="form-control <?php echo (!empty($password_err)) ? 'is-invalid' : ''; ?>">
                    <span class="invalid-feedback"><?php echo $password_err; ?></span>
                </div>
                <div class="form-group">
                    <button type="submit" class="btn-login">Login</button>
                </div>
                <div class="login-options">
                    <label>
                        <input type="checkbox" name="remember"> Remember me
                    </label>
                    <a href="#">Forgot Password?</a>
                </div>
            </form>

            <div class="social-login">
                <p>Or sign in with</p>
                <div class="social-buttons">
                    <a href="#" class="social-button facebook">
                        <i class="fab fa-facebook-f"></i>
                    </a>
                    <a href="#" class="social-button google">
                        <i class="fab fa-google"></i>
                    </a>
                    <a href="#" class="social-button twitter">
                        <i class="fab fa-twitter"></i>
                    </a>
                </div>
            </div>

            <div class="register-link">
                <p>Don't have an account? <a href="registro.php">Register now</a></p>
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
    <script src="index.js"></script>
</body>
</html>