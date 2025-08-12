<?php
include("conexion.php");

$idDetalle = $_POST['idDetallePedido'];
$idProducto = $_POST['idProducto'];
$cantidad = $_POST['cantidad'];
$precio = $_POST['precio'];
$subtotal = $_POST['subtotal'];

$sql = "CALL Actualizar_DetallePedido(?, ?, ?, ?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("iiidd", $idDetalle, $idProducto, $cantidad, $precio, $subtotal);

if ($stmt->execute()) {
    echo "Detalle del pedido actualizado correctamente.";
} else {
    echo "Error al actualizar el detalle del pedido: " . $stmt->error;
}

$stmt->close();
$conn->close();
?>
