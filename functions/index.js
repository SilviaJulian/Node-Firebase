/**
* Constante para escribir errores
* @access private
*/
let logger = require('./logger.js');

/**
* Constante para manipular fechas.
* @access private
*/
let moment = require('moment');

/**
* Constante para acceder a FaseBse.
* @access private
*/
let db = require('./ConctFireBase/conexion-firebase.js');

/**
* Constante para acceder a la Base de Datos.
* @access private
*/
let myDB = require('./ConctMysql/conexion-mysql.js');
myDB.myConexion();

/**
 * Variables para lectura y escritura de Ficheros 
 * @access private
 */
let objFile = require('fs');
let ruta = "RutasDrivers/";
let typeFile = ".json";

/**
 * Variable para el archivo de mapas estaticos
 * @access private
 */
let apiMapa = require('./apiMapa.js');

/**
 * Variable para validar reglas del JSON
 * @access private
 */
let Validator = require('validatorjs');

/**
* Variable para el tiempo de tolerancia
* @access private
*/
let timeToleracia = 8;

/**
 * Evento de FireBase que escucha si se agrega un nuevo objeto
 *  @access private
 * @param {*} snapshot , @type Json
 */
db.fireBase.on("child_added", function (snapshot) {
    let objTracking = {};
    /* Se valida las reglas del JSON */
    if (validateJSON(snapshot.val())) {
        /* Valida la ruta inicie con 1 o 7 */
        if ((snapshot.val().EVENT_ID === 1) || (snapshot.val().EVENT_ID === 7)) {
            /* Se valida la existencia del evento, la ruta y el servicio en la BD */
            myDB.validateID(snapshot, function (err, content) {
                if (err) {
                    logger.logError.error('(child_added)', err);
                    return;
                } else if (content) {
                    /* Content contiene el ultimo id obtenido del select ejecutado*/
                    let idTracking = snapshot.key;
                    let pathFile = ruta + idTracking + typeFile;
                    /* --Agrega un nuevo archivo-- */
                    createFile(pathFile);
                    /* --Se crea el objeto-- */
                    objTracking[idTracking] = myObjTracking(snapshot.val());
                    /* --Guardar en la DB-- */
                    myDB.addEventTracking(objTracking[idTracking], function (err, content) {
                        if (err) {
                            logger.logError.error('(child_added)', err);
                            return;
                        }
                    });
                    /* --Escribir en el archivo-- */
                    readWrite(pathFile, objTracking);
                }
            }); /* --Fin de myBD.validateID--*/
        } else {
            logger.logError.error('<msj> No se pudo generar el archivo (%d .json)  ya que el evento_id esperado NO fue igual a 1 o 7; objeto = %j', snapshot.val().TROUTE_ID, snapshot.val());
            return;
        }
    }/* --Fin de validateJSON--*/
});

/**
 * Evento de FireBase que escucha si se actualiza un objeto
 *  @access private
 * @param {*} snapshot , @type Json
 */
db.fireBase.on("child_changed", function (snapshot) {
    if (typeof snapshot.val() === 'object') {
        let pathFile = ruta + snapshot.key + typeFile;
        let idTracking = snapshot.key;
        let objTracking = {};
        /* Se valida la existencia del evento, la ruta y el servicio en la BD */
        myDB.validateID(snapshot, function (err, content) {
            if (err) {
                logger.logError.error('(child_changed)', err);
                return;
            } else if (content) {
                /* --Se valida si existe tiempo fuera-- */
                if (snapshot.val().OFFLINE) {
                    snapshot.val().OFFLINE.forEach(function (data, indice) {
                        /* --Se valida las reglas del JSON-- */
                        if (validateJSON(data)) {
                            /* --Se crea el objeto-- */
                            objTracking[idTracking] = myObjTracking(data);
                            /* --Se abre el archivo para leerse-- */
                            try {
                                let objJSON = objFile.readFileSync(pathFile, "utf8");
                                saveTracking(pathFile, objTracking, JSON.parse(objJSON));
                            } catch (err) {
                                logger.logError.error('(OFFLINE) <msj> ', err.message);
                                return;
                            }
                        }
                    });
                    /* Se elimina OFFLINE */
                    dropFileClud(idTracking + '/OFFLINE');
                } else {
                    /* --Se valida las reglas del JSON-- */
                    if (validateJSON(snapshot.val())) {
                        /* --Se crea el objeto-- */
                        objTracking[idTracking] = myObjTracking(snapshot.val());
                        /* --Se abre el archivo para leerse-- */
                        try {
                            let objJSON = objFile.readFileSync(pathFile, "utf8");
                            saveTracking(pathFile, objTracking, JSON.parse(objJSON));
                        } catch (err) {
                            logger.logError.error('<msj> ', err.message);
                            return;
                        }
                    }
                }
            }/* --Fin de else if (content)--*/
        });/* --Fin de validateID--*/
    } else {
        logger.logError.error('<msj> El objeto esperado no es valido.');
        return;
    }
});

/**
 * Evento de Firebase  que escucha cuando se elimina un nodo
 *  @access private
 * @param {*} snapshot , @type Json
 */
/* db.fireBase.on("child_removed", function (snapshot) {
    let pathFile = ruta + snapshot.key + typeFile;
    dropFile(pathFile);
});
 */



/**
 * Funcion que crea un objeto estandar de un tracking
 *  @access private
 * @param {*} snapshot , @type Json
 */
function myObjTracking(snapshot) {
    let myObject = {
        "TROUTE_ID": snapshot.TROUTE_ID,
        "NAV": snapshot.NAV,
        "ONLINE": snapshot.ONLINE,
        "tracking": [{
            "DATETIME": snapshot.DATETIME,
            "LATITUDE": snapshot.COORDENADAS.LAT,
            "LONGITUDE": snapshot.COORDENADAS.LONG,
            "EVENT_ID": snapshot.EVENT_ID,
            "TDAILY_SERVICE_ID": snapshot.TDAILY_SERVICE_ID,
            "TOLERANCE": snapshot.TOLERANCE,
        }]
    };
    return myObject;
}

/**
 * Función que ecribe, guarda y crea el mapa
 * @param {*} pathFile , @type String
 * @param {*} snapshot , @type Json
 * @param {*} newTracking , @type Json
 */
// function saveTracking(pathFile, snapshot, objTrackFile) {
function saveTracking(pathFile, snapshot, objTrackFile) {
    let keyId = Object.keys(snapshot)[0];
    /* --Se valida si el objeto creado es el mismo que se va a leer-- */
    if (objTrackFile.hasOwnProperty(keyId)) {
        /* --Se valida que el evento exita en una serie valida-- */
        if (validEvento(objTrackFile[keyId].tracking[0].EVENT_ID, snapshot[keyId].tracking[0].EVENT_ID)) {
            objTrackFile[keyId].TROUTE_ID = snapshot[keyId].TROUTE_ID;
            objTrackFile[keyId].ONLINE = snapshot[keyId].ONLINE;
            objTrackFile[keyId].NAV = snapshot[keyId].NAV;
            snapshot[keyId].tracking.forEach(function (data) {
                objTrackFile[keyId].tracking.push(data);
            });
            /* --Se ordena el arreglo-- */
            bubbleSort(objTrackFile[keyId].tracking);
            /* --Se elimna los objetos repetidos-- */
            /*    dropDuplicados(objTrackFile[keyId].tracking); */

            /* --Se escribe en el archivo-- */
            writeFile(pathFile, objTrackFile);
            /* --Guardar en la DB solo si existe cambia el evento-- */
            if (snapshot[keyId].tracking[0].EVENT_ID !== 13) {
                myDB.addEventTracking(objTrackFile[keyId], function (err, content) {
                    if (err) {
                        logger.logError.error(err);
                        return;
                    }
                });
            }
            let tamanio = objTrackFile[keyId].tracking.length;
            /* --Se valida si el ultimo evento del array contiene un evento de fin de Tracking-- */
            if ((objTrackFile[keyId].tracking[tamanio - 1].EVENT_ID === 6) || (objTrackFile[keyId].tracking[tamanio - 1].EVENT_ID === 12)) {
                let dateFin = moment(objTrackFile[keyId].tracking[tamanio - 1].DATETIME, "YYYY-MM-DD HH:mm:ss");
                let dateIni = moment(objTrackFile[keyId].tracking[tamanio - 2].DATETIME, "YYYY-MM-DD HH:mm:ss");
                /* --Se calcula los segundos que han trascurrido entre el ultimo y penultimo tracking-- */
                let seg = dateFin.diff(dateIni, 's');
                if (seg <= timeToleracia) {
                    apiMapa.createRuta(objTrackFile[keyId], keyId);
                    /* --Se elimina el archivo-- */
                    dropFile(pathFile);
                    /* --Se elimina el nodo del usuario en FareBase-- */
                    dropFileClud(keyId);
                }
            }// Fin de if
        }// Fin de la funcion validEvento 
        else {
            logger.logError.error('<msj> El evento esperado no corresponde a la misma secuencia de eventos.');
            return;
        }
    }// Fin de objTracking.hasOwnProperty(keyId)
    else {
        logger.logError.error('<msj> El objeto esperado no corresponde con el json del archivo.');
        return;
    }
}

/**
 * Función para realizar ordenamiento Desendente
 * @param {*} pathFile
 * @type String
 */
const bubbleSort = arr => {
    const l = arr.length;
    for (let i = 0; i < l; i++) {
        for (let j = 0; j < l - 1 - i; j++) {
            if (new Date(arr[j].DATETIME) > new Date(arr[j + 1].DATETIME)) {
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
            }
        }
    }
    return arr;
};

function dropDuplicados(arregloConRepetidos) {
    let sinRepetidos = arregloConRepetidos.filter((valorActual, indiceActual, arreglo) => {
        return arreglo.findIndex(
            valorDelArreglo => JSON.stringify(valorDelArreglo) === JSON.stringify(valorActual)
        ) === indiceActual
    });
    return sinRepetidos;
}

/**
 * Función que crear un nuevo fichero
 * @param {*} pathFile
 * @type String
 */
function createFile(pathFile) {
    /* --Validar si existe el archivo-- */
    objFile.access(pathFile, objFile.constants.F_OK, (err) => {
        if (err) {
            /* --No existe, Crear el archivo-- */
            objFile.appendFile(pathFile, '', (err) => {
                if (err) {
                    logger.logError.error('<msj> El archivo (%s.json) %s', pathFile, err.message);
                    return;
                }
            });
        }
    });
}

/**
 * Función verifica si existe Datos en el archivo
 * @param {*} pathFile , @type String
 * @param {*} objTracking , @type Json
 */
function readWrite(pathFile, objTracking) {
    /* --Si existe el archivo se obtiene el JSON y se crea el Mapa-- */
    try {
        let objTrackFile = objFile.readFileSync(pathFile, "utf8");
        if ((objTrackFile.length !== 0) && (typeof objTrackFile !== 'undefiend') && (typeof JSON.parse(objTrackFile) === 'object')) {
            objTrackFile = JSON.parse(objTrackFile);
            let keyId = Object.keys(objTrackFile)[0];
            /* Solo se crea el mapa  */
            apiMapa.createRuta(objTrackFile[keyId], keyId);
            logger.logInfo.info('<msj> Se creo el mapa con el contenido existente en el archivo (%s.json) ', pathFile);
        } writeFile(pathFile, objTracking);
    } catch (err) {
        writeFile(pathFile, objTracking);
        logger.logError.error('<msj> %s', err.message);
        return;
    }
}

/**
 * Función que sobreescribe un fichero
 * @param {*} pathFile , @type String
 * @param {*} objTracking , @type Json
 */
function writeFile(pathFile, objTracking) {
    objFile.writeFileSync(pathFile, JSON.stringify(objTracking), function (err) {
        if (err) {
            logger.logError.error('<msj> %s', err.message);
            return;
        }
    });
}

/**
 * Función que elimina un fichero
 * @param {*} pathFile , @type String
 */
function dropFile(pathFile) {
    objFile.stat(pathFile, function (err, stats) {
        if (err) {
            logger.logError.error('<msj> (%s) %s', pathFile, err.message);
            return;
        }
        objFile.unlink(pathFile, function (err) {
            if (err) {
                logger.logError.error('<msj> (%s) %s', pathFile, err.message);
                return;
            }
        });
    });

}

/**
 * Función que elimina un nodo secunadrio en FireBase
 * @param {*} key_id , @type int
 */
function dropFileClud(key_id) {
    db.fireBase.child(key_id).remove(function (err) {
        if (err) {
            logger.logError.error('<msj> (%s) %s', key_id, err.message);
            return;
        }
    });
}

/**
 * Función que vaida el evento acorde a su tracking 
 * @param {*} objTracking , @type Json
 * @param {*} event_idg , @type int
 */
function validEvento(objTracking, event_id) {
    let bandera = false;;
    if ((objTracking >= 1) && (objTracking <= 6)) {
        if ((event_id <= 6) || (event_id == 13)) {
            bandera = true;
        }
    } else if ((objTracking >= 7) && (objTracking <= 12)) {
        if ((event_id <= 12) || (event_id == 13)) {
            bandera = true;
        }
    }
    return bandera;
}

/**
 * Función que vaida el formato del JSON
 * @param {*} snapshot , @type Json
 */
function validateJSON(snapshot) {
    let rulesJson = {
        "COORDENADAS": {
            "LAT": 'required|numeric|between:-90,90', //varchar(50) --NO NULL--
            "LONG": 'required|numeric|between:-180,180', //varchar(50) --NO NULL--
        },
        "DATETIME": ['required', 'regex:/^(20)[0-9][0-9][-\\/. ](0[1-9]|1[0-2])[-\\/. ](0[1-9]|[12][0-9]|3[01]) ([01][0-9]|2[0-3])(:)([0-5][0-9])(:)([0-5][0-9])$/'], //datetime --NO NULL--
        "EVENT_ID": 'required|integer|between:1,13', //int(11) --NO NULL--
        "NAV": 'required|boolean', // bit(1) --NO NULL--
        "ONLINE": 'required|boolean', // bit(1) --NO NULL--
        "TDAILY_SERVICE_ID": 'required|integer',  //int(11) null
        "TOLERANCE": 'required|boolean',  // bit(1) null
        "TROUTE_ID": 'required|integer'  //int(11) --NO NULL--
    }
    /* Valida el tamaño del Json */
    if (snapshot.length === 0) {
        logger.logError.error('<msj> El objeto esperado se encuentra vacio');
        return false;
    }

    let myKeys = Object.keys(rulesJson).sort();
    var snapshotKeys = Object.keys(snapshot).sort();
    /* Valida el numero de indices en cada Json */
    if (snapshotKeys.length !== myKeys.length) {
        logger.logError.error('El número de índices son difentes, objeto= %j', snapshot);
        return false;
    }

    /* Valida la similitud de indices en cada Json */
    if (myKeys.join('') !== snapshotKeys.join('')) {
        logger.logError.error('<msj> Los nombres de las Keys del objeto esperado No corresponden, objeto= %j', snapshot);
        return false;
    }

    if (snapshot.COORDENADAS) {
        let cordKeys = Object.keys(rulesJson.COORDENADAS).sort();
        var cordSnapshotKeys = Object.keys(snapshot.COORDENADAS).sort();

        /* Valida el numero de indices en cada Json */
        if (cordKeys.length !== cordSnapshotKeys.length) {
            logger.logError.error('<msj> El número de índices del objeto Coordenadas son distintas, objeto= %j', snapshot);
            return false;
        }

        /* Valida la similitud de indices en cada Json */
        if (cordKeys.join('') !== cordSnapshotKeys.join('')) {
            logger.logError.error('<msj> Los nombres de las Keys del objeto Coordenadas No corresponden, objeto= %j', snapshot);
            return false;
        }
    } else {
        logger.logError.error('<msj> El objeto coordenadas se encuentra vacio, objeto= %j', snapshot);
        return false;
    }

    let validation = new Validator(snapshot, rulesJson);
    /* Valida las reglas del Json */
    if (validation.fails()) {
        let errores = '';
        errores = (validation.errors.first("COORDENADAS.LAT") !== false) ? validation.errors.first("COORDENADAS.LAT") : "";
        errores += (validation.errors.first("COORDENADAS.LONG") !== false) ? " " + validation.errors.first("COORDENADAS.LONG") : "";
        errores += (validation.errors.first("DATETIME") !== false) ? " " + validation.errors.first("DATETIME") : "";
        errores += (validation.errors.first("EVENT_ID") !== false) ? " " + validation.errors.first("EVENT_ID") : "";
        errores += (validation.errors.first("NAV") !== false) ? " " + validation.errors.first("NAV") : "";
        errores += (validation.errors.first("ONLINE") !== false) ? " " + validation.errors.first("ONLINE") : "";
        errores += (validation.errors.first("TDAILY_SERVICE_ID") !== false) ? " " + validation.errors.first("TDAILY_SERVICE_ID") : "";
        errores += (validation.errors.first("TOLERANCE") !== false) ? " " + validation.errors.first("TOLERANCE") : "";
        errores += (validation.errors.first("TROUTE_ID") !== false) ? " " + validation.errors.first("TROUTE_ID") : "";
        logger.logError.error('<msj> Reglas de validación del objeto JSON;  %s', errores);
        return false;
    }
    return true;
}
