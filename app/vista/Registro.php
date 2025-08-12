<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
	<title></title> 
	<meta name="viewport" content="width=device-width, user-scalable=yes, initial-scale=1.0, maximum-scale=3.0, minimum-scale=1.0">
 <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.6.3/css/all.css">
<style type="text/css" id="operaUserStyle"></style>
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
    <link rel="stylesheet" href="../../public/css/estilos.css">
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
          <a class="nav-link" href="menu.php">Perfil</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="empresa.php">Empresa</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="carrito.php">Mi Carrito</a>
        </li>
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
    <div class="body-contenedor">
        <div class="contenedor-sesion">
            <div class="seccion">
                <div class="titulo-seccion">
                    <h5>Registrar</h5>
                </div>
                <form autocomplete="off" class="form-secion" action="../controlador/ctrl_Register.php" method="POST" id="registrationForm" onsubmit="return validateForm();" accept-charset="utf-8">
                <?php
                            if($_GET)
                            {
                                $mensaje = $_GET['mensaje'];
                                if($mensaje=='ingreso')
                                {
                                    echo "<div class='alert alert-success'>Se ingresaron los datos del cliente correctamente</div>";
                                }
                                else
                                {
                                    if($mensaje=='noingreso')
                                    {
                                        echo "<div class='alert alert-danger'>No se pudo ingresar los datos del cliente, verifique los datos</div>";
                                    }
                                }
                            }
                        ?>
                        <div class="form-input">
                            <input type="number" placeholder="Documento" name="Documento" class="form-control" id="texto-usuario" aria-describedby="ingreso de usuario" >
                            <div class="icono">
                            <i class="fas fa-user"></i>
                        </div>
                        </div>
                        <div class="form-input">
                            <select name="TipoDoc" class="form-control" id="texto-password">
                            <option disabled selected>Elegir...</option>
                          <option <?php if($tipoDocumento=="RC"){echo "selected";}  ?>>R.C</option>
                          <option <?php if($tipoDocumento=="TI"){echo "selected";}  ?>>T.I</option>
                          <option <?php if($tipoDocumento=="CC"){echo "selected";}  ?>>C.C</option>
                          <option <?php if($tipoDocumento=="TE"){echo "selected";}  ?>>T.E</option>
                          <option <?php if($tipoDocumento=="CE"){echo "selected";}  ?>>C.E</option>
                          <option <?php if($tipoDocumento=="NIT"){echo "selected";}  ?>>Número de identificación tributaria</option>
                          <option <?php if($tipoDocumento=="PP"){echo "selected";}  ?>>Pasaporte</option>
                          <option <?php if($tipoDocumento=="DIE"){echo "selected";}  ?>>Permiso especial de permanencia</option>
                          <option <?php if($tipoDocumento=="NUIP"){echo "selected";}  ?>>Documento de identificación extranjero</option>
                          <option <?php if($tipoDocumento=="FOREIGN_NIT"){echo "selected";}  ?>>NUIP</option>
                          <option <?php if($tipoDocumento==""){echo "selected";}  ?>>NIT de otro país</option>
                            </select>
                            <div class="icono">
                            <i class="fas fa-user"></i>
                        </div>
                        </div>
                        <div class="form-input">
                        <input type="text" placeholder="Nombre" pattern="[A-Za-z0-9 ]{1,30}"  name="Nombre"  id="texto-usuario" aria-describedby="ingreso de usuario" >
                        <div class="icono">
                            <i class="fas fa-user"></i>
                        </div>
                    </div>
                        <div class="form-input">
                            <input type="text" placeholder="Apellido" name="Apellido"  id="texto-password" >
                            <div class="icono">
                            <i class="fas fa-user"></i>
                        </div>
                        </div>
                        <div class="form-input">
                            <input type="text" placeholder="Direccion" name="Direccion" class="form-control" id="texto-usuario" aria-describedby="ingreso de usuario" >
                            <div class="icono">
                            <i class="fas fa-user"></i>
                        </div>
                        </div>
                        <div class="form-input">
                            <input type="text" placeholder="Telefono" name="Telefono" class="form-control" id="texto-password" >
                            <div class="icono">
                            <i class="fas fa-user"></i>
                        </div>
                        </div>
                        <div class="form-input">
                            <input type="email" placeholder="Correo" name="Correo" class="form-control" id="texto-usuario" aria-describedby="ingreso de usuario" >
                            <div class="icono">
                            <i class="fas fa-envelope"></i> 
                        </div>
                        </div>
                        <div class="form-input">
                            <input type="password" placeholder="Cotraseña" minlength="8" name="Contrasena" class="form-control" id="texto-password" aria-describedby="ingreso de usuario">
                            <div class="icono">
                            <i class="fas fa-unlock"></i>
                        </div>
                        </div>
                        <div class="form-input">
                            <select name="idRol" class="form-control" id="texto-password">
                                <option value="1" disabled>Administrador</option>
                                <option value="2" selected>Cliente</option>
                                <option value="3" disabled>Domiciliario</option>

                            </select>
                            <div class="icono">
                            <i class="fas fa-user"></i>
                        </div>
                        </div>
                        <div class="form-terminos">
                        <input type="checkbox" id="acepto" value="">
                        <span>
                            Aceptar los
                            <a href="#" title="">términos</a> y 
                            <a href="#" title="">condiciones</a>
                        </span>
                    </div>
                        <button type="submit" class="btn-form registro" >INGRESAR</button>
                        <h5>Inicie Sesion <a href="login.php">Aquí</a></h5>
                </form>
                
                <!-- cambia el color de la carta con acierto, alerta y peligro -->
                <!-- <div class="carta-seccion acierto">
                    El usuario o contraseña es incorrecto
                </div> -->
            </div>
            
        </div>
    </div>
<br>
<br>
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
   <br>





   </body>
</html>