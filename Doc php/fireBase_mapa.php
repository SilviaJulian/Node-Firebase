<?php

require_once 'transactions.php';

/**
 * Clase FireBase_mapa crea la imagen el mapa estatico 
 * Software Sistema de Gestión de Movilidad©
 * @copyright Cad&Lan
 * @package peticion
 * @final
 */
final Class FireBase_mapa extends Transactions {

    /**
     * Atributo privado para el query SQL.
     * @access private
     * @var string 
     */
    private $_sql;

    /**
     * Atributo privado para API de google.
     * @access private
     * @var string
     */
    private $_api_mapa= 'https://maps.googleapis.com/maps/api/staticmap?';

    /**
     * Atributo privado para key del API de google.
     * @access private
     * @var string
     */
    private $_api_key= 'AIzaSyA1rVYLn-pdhGFexZMlv4yULml6w5zlNGM';

    /**
     * Atributo privado para el tipo de imagen.
     * @access private
     * @var String
     */
    private $_img_type='.png';

    /**
     * Atributo privado para el tipo de mapa.
     * @access private
     * @var String
     */
    private $_mapa_type= 'terrain';

    /**
     * Atributo privado para el tamaño del mapa.
     * @access private
     * @var String
     */
    private $_mapa_size= '700x600';
    /**
     * Atributo privado para el color de la ruta.
     * @access private
     * @var String
     */
    private $_mapa_color= '0x00BFFF';

    /**
     * Atributo privado para la url del mapa.
     * @access private
     * @var String
     */
    private $_mapa_url;

    /**
     * Atributo privado para la url del mapa.
     * @access private
     * @var String
     */
    private $_desFolder = 'img/';

    /**
     * Constructor de la clase Campañas, para invocar el Constructor de la Clase heredada.
     * @access public
     */
    public function __construct() {
       
    }

    /**
     * Funcion para LISTAR los registros de la tabla cconfig.
     * @access public
     * @param int $tipo Se utiliza para establecer el tipo de devolucion.
     * @return object El Juego de Resultados.
     */
    public function createMapa($data) {
        if (isset($data)) {
            $this->_mapa_url = $this->_api_mapa . 'path=color:' .$this->_mapa_color .'|weight:4|' + $data.tracking. '&size=' .$this->_mapa_size .'&maptype='  .$this->_mapa_type . $data['markers']. '&key=' .$this->_api_key;
        
            $time = time();
            $_nom_image = $data['nomFile'] . $time . $_img_type;
            $_path_image = $this->_desFolder . $_nom_image;
    
            file_put_contents($_path_image, file_get_contents($this->_mapa_url));
        
    }
      
  return "Hola";
      //  $this->_sql = "SELECT id,number,description FROM cday WHERE id between 1 and 8 ORDER BY id ASC;";
       
    }

   
    /**
     * Manda a pantalla, cuando se invoca la Clase a cadena.
     * @access public
     * @return string
     */
    public function __toString() {
        return 'El archivo expira al imprimir.';
    }

    /**
     * Evita clonar la Clase.
     * @access public
     * @throws Exception
     */
    public function __clone() {
        throw new Exception("Clonación->Copias idénticas de un organismo, célula o molécula ya desarrollado. Dolly");
    }

    /**
     * El Destructor de la Clase Base.
     * @access public
     * @return void
     */
    public function __destruct() {
        // empty
    }

}
