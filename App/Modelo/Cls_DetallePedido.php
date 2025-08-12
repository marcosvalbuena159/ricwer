<?php
class DetallePedido {
    private $idDetallePedido;
    private $idProductoFK;
    private $cantidadProducto;
    private $precioProducto;
    private $subtotalProducto;
    private $idPedidoFK;

    public function getIdDetallePedido() {
        return $this->idDetallePedido;
    }

    public function setIdDetallePedido($idDetallePedido) {
        $this->idDetallePedido = $idDetallePedido;
    }

    public function getIdProductoFK() {
        return $this->idProductoFK;
    }

    public function setIdProductoFK($idProductoFK) {
        $this->idProductoFK = $idProductoFK;
    }

    public function getCantidadProducto() {
        return $this->cantidadProducto;
    }

    public function setCantidadProducto($cantidadProducto) {
        $this->cantidadProducto = $cantidadProducto;
    }

    public function getPrecioProducto() {
        return $this->precioProducto;
    }

    public function setPrecioProducto($precioProducto) {
        $this->precioProducto = $precioProducto;
    }

    public function getSubtotalProducto() {
        return $this->subtotalProducto;
    }

    public function setSubtotalProducto($subtotalProducto) {
        $this->subtotalProducto = $subtotalProducto;
    }

    public function getIdPedidoFK() {
        return $this->idPedidoFK;
    }

    public function setIdPedidoFK($idPedidoFK) {
        $this->idPedidoFK = $idPedidoFK;
    }
}
?>
