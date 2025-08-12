<?php
include("conexion.php");

$idProducto = $_POST['idProducto'];

$sql = "SELECT * FROM producto WHERE idProducto = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $idProducto);

if ($stmt->execute()) {
    $resultado = $stmt->get_result();
    if ($fila = $resultado->fetch_assoc()) {
        echo json_encode($fila);
    } else {
        echo json_encode(["error" => "Producto no encontrado."]);
    }
} else {
    echo json_encode(["error" => $stmt->error]);
}

$stmt->close();
$conn->close();
?>
