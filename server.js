var express = require('express');
var db = require('./DBConnector.js');
var app = express();


app.get('/', function (req, res) {
	res.send('Hello World!');
});

app.get('/addShit', function (req, res) {
    db.connect(function(connection) {
        connection.query('SELECT * from users', function(err, rows, fields) {
            if (!err) {
                res.send('result: ' + rows);
            }
            else {
                console.log('Error while performing Query.');
            }
        });
    });
});

var server = app.listen(8080, function () {
  var port = server.address().port;

  console.log('Example app listening on port %s', port);
});
