<?php
class Rol {
    private $idRolUsuario;
    private $descripRolUsuario;
    private $estadoRolUsuario;

    public function getIdRolUsuario() {
        return $this->idRolUsuario;
    }

    public function setIdRolUsuario($idRolUsuario) {
        $this->idRolUsuario = $idRolUsuario;
    }

    public function getDescripRolUsuario() {
        return $this->descripRolUsuario;
    }

    public function setDescripRolUsuario($descripRolUsuario) {
        $this->descripRolUsuario = $descripRolUsuario;
    }

    public function getEstadoRolUsuario() {
        return $this->estadoRolUsuario;
    }

    public function setEstadoRolUsuario($estadoRolUsuario) {
        $this->estadoRolUsuario = $estadoRolUsuario;
    }
}
?>
