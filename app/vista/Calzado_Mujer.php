<?php
    session_start();
    if(isset($_SESSION['usuario'])){
        $login      =       TRUE;
        $usuario    =       $_SESSION['usuario'];
        $rol        =       $_SESSION['rol'];
    }
    else{
        $login      =       FALSE;
    }
    require ('../../config/config.php');
    require ('../../config/cls_Conexion.php');
    $Objusuario = new clsConexion();
    $conn = $Objusuario-> __construct();

    $sql = $conn->prepare("SELECT `idProducto`, `nombreProducto`, `descripcionProducto`, `precioProducto`, `descuentoProducto` FROM `producto` WHERE 1");
    $sql->execute();
    $resultado = $sql->fetchAll(PDO::FETCH_ASSOC);
?>
<!doctype html>
<html lang="es" class="html">
  <head>
    <!-- Required meta tags -->
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="Bienvenido(a) al sitio oficial de ricwer. Aqui encontraras distintos diseños de zapatos para toda la familia de la mejor calidad y al mejor precio. ¡Conoce más!">
    <meta name="robots" content="noindex,follow">
    <meta property="og:title" content="ricwer Tienda Oficial | Calzado">
    <meta property="og:description" content="Bienvenido(a) al sitio oficial de ricwer. Aqui encontraras distintos diseños de zapatos para toda la familia de la mejor calidad y al mejor precio. ¡Conoce más!">
    <meta property="og:site_name" content="ricwer">
    <meta property="og:url" content="https://www.ricwer.com">
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-BmbxuPwQa2lc/FVzBcNJ7UAyJxM6wuqIj61tLrc4wSX0szH/Ev+nYRRuWlolflfl" crossorigin="anonymous">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.4.0/font/bootstrap-icons.css">
    <link rel="stylesheet" href="../../public/css/galeria_productos.css">
    <link rel="stylesheet" href="../../public/css/main.css">
    <link rel="stylesheet" href="../../public/css/carga.css">
    <link rel="stylesheet" href="../../index.php">
    <link rel="icon" href="../../public/img/icono.ico">
    <title>Ricwer</title>
  </head>
  <body>
  <div id="contenedor_carga">
		<div id="carga"></div>
	</div>
                        <!-- ENCABEZADO -->
                        <header class="container-fluid bg-primary d-flex justify-content-center">
        <p class="text-light mb-0 p-2 fs-6">Contactanos +57 300-311-8379</p>
    </header>

    <nav  class="navbar navbar-expand-lg navbar-light p-3"  id="menu" class="navbar bg-body-tertiary">
        <div class="container">
          <a class="navbar-brand" href="#">
            <img src="../../public/img/logo.png" alt="logo"   width="100%" height="100%">
          </a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>

          <div class="collapse navbar-collapse" id="navbarSupportedContent">
            <nav class="menu">
        <div class="collapse navbar-collapse" id="navbarSupportedContent">
      <ul class="navbar-nav me-auto mb-2 mb-lg-0">
        <li class="nav-item">
          <a class="nav-link active" aria-current="page" href="../../index.php">Inicio</a>
        </li>
        <li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
            Calzado
          </a>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item" href="calzado_hombre.php">Hombre</a></li>
            <li><a class="dropdown-item" href="calzado_mujer.php">Mujer</a></li>
            <li><a class="dropdown-item" href="calzado_niños.php">Niños</a></li>
          </ul>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="empresa.php">Empresa</a>
        </li>
        <li class="nav-item">
        <a href="carrito.php" >
                    <i class="fas fa-shopping-cart"></i> Carrito <span id="num_cart" class="badge bg-secondary"><?php echo $num_cart; ?></span>
                </a>
        </li>
        <?php
                                if($login==TRUE)
                                {
                                    ?>
                                    <li class="nav-item">
          <a class="nav-link" href="menu.php">Sistema</a>
        </li>
        <li class="nav-item">
                                            <a class="nav-link" href="../../app/controlador/Ctrl_CerrarSesion.php">Cerrar Sesion</a>
                                        </li>
                            <?php
                                }
                            ?>
                        </ul>
                        <?php
                            switch($login)
                            {
                                case FALSE:
                                ?>
                                <li class="nav-item">
                                    <a class="nav-link" href="login.php">Inicio Sesion</a>
                                </li>
                        <?php  
                                    break;
                                case TRUE:
                        ?>                
                                <span class="navbar-text">

                                    <p class="p-3  fs-4" class="text-light"><h6><b> Usuario: <?php echo $usuario;?>
                                        Rol: <?php echo $rol;?></b></h6></p> 
                                </span>
                        <?php
                            }
                        ?>
      </ul>
      <!--<form class="d-flex" role="search">
        <input class="form-control me-2" type="search" placeholder="Search" aria-label="Search">
        <button class="btn btn-outline-success" type="submit">Search</button>
      </form>-->
    </div>
    </nav>
          </div>
        </div>
</nav>
        <!--========================================================== -->
                        <!-- INTRODUCCION DE SERVICIOS-->
    <!--========================================================== -->
    <div id="carousel" class="carousel slide" data-bs-ride="carousel">
        <div class="carousel-inner">
          <div class="carousel-item active" data-bs-interval="3000">
            <img src="../../public/img/carrusel4.png" width="100%" alt="public/img/011.jpeg">
          </div>

 
          <div class="carousel-indicators">
    <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="0" class="active" aria-current="true" aria-label="Slide 1"></button>
    <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="1" aria-label="Slide 2"></button>
    <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="2" aria-label="Slide 3"></button>
  </div>
        </div>
      </div> 
    
    
    <section class="d-flex flex-column justify-content-center align-items-center pt-5  text-center w-50 m-auto" id="intro">
        <p class="p-3  fs-4">
           <b>Aqui esta nuestro Catalogo de zapatos para Mujer</b>     
        </p>   
       </section>
       <section class="contenedor">
        <!-- Contenedor de elementos -->
        <div class="contenedor-items">
            <?php foreach($resultado as $row){?>
            <a class="nav-link" href="producto.php">
            <div class="item">
                <?php
                $id = $row['idProducto'];
                $imagen = "../../public/img/10".$id.".jpeg";
                if(!file_exists($imagen)){
                    $imagen= "../../public/img/001.jpeg";
                }
                ?>
                <span class="titulo-item"><?php echo $row['nombreProducto']; ?></span>
                <img src="<?php echo $imagen; ?>" alt="" class="img-item">
                <span class="precio-item">$<?php echo number_format($row['precioProducto'],2, '.', ',' ); ?></span>                
            </div>
            </a><?php } ?>
        </div>
    </section>
    <br>
    <br>
    <br>
    <br>

<!--========================================================== -->
                        <!--FOOTER-->
<!--========================================================== -->


<footer class="footer">
    <div class="container">
        <div class="footer-row">
        <div class="footer-links">
                <h4>Compañia</h4>
                <ul>
                    <li><a href="empresa.php">Nosotros</a></li>
                    <li><a href="empresa.php">Nuestros Servicios</a></li>
                    <li><a href="empresa.php">Politica de Privacidad</a></li>
                    <li><a href="empresa.php">Informacion</a></li>
                </ul>
            </div>
            <div class="footer-links">
                <h4>Ayuda</h4>
                <ul>
                    <li><a href="empresa.php">Sugerencias</a></li>
                    <li><a href="empresa.php">Quejas</a></li>
                    <li><a href="empresa.php">Reclamos</a></li>
                    <li><a href="empresa.php">Soporte</a></li>
                </ul>
            </div>
            <div class="footer-links">
                <h4>Tienda</h4>
                <ul>
                    <li><a href="calzado_hombre.php">Calzado Hombre</a></li>
                    <li><a href="calzado_mujer.php">Calzado Mujer</a></li>
                    <li><a href="calzado_niños.php">Calzado Niños</a></li>
                    <li><a href="menu.php">Perfil</a></li>
                </ul>
            </div>
            <div class="footer-links" id="iconos">
                <h4>Siguenos</h4>
                <ul>
                    <li><a href="www.facebook.com/ricwer/"><i class="bi bi-facebook"></i></a></li>
                    <li><a href="www.instagram.com/ricwer_oficial/"><i class="bi bi-instagram"></i></a></li>
                    <li><a href="www.x.com/ricwer_oficial/"><i class="bi bi-twitter"></i></a></li>
                </ul>
            </div>
        </div>
    </div>
</footer>

    <!-- Option 1: Bootstrap Bundle with Popper -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta2/dist/js/bootstrap.bundle.min.js" integrity="sha384-b5kHyXgcpbZJO/tY9Ul7kGkf1S0CWuKcCD38l8YkeH8z8QjE0GmW1gYU5S9FOnJ0" crossorigin="anonymous"></script> 
    <script src="https://unpkg.com/typewriter-effect@latest/dist/core.js"></script>
    <script src="../../public/js/main.js"></script>
    <script>
      window.onload=function(){
        var contenedor = document.getElementById('contenedor_carga');
      contenedor.style.visibility = 'hidden';
      contenedor.style.opacity = '0';
    }
    </script>
    <script>
	function addProducto(id, token) {
		let url = 'clases/carrito.php';
		let formData = new FormData();
		formData.append('idProducto', $id);
		formData.append('token', $token);

		fetch(url, {
				method: 'POST',
				body: formData,
				mode: 'cors'
			}).then(response => response.json())
			.then(data => {
				if (data.ok) {
					let elemento = document.getElementById("num_cart")
					elemento.innerHTML = data.numero;
				}
			})
	}
	
</script>
  </body>
</html>

    