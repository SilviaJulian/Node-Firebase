/**
 * Import Admin SDK de FireBase 
 */
let adminFireBase = require("firebase-admin");
let serviceAccount = require("./conexionmysql.json");
adminFireBase.initializeApp({
    credential: adminFireBase.credential.cert(serviceAccount),
    databaseURL: "https://conexionmysql-3a79b.firebaseio.com"
});
/**
 * Ruta principal de FireBase 
 */
module.exports.fireBase = adminFireBase.database().ref('/Tracking/');

/**
 * Metodo que actualiza el estado de la conexion de NodeJS
 */
myConnectionsRef = adminFireBase.database().ref('/Administrador/NodeJS/');
connectedRef = adminFireBase.database().ref('.info/connected');
connectedRef.on('value', function (snap) {
    if (snap.val() === true) {
        myConnectionsRef.update({
            onlineState: true,
            status: "Online.",
            lastOnLine: new Date().toISOString()
        });
        myConnectionsRef.onDisconnect().update({
            onlineState: false,
            status: "Offline.",
            lastOffLine: new Date().toISOString()
        });
    }
});

