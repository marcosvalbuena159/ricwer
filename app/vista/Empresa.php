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

    
    <section class="d-flex flex-column justify-content-center align-items-center pt-5  text-center w-50 m-auto" id="intro">
        <p class="p-3  fs-4">
           <b>RICWER</b>     
        </p>   
    </section>
    <section class="seccion-perfil-usuario">

    <div class="perfil-usuario-body">
        <div class="perfil-usuario-footer">
            <ul class="lista-datos">
                <li><i class="icono fas fa-building"></i> Direccion: Cra. 46 #69d Sur-76 a 69d Sur-48, Bogotá</li>
                <li><i class="icono fas fa-building"></i> Telefono: 300-311-8379</li>

            </ul>
            <ul class="lista-datos">
                <li><i class="icono fas fa-building"></i> Horario: 08:00am a 08:00pm</li>
                <li><i class="icono fas fa-building"></i> Correo: ricwer.oficial@gmail.com</li>

            </ul>
        </div>

    </div>
</section>
<br>
<section class="d-flex flex-column justify-content-center align-items-center pt-5  text-center w-50 m-auto" id="intro">
        <p class="p-3  fs-4">
           <b>MISION</b >
           <br>
           <b>En Ricwer, nuestra misión es proporcionar a nuestros clientes una experiencia de compra de calzado excepcional mediante una plataforma en línea innovadora y fácil de usar. Nos dedicamos a ofrecer una amplia gama de calzado de alta calidad para hombres, mujeres y niños, combinando estilo, comodidad y durabilidad. Nuestro objetivo es satisfacer las necesidades de nuestros clientes con un servicio personalizado, eficiente y seguro, mientras nos mantenemos comprometidos con la excelencia en cada aspecto de nuestro negocio.</b >     
        </p>   
    </section>
<br>

<section class="d-flex flex-column justify-content-center align-items-center pt-5  text-center w-50 m-auto" id="intro">
        <p class="p-3  fs-4">
           <b>VISION</b >
           <br>
           <b>Nuestra visión es convertirnos en el líder del mercado en calzado en línea, reconocido por nuestra capacidad para ofrecer productos de moda, innovadores y accesibles. Buscamos expandir nuestra presencia global, aprovechando la tecnología para mejorar continuamente la experiencia del usuario y establecer relaciones duraderas con nuestros clientes. En Ricwer, aspiramos a ser la opción preferida para aquellos que buscan calidad y estilo en cada paso que dan.</b >     
        </p>   
    </section>
<br>

<section class="d-flex flex-column justify-content-center align-items-center pt-5  text-center w-50 m-auto" id="intro">
        <p class="p-3  fs-4">
           <b>TERMINOS Y CONDICIONES</b>
           <br>
           <br>
           <b>1. Aceptación de los Términos</b>   
           <br>  
           <b>Al acceder y utilizar el sitio web de Ricwer, usted acepta cumplir con estos Términos y Condiciones. Si no está de acuerdo con alguno de los términos, por favor, no utilice nuestro sitio web.</b> 
           <br>  
           <br>
           <b>2. Registro y Perfil de Usuario</b>   
           <br>  
           <b>Para acceder a ciertas funcionalidades del sitio web, es necesario registrarse y crear una cuenta. Usted es responsable de mantener la confidencialidad de su información de inicio de sesión y de todas las actividades que ocurran bajo su cuenta.</b> 
           <br>  
           <br>
           <b>3. Uso del Sitio Web</b>   
           <br>  
           <b>Usted se compromete a utilizar el sitio web de Ricwer únicamente para fines legales y de acuerdo con todas las leyes y regulaciones aplicables. Está prohibido utilizar el sitio web para fines fraudulentos o para transmitir contenido que sea ilegal, difamatorio o que infrinja derechos de propiedad intelectual.</b> 
           <br>  
           <br>
           <b>4. Compra de Productos</b>   
           <br>  
           <b>Los pedidos realizados a través del sitio web están sujetos a la disponibilidad de los productos y a la confirmación del precio. Ricwer se reserva el derecho de rechazar o cancelar cualquier pedido en cualquier momento.</b> 
           <br>  
           <br>
           <b>5. Protección de Datos</b>   
           <br>  
           <b>La información personal que proporcionan los usuarios se almacenará de manera segura en una base de datos local y se utilizará conforme a nuestra Política de Privacidad. Implementamos medidas de seguridad para proteger los datos personales y transaccionales de nuestros usuarios, cumpliendo con las normativas vigentes de protección de datos.</b> 
           <br>  
           <br>
           <b>6. Modificaciones</b>   
           <br>  
           <b>Ricwer se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento. Cualquier cambio será publicado en el sitio web, y el uso continuo del sitio web después de la publicación de los cambios constituye la aceptación de los nuevos términos.</b> 
           <br>  
           <br>
           <b>7. Enlaces a Terceros</b>   
           <br>  
           <b>El sitio web puede contener enlaces a otros sitios web. Ricwer no se hace responsable del contenido, las políticas de privacidad o las prácticas de cualquier sitio web de terceros.</b> 
           <br>  
           <br>
           <b>8. Responsabilidad</b>   
           <br>  
           <b>Ricwer no será responsable por daños directos, indirectos, incidentales, especiales o consecuentes que resulten del uso o incapacidad para usar el sitio web, incluyendo pero no limitado a, pérdidas de ganancias o datos.</b>   
           <br>  
           <br>
           <b>9. Ley Aplicable</b>   
           <br>  
           <b>Estos Términos y Condiciones se regirán e interpretarán de acuerdo con las leyes del país en el que Ricwer opera, sin tener en cuenta los principios de conflicto de leyes.</b> 
           <br>
           <br>
           <b>10. Contacto</b>   
           <br>  
           <b>Para cualquier pregunta o inquietud relacionada con estos Términos y Condiciones, puede ponerse en contacto con nosotros a través de correo electrónico de contacto o número de teléfono.</b> 

        </p>   
    </section>
<br>


<br>


<br>
<br>
<br>
<br>
<br>

<section id="seccion-contacto">
  <!--========================================================== -->
                        <!-- CONTENEDOR DEL FORMULARIO -->
  <!--========================================================== -->
        <div class="redes-sociales">
            <a href="" class="boton-redes facebook fab fa-facebook-f"><i class="icon-facebook"></i></a>
            <a href="" class="boton-redes twitter fab fa-twitter"><i class="icon-twitter"></i></a>
            <a href="" class="boton-redes instagram fab fa-instagram"><i class="icon-instagram"></i></a>
        </div>
  
        
        
        
        
        
        <div class="container  border-top border-primary " style="max-width: 500px" id="contenedor-formulario">
          <div class="text-center mb-4" id="titulo-formulario">
            <div><img src="./img/support.png" alt="" class="img-fluid ps-5"></div>
            <h2>Comentarios</h2>
            <p class="fs-5">Escribe tus inconformidades o tus agradecimientos.</p>
          </div>
          <form+   method="POST" data-netlify="true" action="#">     
                <div class= "mb-3">           
                  <input type="email" class="form-control" id="email" name="email" placeholder="ricwer2011@hotmail.com">
                </div>
      
              
                <div class="mb-3">            
                  <input type="input" class="form-control" id="name" name="name" placeholder="jose yebrail valbuena">
                </div>
          
      
                <div class="mb-3">
                  <input type="tel" class="form-control" name="phone" id="phone" placeholder="3003118379">
                </div>
      
              <div class="mb-3">       
                <textarea class="form-control" name="message" id="message" rows="4"></textarea>
              </div>
      
              <div class="mb-3">
                <button type="submit" class=" btn btn-primary w-100 fs-5">Enviar Mensaje</button>
              </div>
          </form>
      </div>
    <!--</div>-->
  </section>
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

