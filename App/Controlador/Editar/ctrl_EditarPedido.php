<?php
include("conexion.php");

$idPedido = $_POST['idPedido'];

$sql = "SELECT * FROM pedido WHERE idPedido = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $idPedido);

if ($stmt->execute()) {
    $resultado = $stmt->get_result();
    if ($fila = $resultado->fetch_assoc()) {
        echo json_encode($fila);
    } else {
        echo json_encode(["error" => "Pedido no encontrado."]);
    }
} else {
    echo json_encode(["error" => $stmt->error]);
}

$stmt->close();
$conn->close();
?>
