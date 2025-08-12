<?php
include("../..conexion.php");

$idRol = $_POST['idRol'];

$sql = "SELECT * FROM rolUsuario WHERE idRolUsuario = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $idRol);

if ($stmt->execute()) {
    $resultado = $stmt->get_result();
    if ($fila = $resultado->fetch_assoc()) {
        echo json_encode($fila);
    } else {
        echo json_encode(["error" => "Rol no encontrado."]);
    }
} else {
    echo json_encode(["error" => $stmt->error]);
}

$stmt->close();
$conn->close();
?>
