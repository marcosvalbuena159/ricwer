<?php
class Pedido {
    private $idPedido;
    private $fechaPedido;
    private $horaPedido;
    private $totalPedido;
    private $estadoPedido;
    private $pedidoaDomicilio;
    private $idUsuarioFK;

    public function getIdPedido() {
        return $this->idPedido;
    }

    public function setIdPedido($idPedido) {
        $this->idPedido = $idPedido;
    }

    public function getFechaPedido() {
        return $this->fechaPedido;
    }

    public function setFechaPedido($fechaPedido) {
        $this->fechaPedido = $fechaPedido;
    }

    public function getHoraPedido() {
        return $this->horaPedido;
    }

    public function setHoraPedido($horaPedido) {
        $this->horaPedido = $horaPedido;
    }

    public function getTotalPedido() {
        return $this->totalPedido;
    }

    public function setTotalPedido($totalPedido) {
        $this->totalPedido = $totalPedido;
    }

    public function getEstadoPedido() {
        return $this->estadoPedido;
    }

    public function setEstadoPedido($estadoPedido) {
        $this->estadoPedido = $estadoPedido;
    }

    public function getPedidoaDomicilio() {
        return $this->pedidoaDomicilio;
    }

    public function setPedidoaDomicilio($pedidoaDomicilio) {
        $this->pedidoaDomicilio = $pedidoaDomicilio;
    }

    public function getIdUsuarioFK() {
        return $this->idUsuarioFK;
    }

    public function setIdUsuarioFK($idUsuarioFK) {
        $this->idUsuarioFK = $idUsuarioFK;
    }
}
?>
