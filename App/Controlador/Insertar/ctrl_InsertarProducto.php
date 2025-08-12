<?php
include("conexion.php");
include("cls_Producto.php");

$producto = new Producto();
$producto->setNombreProducto($_POST['nombreProducto']);
$producto->setDescripcionProducto($_POST['descripcionProducto']);
$producto->setPrecioProducto($_POST['precioProducto']);
$producto->setDescuentoProducto($_POST['descuentoProducto']);
$producto->setCategoriaProducto($_POST['categoriaProducto']);
$producto->setEstadoProducto($_POST['estadoProducto']);

$sql = "CALL Insertar_Producto(?, ?, ?, ?, ?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ssdiss",
    $producto->getNombreProducto(),
    $producto->getDescripcionProducto(),
    $producto->getPrecioProducto(),
    $producto->getDescuentoProducto(),
    $producto->getCategoriaProducto(),
    $producto->getEstadoProducto()
);

if ($stmt->execute()) {
    echo "Producto insertado correctamente.";
} else {
    echo "Error al insertar producto: " . $stmt->error;
}

$stmt->close();
$conn->close();
?>
