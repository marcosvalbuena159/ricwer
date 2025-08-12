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
    $lista_carrito=array();
    
    // Inicializar contador de carrito
    $num_cart = 0;
    
    // Verificar si existe el carrito en la sesión
    if(isset($_SESSION['carrito']['productos'])) {
        $productos = $_SESSION['carrito']['productos'];
        
        // Contar productos en el carrito
        $num_cart = count($productos);
        
        if($num_cart > 0){
            foreach ($productos as $clave => $cantidad){
                // Corregir la consulta SQL
                $sql = $conn->prepare("SELECT idProducto, nombreProducto, descripcionProducto, precioProducto, descuentoProducto FROM producto WHERE idProducto = ?");
                $sql->execute([$clave]);
                $producto = $sql->fetch(PDO::FETCH_ASSOC);
                
                if($producto){
                    // Agregar la cantidad al producto
                    $producto['cantidad'] = $cantidad;
                    $lista_carrito[] = $producto;
                }
            }
        }
    }
?>
<!DOCTYPE html>
<html lang="es">
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
    <!-- Font Awesome para los iconos del carrito -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <title>Ricwer - Carrito de Compras</title>
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
        <a href="carrito.php" class="nav-link">
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
    </div>
    </nav>
          </div>
        </div>
</nav>

<main class="flex-shrink-0">
        <div class="container">
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Precio</th>
                            <th>Cantidad</th>
                            <th>Subtotal</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if(empty($lista_carrito)){
                            echo '<tr><td colspan="5" class="text-center"><b>Carrito vacío</b></td></tr>';
                        }else {
                            $total = 0;
                            foreach($lista_carrito as $producto){
                                $_id = $producto['idProducto'];
                                $nombre = $producto['nombreProducto'];
                                $precio = $producto['precioProducto'];
                                $descuento = $producto['descuentoProducto'];
                                $cantidad = $producto['cantidad'];
                                $precio_desc = $precio - (($precio * $descuento) / 100);
                                $subtotal = $cantidad * $precio_desc;
                                $total += $subtotal;
                            ?>
                                <tr>
                                    <td><?php echo $nombre; ?></td>
                                    <td><?php echo MONEDA . number_format($precio_desc, 2, '.', ',');?></td>
                                    <td><input type="number" min="1" max="10" step="1" value="<?php echo $cantidad; ?>" size="5" id="cantidad_<?php echo $_id; ?>" onchange="actualizaCantidad(this.value, <?php echo $_id; ?>)" /></td>

                                    <td>
                                        <div id="subtotal_<?php echo $_id; ?>" name="subtotal[]"><?php echo MONEDA . number_format($subtotal, 2, '.', ',');?></div>
                                    </td>
                                    <td><a href="#" class="btn btn-warning btn-sm btn-eliminar" data-bs-id="<?php echo $_id; ?>" data-bs-toggle="modal" data-bs-target="#eliminaModal">Eliminar</a></td>
                                </tr>
                            <?php }
                        }?>
                            <tr>
                                <td colspan="3"></td>
                                <td colspan="2">
                                    <p class="h3" id="total"><?php echo MONEDA . number_format($total, 2, '.', ',');?></p>
                                </td>
                            </tr>
                    </tbody>
                </table>
            </div>

            <div class="row">
                <div class="col-md-5 offset-md-7 d-grid gap-2">
                    <?php if(!empty($lista_carrito)) { ?>
                        <?php if($login) { ?>
                            <button id="btn-pagar" class="btn btn-primary btn-lg">Realizar pago</button>
                        <?php } else { ?>
                            <a href="login.php" class="btn btn-primary btn-lg">Iniciar sesión para pagar</a>
                        <?php } ?>
                    <?php } ?>
                </div>
            </div>
        </div>
    </main>

    <div class="modal fade" id="eliminaModal" tabindex="-1" aria-labelledby="eliminaModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-sm">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="eliminaModalLabel">Alerta</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    ¿Desea eliminar el producto de la lista?
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    <button id="btn-elimina" type="button" class="btn btn-danger" onclick="elimina()">Eliminar</button>
                </div>
            </div>
        </div>
    </div>
    
    <section class="contenedor">
        <!-- Contenedor de elementos -->
        <div class="contenedor-items">
            <div class="item">
                <span class="titulo-item">Box Engasse</span>
                <img src="../../public/img/001.jpeg" alt="" class="img-item">
                <span class="precio-item">$15.000</span>
                <button class="boton-item" onclick="addProducto(1, '<?php echo hash_hmac('sha1', '1', KEY_TOKEN); ?>')">Agregar al Carrito</button>
            </div>
            <div class="item">
                <span class="titulo-item">English Horse</span>
                <img src="../../public/img/002.jpeg" alt="" class="img-item">
                <span class="precio-item">$25.000</span>
                <button class="boton-item" onclick="addProducto(2, '<?php echo hash_hmac('sha1', '2', KEY_TOKEN); ?>')">Agregar al Carrito</button>
            </div>
            <div class="item">
                <span class="titulo-item">Knock Nap</span>
                <img src="../../public/img/003.jpeg" alt="" class="img-item">
                <span class="precio-item">$35.000</span>
                <button class="boton-item" onclick="addProducto(3, '<?php echo hash_hmac('sha1', '3', KEY_TOKEN); ?>')">Agregar al Carrito</button>
            </div>
            <div class="item">
                <span class="titulo-item">La Night</span>
                <img src="../../public/img/004.jpeg" alt="" class="img-item">
                <span class="precio-item">$18.000</span>
                <button class="boton-item" onclick="addProducto(4, '<?php echo hash_hmac('sha1', '4', KEY_TOKEN); ?>')">Agregar al Carrito</button>
            </div>
            <div class="item">
                <span class="titulo-item">Silver All</span>
                <img src="../../public/img/105.jpeg" alt="" class="img-item">
                <span class="precio-item">$32.000</span>
                <button class="boton-item" onclick="addProducto(5, '<?php echo hash_hmac('sha1', '5', KEY_TOKEN); ?>')">Agregar al Carrito</button>
            </div>
        </div>

        <!-- Carrito de Compras visual -->
        <div class="carrito" id="carrito-compras" style="display:none;">
            <div class="header-carrito">
                <h2>Tu Carrito</h2>
            </div>
            <div class="carrito-items">
                <!-- Aquí se agregarán los items dinámicamente -->
            </div>
            <div class="carrito-total">
                <div class="fila">
                    <strong>Tu Total</strong>
                    <span class="carrito-precio-total">$0,00</span>
                </div>
                <button class="btn-pagar">Pagar <i class="fa-solid fa-bag-shopping"></i></button>
            </div>
        </div>
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
                    <li><a href="https://www.facebook.com/ricwer/"><i class="bi bi-facebook"></i></a></li>
                    <li><a href="https://www.instagram.com/ricwer_oficial/"><i class="bi bi-instagram"></i></a></li>
                    <li><a href="https://www.x.com/ricwer_oficial/"><i class="bi bi-twitter"></i></a></li>
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
    // Modal para eliminar producto
    let eliminaModal = document.getElementById('eliminaModal')
    eliminaModal.addEventListener('show.bs.modal', function(event) {
        // Button that triggered the modal
        let button = event.relatedTarget
        // Extract info from data-bs-* attributes
        let recipient = button.getAttribute('data-bs-id')
        let botonElimina = eliminaModal.querySelector('.modal-footer #btn-elimina')
        botonElimina.value = recipient
    })

    // Función para actualizar la cantidad de un producto
    function actualizaCantidad(cantidad, id) {
        let url = 'clases/actualizar_carrito.php';
        let formData = new FormData();
        formData.append('action', 'agregar');
        formData.append('id', id);
        formData.append('cantidad', cantidad);

        fetch(url, {
                method: 'POST',
                body: formData,
                mode: 'cors',
            }).then(response => response.json())
            .then(data => {
                if (data.ok) {
                    let divSubtotal = document.getElementById('subtotal_' + id)
                    divSubtotal.innerHTML = data.sub

                    let total = 0.00
                    let list = document.getElementsByName('subtotal[]')

                    for (var i = 0; i < list.length; ++i) {
                        total += parseFloat(list[i].innerHTML.replace(/[$,]/g, ''))
                    }

                    total = new Intl.NumberFormat('en-US', {
                        minimumFractionDigits: 2
                    }).format(total)
                    document.getElementById("total").innerHTML = '$' + total
                } else {
                    alert("No hay suficientes productos en el stock")
                    let inputCantidad = document.getElementById('cantidad_' + id);
                    inputCantidad.value = data.cantidadAnterior;
                }
            })
    }

    // Función para eliminar un producto del carrito
    function elimina() {
        let botonElimina = document.getElementById('btn-elimina')
        let recipient = botonElimina.value

        let url = 'clases/actualizar_carrito.php';
        let formData = new FormData();
        formData.append('action', 'eliminar');
        formData.append('id', recipient);

        fetch(url, {
                method: 'POST',
                body: formData,
                mode: 'cors',
            }).then(response => response.json())
            .then(data => {
                if (data.ok) {
                    location.reload();
                }
            })
    }

    // Función para agregar un producto al carrito
    function addProducto(id, token) {
        let url = 'clases/carrito.php';
        let formData = new FormData();
        formData.append('idProducto', id);
        formData.append('token', token);

        fetch(url, {
                method: 'POST',
                body: formData,
                mode: 'cors'
            }).then(response => response.json())
            .then(data => {
                if (data.ok) {
                    let elemento = document.getElementById("num_cart")
                    elemento.innerHTML = data.numero;
                    // Recargar la página después de agregar al carrito
                    setTimeout(function() {
                        location.reload();
                    }, 500);
                } else {
                    alert("Error al agregar el producto");
                }
            })
    }

    // Evento para el botón de pago
    document.addEventListener('DOMContentLoaded', function() {
        let btnPagar = document.getElementById('btn-pagar');
        if(btnPagar) {
            btnPagar.addEventListener('click', function() {
                alert("Gracias por su compra. Procesando su pago...");
                // Aquí puedes redirigir a una página de pago o procesar el pago
                // window.location.href = 'procesar_pago.php';
            });
        }
    });
</script>
</body>
</html>