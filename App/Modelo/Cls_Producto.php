<?php
class Producto {
    private $idProducto;
    private $nombreProducto;
    private $descripcionProducto;
    private $precioProducto;
    private $descuentoProducto;
    private $categoriaProducto;
    private $estadoProducto;

    public function getIdProducto() {
        return $this->idProducto;
    }

    public function setIdProducto($idProducto) {
        $this->idProducto = $idProducto;
    }

    public function getNombreProducto() {
        return $this->nombreProducto;
    }

    public function setNombreProducto($nombreProducto) {
        $this->nombreProducto = $nombreProducto;
    }

    public function getDescripcionProducto() {
        return $this->descripcionProducto;
    }

    public function setDescripcionProducto($descripcionProducto) {
        $this->descripcionProducto = $descripcionProducto;
    }

    public function getPrecioProducto() {
        return $this->precioProducto;
    }

    public function setPrecioProducto($precioProducto) {
        $this->precioProducto = $precioProducto;
    }

    public function getDescuentoProducto() {
        return $this->descuentoProducto;
    }

    public function setDescuentoProducto($descuentoProducto) {
        $this->descuentoProducto = $descuentoProducto;
    }

    public function getCategoriaProducto() {
        return $this->categoriaProducto;
    }

    public function setCategoriaProducto($categoriaProducto) {
        $this->categoriaProducto = $categoriaProducto;
    }

    public function getEstadoProducto() {
        return $this->estadoProducto;
    }

    public function setEstadoProducto($estadoProducto) {
        $this->estadoProducto = $estadoProducto;
    }
}
?>
