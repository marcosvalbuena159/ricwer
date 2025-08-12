<?php
session_start();
require_once '../../config/config.php';

if(isset($_POST['idProducto']) && isset($_POST['token'])) {
    $id = $_POST['idProducto'];
    $token = $_POST['token'];
    
    $token_tmp = hash_hmac('sha1', $id, KEY_TOKEN);
    
    if($token == $token_tmp) {
        // Verificar si el carrito ya existe en la sesión
        if(isset($_SESSION['carrito']['productos'][$id])) {
            $_SESSION['carrito']['productos'][$id] += 1;
        } else {
            $_SESSION['carrito']['productos'][$id] = 1;
        }
        
        $datos['numero'] = count($_SESSION['carrito']['productos']);
        $datos['ok'] = true;
    } else {
        $datos['ok'] = false;
    }
} else {
    $datos['ok'] = false;
}

echo json_encode($datos);
?>