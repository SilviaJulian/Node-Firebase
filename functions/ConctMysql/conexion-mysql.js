/**
 * Variable para realizar peticiones SQL
 */
let mysql = require('mysql');
let connection;

/**
 * Función que realiza la conexión a la Base de Datos
 */
exports.myConexion = function() {
    connection = mysql.createConnection({
        host: 'localhost',
        user: 'sgmdbwebuser',
        password: 'sgmdbW3bU$3r.*',
        database: 'sgmdb',
        port: 3306
    });
    connection.connect(function(error) {
        if (error) {
            throw "Error: No se pudo realiza la conexion a la BD"
        }
    });
}

/**
 * Función que realiza la conexión a la Base de Datos
 */
exports.endConnection = function() {
    connection.end();
}

/**
 * Función que realiza la inserción de un Tracking
 * @param {*} req  , @type Json
 */
exports.addEventTracking = function(req, callback) {
    let tracking = req.tracking[req.tracking.length - 1];
    let CREATE_BY = "Hola";
    let CREATED_DATE = createFecha();
    let values = "NULL,'" + tracking.EVENT_ID + "','" + req.TROUTE_ID + "','" + tracking.TDAILY_SERVICE_ID + "','" + tracking.DATETIME + "','" + tracking.LATITUDE + "','" + tracking.LONGITUDE + "'," + req.NAV + "," + req.ONLINE + "," + tracking.TOLERANCE + ", 1,'" + CREATED_DATE + "','" + CREATE_BY + "', NULL, NULL";

    values = sanitize(values);
    /* Se realiza la inserción */
    connection.query("INSERT INTO ttravel_tracking VALUES (" + values + ")", function(err) {
        if (err) {
            callback('[FILE: conexion-mysql.js],[FUNCTION: addEventTracking],[DO: INSERT en ttravel_tracking] <msj> ' + err.message, null);
        }
        callback(null, 1);
    });
}

/**
 * Función que valida la existencia del evento, la ruta y el servicio en la BD
 * @param {*} data , @type Json
 * @param {*} callback , @type Json
 */
exports.validateID = function(data, callback) {
    connection.query("SELECT ID FROM ctravel_tracking_event WHERE ID IN (" + sanitize(data.val().EVENT_ID) + ")", function(err, rows) {
        if (err) {
            callback('[FILE: conexion-mysql.js],[FUNCTION: validateID],[DO: Valida existencia ID en ctravel_tracking_event] <msj> ' + err.message, null);
        } else if (rows.length === 0) {
            callback('[FILE: conexion-mysql.js],[FUNCTION: validateID],[DO: Valida existencia ID en ctravel_tracking_event] <msj> column ID FROM troute ' + data.val().EVENT_ID + " no exist", null);
        } else if (rows[0].ID) {
            connection.query("SELECT ID FROM troute WHERE ID IN (" + sanitize(data.val().TROUTE_ID) + ")", function(err, rows) {
                if (err) {
                    callback('[FILE: conexion-mysql.js],[FUNCTION: validateID],[DO: Valida existencia ID en troute] <msj> ' + err.message, null);
                } else if (rows.length === 0) {
                    callback('[FILE: conexion-mysql.js],[FUNCTION: validateID],[DO: Valida existencia ID en troute] <msj> column ID FROM troute ' + data.val().TROUTE_ID + " no exist", null);
                } else if (rows[0].ID) {
                    connection.query("SELECT ID FROM tdaily_service WHERE ID IN (" + sanitize(data.val().TDAILY_SERVICE_ID) + ")", function(err, rows) {
                        if (err) {
                            callback('[FILE: conexion-mysql.js],[FUNCTION: validateID],[DO: Valida existencia ID en tdaily_service] <msj> ' + err.message, null);
                        } else if (rows.length === 0) {
                            callback('[FILE: conexion-mysql.js],[FUNCTION: validateID],[DO: Valida existencia ID en tdaily_service] <msj> column ID FROM troute ' + data.val().TDAILY_SERVICE_ID + " no exist", null);
                        } else if (rows[0].ID) {
                            callback(null, rows[0].ID);
                        }
                    });
                }
            });
        }
    });
}

/**
 * Función que guarda la Imagen
 * @param {*} data , @type Json
 * @param {*} callback , @type Json
 */
exports.saveImg = function(data, callback) {
    // myConexion();
    connection.query("SELECT ID FROM troute WHERE ID IN (" + sanitize(data.TROUTE_ID) + ")", function(err, rows) {
        if (err) {
            callback('[FILE: conexion-mysql.js],[FUNCTION: saveImg],[DO: Valida existencia ID en troute] <msj> ' + err.message, null);
        } else if (rows.length === 0) {
            callback('[FILE: conexion-mysql.js],[FUNCTION: saveImg],[DO: Valida existencia ID en troute] <msj> column ID FROM troute' + data.TROUTE_ID + " no exist", null);
        } else if (rows[0].ID) {
            let CREATED_DATE = createFecha();
            let values = "NULL,'" + data.TROUTE_ID + "','" + data.TYPE_IMG + "','" + data.NAME_IMG + "','" + data.IMG_B64 + "', 1,'" + CREATED_DATE + "','" + CREATE_BY + "', NULL, NULL";
            values = sanitize(values);
            /* Se realiza la inserción */
            connection.query("INSERT INTO timage_tracking VALUES (" + values + ")", function(err, result) {
                if (err) {
                    callback('[FILE: conexion-mysql.js],[FUNCTION: saveImg],[DO: INSERT en timage_tracking] <msj> ' + err.message, null);
                }
                callback(null, 1);
            });
        }
    });
}

/**
 * Función para dar formato a una fecha-hora
 */
function createFecha() {
    var fecha = new Date();
    var dia = fecha.getDate();
    var mes = fecha.getMonth() + 1;
    var anio = fecha.getFullYear();
    if (dia < 10) dia = '0' + dia;
    if (mes < 10) mes = '0' + mes;

    hora = fecha.getHours();
    min = fecha.getMinutes();
    seg = fecha.getSeconds();
    if (hora < 10) { hora = "0" + hora }
    if (min < 10) { min = "0" + min }
    if (seg < 10) { seg = "0" + seg }

    let hoy = anio + '-' + mes + '-' + dia + ' ' + hora + ':' + min + ':' + seg;
    return hoy;
}

/*
 * Función para limpiar cadena de palabras recervadas sql 
 */
function sanitize(str) {
    let searchValue = [
        '@<script[^>]*?>.*?</script>@si', // Elimina javascript
        '@<[\/\!]*?[^<>]*?>@si', // Elimina las etiquetas HTML
        '@<style[^>]*?>.*?</style>@siU', // Elimina las etiquetas de estilo
        '@<![\s\S]*?--[ \t\n\r]*>@', // Elimina los comentarios multi-línea
        "%", "--", "^", "[", "]", "!", "¡", "?", "=", "&", "<", ">", ">=", "<=", "<>", "!=", "(", ")", "!>", "!<",
        /ADD/gi, /ALL/gi, /ALTER/gi, /AND/gi, /ANY/gi, /AS/gi, /ASC/gi, /AVG/gi, /AUTHORIZATION/gi,
        /"BACKUP/gi, /BEFORE/gi, /BETWEEN/gi, /BREAK/gi, /BROWSE/gi, /BY/gi,
        /CALL/gi, /CASE/gi, /CAST/gi, /CHANGE/gi, /CLUSTER/gi, /COLUMN/gi, /COLUMN_NAME/gi, /COLUMNS/gi, /COMMIT/gi, /CONNECTION/gi, /CONNECTION_NAME/gi, /COPY/gi, /COUNT/gi, /CREATE/gi,
        /CREATEDB/gi, /CREATEROLE/gi, /CREATEUSER/gi, /CUBE/gi, /CURRENT/gi, /CURSOR/gi, /CURSOR_NAME/gi,
        /DATABASE/gi, /DATABASES", "DEFAULT", "DEFAULTS", "DELETE/gi, /DELIMITER/gi, /DELIMITERS/gi, /DESC/gi, /DESCRIBE/gi, /DESCRIPTOR/gi, /DESTROY/gi, /DISTINCT/gi, /DROP/gi, /DUMP/gi,
        /ELSE/gi, /ELSEIF/gi, /ENCRYPTED/gi, /END/gi, /EQUALS/gi, /EXECUTE/gi, /EXISTING/gi, /EXISTS/gi, /EXIT/gi, /EXPLAIN/gi,
        /FILTER/gi, /FROM/gi, /GROUP/gi, /GROUPING/gi, /HAVING/gi, /HOST/gi, /HOSTS/gi,
        /IF/gi, /IN/gi, /INNER/gi, /INSERT/gi, /INSERT_ID/gi, /INTO/gi, /IS/gi, /ISAM/gi, /ISNULL/gi, /JOIN/gi, /KEY/gi, /KILL/gi, /LIKE/gi, /LIMIT/gi, /LOOP/gi, /MAX/gi, /MAX_ROWS/gi, /MAXVALUE/gi, /MIN/gi,
        /MIN_ROWS/gi, /NOT/gi, /ON/gi, /OR/gi, /SCHEMA_NAME/gi, /SECTION/gi, /SELECT/gi, /SELF/gi, /SOME/gi, /SUM/gi, /TABLE/gi, /TABLE_NAME/gi, /TABLES/gi, /THAN/gi, /THEN/gi, /TOP/gi, /TOP_LEVEL_COUNT/gi, /UNION/gi,
        /USE/gi, /USER/gi, /WHEN/gi, /WHERE/gi, /WHILE/gi, /XOR/gi
    ];
    if ((typeof str === 'string') && (typeof str !== '') && (typeof str !== 'undefiend')) {
        searchValue.forEach(function(data) {
            str = str.replace(data, "");
        });
    }
    return str;
}