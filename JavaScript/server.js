var mysql = require('mysql');
var express = require('express');
var app = express();
var SERVER_PORT = 8080;

var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'admin',
    password : 'Nsghvnjac1',
    database : 'chooser'
});
connection.connect();


app.get('/', function (req, res) {
	res.send('Hello World!');
});

app.get('/getPosts', function (req, res) {
    var sql = 'SELECT id, title, image1, description1, image2, description2 from posts';

    connection.query(sql, function(err, rows, fields) {
        if (!err) {
            console.log('Request Received');

            res.setHeader('Access-Control-Allow-Origin', '*');
            res.send(JSON.stringify(rows));
        }
        else {
            console.log('Error while performing Query: %s', sql);
            console.log(err);
            res.send(err);
        }
    });
});

app.get('/addPost', function (req, res) {
    console.log("Request received: " + req);
    var sql = "INSERT INTO posts (title, image1, description1, image2, description2, upload_time)" +
        " VALUES ('"
            + req.query.title + "', '"
            + req.query.image1 + "', '"
            + req.query.description1 + "', '"
            + req.query.image2 + "', '"
            + req.query.description2 + "', "
            + "NOW())";
    console.log("Got SQL Query: \n" + sql);
    connection.query(sql, function(err, rows, fields) {
        if (!err) {
            console.log('Request Received');

            res.setHeader('Access-Control-Allow-Origin', '*');
            res.send(JSON.stringify(rows));
        }
        else {
            console.log('Error while performing Query: %s', sql);
            console.log(err);
            res.send(err);
        }
    });
});

var server = app.listen(SERVER_PORT, function () {
    var port = server.address().port;

    console.log('Listening on port %s', port);
});
