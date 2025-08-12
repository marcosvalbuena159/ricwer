<?php
require_once ('../../config/Cls_conexion.php');
class clsProducto extends clsConexion
{
    //Variables del usuario
    private $idProducto;
    private $descripcionProducto;
    private $precioProducto;
    private $categoriaProducto;
    private $db;

    public function __construct() //construct lleva dos guiones bajos
    {
        $this->db=parent:: __construct();
    }

    //Encapsulamiento de Variabls de Usuario
    public function setidProducto($idPr)
    {
        $this->idProducto = $idPr;
    }    
    public function getidProducto()
    {
        return $this->idProducto;
    }
    public function setdescripcionProducto($desPro)
    {
        $this->descripcionProducto = $desPro;
    }    
    public function getdescripcionProducto()
    {
        return $this->descripcionProducto;
    }
    public function setprecioProducto($prePro)
    {
        $this->precioProducto = $prePro;
    }    
    public function getprecioProducto()
    {
        return $this->precioProducto;
    }
    public function setcategoriaProducto($catPro)
    {
        $this->categoriaProducto = $catPro;
    }    
    public function getcategoriaProducto()
    {
        return $this->categoriaProducto;
    }


    public function consultar_producto()
    {
        $Consulta = $this->db->prepare("SELECT `idProducto`, `descripcionProducto`, `precioProducto`, `categoriaProducto` FROM `producto`");
        $filas=null;
        $Consulta->execute();

        while($resultado = $Consulta->fetch())
        {
            $filas[]=$resultado;
        }
        return $filas;
    }
    public function Actualizar()
    {
        //$estado = 'Activo';

        try{
            $Consulta = $this->db->prepare("CALL Actualizar_ProductoId(:idPr,:tdoc, :numdoc)");
            /*INSERT INTO usuario (TipoDocUsuario, NumdocUsuario, nombreUsuario, apellidoUsuario,
            direccionUsuario, telefonoUsuario, correoUsuario, passwordUsuario, estadoUsuario, idRolUsuarioFK) VALUES (:tdoc, :numdoc, :nom,
            :ape, :dir, :tel, :cor, :pass, :est, :idR)");*/
            $Consulta->bindParam(':idPr',$this->idProducto);
            $Consulta->bindParam(':tdoc',$this->tipoDocumento);
            $Consulta->bindParam(':numdoc',$this->documento);
            /*$Consulta->bindParam(':nom',$this->nombre);
            $Consulta->bindParam(':ape',$this->apellido);
            $Consulta->bindParam(':dir',$this->direccion);
            $Consulta->bindParam(':tel',$this->telefono);
            $Consulta->bindParam(':cor',$this->correo);
            $Consulta->bindParam(':pass',$this->contrasena);
            $Consulta->bindParam(':est',$estado);
            $Consulta->bindParam(':idR',$this->idRol);*/
            $Consulta->execute();
            header('location:../../vista/EditarProducto.php?mensaje=actualizo');
        }
        catch(PDOException $error)
        {
            header('location:../../vista/EditarProducto.php?mensaje=noactualizo');
        }

    }

    public function EliminarUsuario()
    {
        $Consulta=$this->db->prepare("CALL Eliminar_producto (:idPr)");
        $Consulta->bindParam(':idPr',$this->idProducto);
        if ($Consulta->execute()) {
            header('location:../../vista/EditarProducto.php?mensaje=elimino');
        }
        else{
            header('location:../../vista/EditarProducto.php?mensaje=noelimino');
        }
    }
    public function Register()
    {
        $estado = 'Activo';

        try{
            $consulta = $conn->prepare("SELECT `idProducto`, `descripcionProducto`, `precioProducto` FROM `producto` WHERE 1");
            $Consulta->execute();
            $resultado = $sql->fetchALL(PDO::FETCH_ASSOC)
            $Consulta->execute();
            header('location:../vista/registro_usuario.php?mensaje=ingreso');
        }
        catch(PDOException $error)
        {
            header('location:../vista/registro_usuario.php?mensaje=noingreso');
        }

    }

}
?> 
