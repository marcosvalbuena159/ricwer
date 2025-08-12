<?php
include("conexion.php");
include("cls_DetallePedido.php");

$detalle = new DetallePedido();
$detalle->setIdProductoFK($_POST['idProductoFK']);
$detalle->setCantidadProducto($_POST['cantidadProducto']);
$detalle->setPrecioProducto($_POST['precioProducto']);
$detalle->setSubtotalProducto($_POST['subtotalProducto']);
$detalle->setIdPedidoFK($_POST['idPedidoFK']);

$sql = "CALL Insertar_DetallePedido(?, ?, ?, ?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("iiddi",
    $detalle->getIdProductoFK(),
    $detalle->getCantidadProducto(),
    $detalle->getPrecioProducto(),
    $detalle->getSubtotalProducto(),
    $detalle->getIdPedidoFK()
);

if ($stmt->execute()) {
    echo "Detalle del pedido insertado correctamente.";
} else {
    echo "Error al insertar detalle del pedido: " . $stmt->error;
}

$stmt->close();
$conn->close();
?>
