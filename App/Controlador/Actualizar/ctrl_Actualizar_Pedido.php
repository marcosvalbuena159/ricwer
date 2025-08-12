<?php
include("conexion.php");

$idPedido = $_POST['idPedido'];
$nuevoEstado = $_POST['estado'];

$sql = "CALL Actualizar_EstadoPedido(?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("is", $idPedido, $nuevoEstado);

if ($stmt->execute()) {
    echo "Estado del pedido actualizado correctamente.";
} else {
    echo "Error al actualizar el pedido: " . $stmt->error;
}

$stmt->close();
$conn->close();
?>
