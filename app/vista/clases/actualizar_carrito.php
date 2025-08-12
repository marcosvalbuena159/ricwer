<?php
session_start();
require_once '../../config/config.php';

if(isset($_POST['action'])) {
    $action = $_POST['action'];
    $id = isset($_POST['id']) ? $_POST['id'] : 0;
    
    if($action == 'agregar') {
        $cantidad = isset($_POST['cantidad']) ? $_POST['cantidad'] : 0;
        $respuesta = array();
        $respuesta['ok'] = true;
        
        if($id > 0 && $cantidad > 0) {
            if(isset($_SESSION['carrito']['productos'][$id])) {
                $_SESSION['carrito']['productos'][$id] = $cantidad;
                
                // Cargar información del producto para actualizar el subtotal
                require_once '../../config/cls_Conexion.php';
                $objConexion = new clsConexion();
                $conn = $objConexion->__construct();
                
                $sql = $conn->prepare("SELECT precioProducto, descuentoProducto FROM producto WHERE idProducto = ?");
                $sql->execute([$id]);
                $row = $sql->fetch(PDO::FETCH_ASSOC);
                
                $precio = $row['precioProducto'];
                $descuento = $row['descuentoProducto'];
                $precio_desc = $precio - (($precio * $descuento) / 100);
                $subtotal = $cantidad * $precio_desc;
                
                $respuesta['sub'] = MONEDA . number_format($subtotal, 2, '.', ',');
                $respuesta['ok'] = true;
            } else {
                $respuesta['ok'] = false;
            }
        } else {
            $respuesta['ok'] = false;
        }
        
    } else if($action == 'eliminar') {
        if(isset($_SESSION['carrito']['productos'][$id])) {
            unset($_SESSION['carrito']['productos'][$id]);
            $respuesta['ok'] = true;
        } else {
            $respuesta['ok'] = false;
        }
    } else {
        $respuesta['ok'] = false;
    }
} else {
    $respuesta['ok'] = false;
}

echo json_encode($respuesta);
?>