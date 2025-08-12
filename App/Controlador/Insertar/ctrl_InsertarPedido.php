<?php
include("conexion.php");
include("cls_Pedido.php");

$pedido = new Pedido();
$pedido->setFechaPedido($_POST['fechaPedido']);
$pedido->setHoraPedido($_POST['horaPedido']);
$pedido->setTotalPedido($_POST['totalPedido']);
$pedido->setEstadoPedido($_POST['estadoPedido']);
$pedido->setPedidoaDomicilio($_POST['pedidoaDomicilio']);
$pedido->setIdUsuarioFK($_POST['idUsuarioFK']);

$sql = "CALL Insertar_Pedido(?, ?, ?, ?, ?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ssds si", 
    $pedido->getFechaPedido(),
    $pedido->getHoraPedido(),
    $pedido->getTotalPedido(),
    $pedido->getEstadoPedido(),
    $pedido->getPedidoaDomicilio(),
    $pedido->getIdUsuarioFK()
);

if ($stmt->execute()) {
    echo "Pedido insertado correctamente.";
} else {
    echo "Error al insertar pedido: " . $stmt->error;
}

$stmt->close();
$conn->close();
?>
