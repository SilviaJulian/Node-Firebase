/**
* Constante para escribir errores
* @access private
*/
let logger = require('./logger.js').Logger;

/**
*Constante para acceder a la Base de Datos.
*@access private
*/
let myDB = require('./ConctMysql/conexion-mysql.js');

/**
 * Variables para lectura y escritura de Ficheros 
 * @access private
 */
let objFile = require('fs');

/**
* Atributo privado para convertir imagenes a base64.
* @access private
*/
let base64Img = require('base64-img');

/**
 * Atributo privado para API de google.
 * @access private
 * @var string
 */
let api_mapa = 'https://maps.googleapis.com/maps/api/staticmap?';

/**
 * Atributo privado para key del API de google.
 * @access private
 * @var string
 */
let api_key = 'AIzaSyA1rVYLn-pdhGFexZMlv4yULml6w5zlNGM';

/**
 * Atributo privado para el tipo de mapa.
 * @access private
 * @var String
 */
let mapa_type = 'terrain';

/**
 * Atributo privado para el tamaño del mapa.
 * @access private
 * @var String
 */
let mapa_size = '700x600';

/**
 * Atributo privado para el color de la ruta.
 * @access private
 * @var String
 */
let mapa_color = '0x00BFFF';

/**
 * Atributo privado para la url del mapa.
 * @access private
 * @var String
 */
let mapa_url;

/**
 * Atributo privado para la url del mapa.
 * @access private
 * @var String
 */
let desFolder = 'ImgRutas/';

/**
 * Atributo privado
 * @access private
 * @var Json
 */
let request = {};

/**
 * Atributo privado parael tipo de la imagen.
 * @access private
 * @var String
 */
let img_type = 'png';

/**
 * Atributo privado para generar la ruta.
 * @access private
 * @var String
 */
let rutaTracking;

/**
 * Atributo privado para generar los markers.
 * @access private
 * @var String
 */
let markers;

/**
 * Atributo privado para generar estilos del mapa.
 * @access private
 * @var String
 */
let styles = "&style=feature:poi%7Celement:all%7Cvisibility:off";

/**
 * Atributo privado para hacer referencia al folder de Imagenes publicas.
 * @access private
 * @var String
 */
let urlImg = "http://187.210.13.75:4900/images/map/";

/**
 * Función que crea la ruta de un conductor
 * @access public
 * @param {*} objTracking , @type Json
 */
exports.createRuta = function (objTracking, troute_id) {
    let icon = {
        "InicioRuta": urlImg + "inicioRuta-3.png",
        "LlegadaSede": urlImg + "finRuta-3.png",
        "InicioSede": urlImg + "inicioSede-3.png",        
        "FinSede": urlImg + "finSede-3.png",
        "Tolerancia": urlImg + "tolerancia-4.png",
        "Abordo": urlImg + "abordo-41.png",
        "NoAbordo": urlImg + "noAbordo-4.png"
    }
    rutaTracking = '';
    markers = '';
    objTracking.tracking.forEach(function (tracking, indice) {
        rutaTracking = rutaTracking + tracking.LATITUDE + "," + tracking.LONGITUDE;
        if (indice < (objTracking.tracking.length - 1)) {
            rutaTracking = rutaTracking + "|";
        }

        switch (tracking.EVENT_ID) {
            case 1:
                //Inicio de ruta hacia la sede --ENTRADA--
                markers = markers + "&markers=anchor:" + icon.anchVehiculo + "%7Csize:20,32%7Cicon:" + icon.InicioRuta + "%7C" + tracking.LATITUDE + "," + tracking.LONGITUDE;
                break;
            case 7:
                //Inicio de ruta desde la sede a un domicilio --SALIDA--
                markers = markers + "&markers=anchor:" + icon.anchSede + "%7Cicon:" + icon.InicioSede + "%7C" + tracking.LATITUDE + "," + tracking.LONGITUDE;
                break;
            case 6:
                //Fin de ruta llegada a sede 
                markers = markers + "&markers=anchor:" + icon.anchSede + "%7Cicon:" + icon.LlegadaSede + "%7C" + tracking.LATITUDE + "," + tracking.LONGITUDE;
                break;
            case 3:
            case 11:
            case 12:
                // Abordo el agente con tolerancia color->amarillo  
                if (tracking.TOLERANCE) {
                    markers = markers + "&markers=anchor:" + icon.anchTolerancia + "%7Cicon:" + icon.Tolerancia + "%7C" + tracking.LATITUDE + "," + tracking.LONGITUDE;
                } else {
                    // Abordo el agente color->verde 
                    markers = markers + "&markers=anchor:" + icon.anchAbordo + "%7Cicon:" + icon.Abordo + "%7C" + tracking.LATITUDE + "," + tracking.LONGITUDE;
                } break;
            case 4:
                // No abordo el agente color ->ojo 
                markers = markers + "&markers=anchor:" + icon.anchCancelado + "%7Cicon:" + icon.NoAbordo + "%7C" + tracking.LATITUDE + "," + tracking.LONGITUDE;
                break;
        }
    });
    createMapa(troute_id);
}

function createMapa(troute_id) {
    mapa_url = api_mapa + 'path=color:' + mapa_color + '|weight:4|' + rutaTracking + '&size=' + mapa_size + styles + '&maptype=' + mapa_type + markers + '&key=' + api_key;
    let nom_image = 'mapa' + troute_id;
    let nom_image2 = 'mapa' + troute_id + '.' + img_type;
    request["TROUTE_ID"] = troute_id;
    request["NAME_IMG"] = nom_image;
    request["TYPE_IMG"] = img_type;

    let path_image = desFolder + nom_image2;
    saveMapa(path_image);
}

function saveMapa(path_image) {
    let base64Data = '';
    base64Img.requestBase64(mapa_url, function (err, res, base64) {
        if (err) {
            logger.logError.error('[DO: Convertir a base64 la img] <msj> %s',err.message );
            return;
        } else {
            request["IMG_B64"] = base64;
            // myDB.myConexion();

            myDB.saveImg(request, function (err, content) {
                if (err) {
                    logger.logError.error(err);
                    return;
                } else if (content) {
                    /* --Se decodifica la imagen base64-- */
                    base64Data = base64.replace(/^data:image\/png;base64,/, "");
                    /* --Validar si existe el archivo-- */
                    objFile.access(path_image, objFile.constants.F_OK, (error) => {
                        if (error) {
                            /* --Si no existe se agrega la Imagen-- */
                            objFile.appendFile(path_image, base64Data, 'base64', function (err) {
                                if (err) {
                                    logger.logError.error('<msj> ',err.message );
                                    return;
                                }
                            });
                        }
                    });
                    // myDB.endConnection();
                }
            });
        }
    });
}



