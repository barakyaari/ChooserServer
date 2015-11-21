var mysql      = require('mysql');
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'admin',
    password : 'Nsghvnjac1',
    database : 'chooser'
});

// The callback function gets the connection and can use it
exports.connect(callback) {
    connection.connect();
    callback(connection);
    connection.end();
}