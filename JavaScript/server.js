var mysql = require('mysql');
var express = require('express');
var app = express();
var SERVER_PORT = 8080;
process.env['accountname'] = 'chooserstorage';
process.env['accountkey'] = 'rFb94KokcSFjPQJflCWmy9t8AqAM7rWdeUNYzGfiaEPKsY8kO2Lm2tF8fgEHsLIVCjGMYlYVP++vQ78+tYpV5A==';



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

app.get('/getAllPosts', function (req, res) {
    var sql = 'SELECT id, title, image1, description1, image2, description2 from posts_with_mediumblob';
    console.log('Request Received at: /getAllPosts');

    connection.query(sql, function(err, rows, fields) {
        if (!err) {
            var result = [];
            for (var i = 0; i < rows.length; i++) {
                var row = [];
                var title = rows[i]['title'];
                var description1 = rows[i]['description1'];
                var description2 = rows[i]['description2'];
                var image1Buffer = rows[i]['image1'];
                var image1Base64 = image1Buffer.toString('utf-8');
                var image2Buffer = rows[i]['image2'];
                var image2Base64 = image2Buffer.toString('utf-8');

                var id = rows[i]['id'];
                result.push({
                    'title':title,
                    'description1':description1,
                    'description2':description2,
                    'image1':image1Base64,
                    'image2':image2Base64,
                    'id':id
                })
            }
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.contentType('application/json');
            console.log("Sending result: " + result);
            res.send(JSON.stringify(result));
        }
        else {
            console.log('Error while performing Query: %s', sql);
            console.log(err);
            res.send(err);
        }
    });
});

app.post('/deletePost', function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    console.log("Delete request received");
    console.log(req.query.id);
    var idToDelete = req.query.id;
    var sql = "'DELETE FROM posts WHERE posts.id = " + idToDelete + "'";
    console.log(sql);
    connection.query(
        'DELETE FROM posts WHERE id = ?',
        [idToDelete],
        function (err, result) {
            if (err) throw err;

            console.log('Deleted ' + result.affectedRows + ' rows');
        }
    );
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

function rawBody(req, res, next) {
    var chunks = [];

    req.on('data', function(chunk) {
        chunks.push(chunk);
    });

    req.on('end', function() {
        var buffer = Buffer.concat(chunks);

        req.bodyLength = buffer.length;
        req.rawBody = buffer;
        next();
    });

    req.on('error', function (err) {
        console.log(err);
        res.status(500);
    });
}



app.post('/addPostWithBlob', rawBody, function (req, res){
    if (req.rawBody && req.bodyLength > 0) {
        console.log(req.bodyLength);
        //Parse the JSON from binary:
        var rawJson = req.rawBody;
        var jsonBuffer = new Buffer(rawJson, "binary");
        var json = JSON.parse(jsonBuffer);

        var title = json['title'];
        var image1Base64 = json['image1'];
        var image2Base64 = json['image2'];
        var description1 = json['description1'];
        var description2 = json['description1'];

        var sql = "INSERT INTO posts_with_mediumblob (title, image1, description1, image2, description2, upload_time)" +
            " VALUES ('"
            + title + "', '"
            + image1Base64 + "', '"
            + description1 + "', '"
            + image2Base64 + "', '"
            + description2 + "', "
            + "NOW())";

        require("fs").writeFile("out1.png", image1Base64, 'base64', function(err) {
            console.log(err);
        });
        require("fs").writeFile("out2.png", image2Base64, 'base64', function(err) {
            console.log(err);
        });

        console.log("Got SQL Query");
        connection.query(sql, function (err, rows, fields) {
            if (!err) {
                console.log('Request Received');

                res.setHeader('Access-Control-Allow-Origin', '*');
                res.send(JSON.stringify(rows));
            }
            else {
                console.log('Error while performing Query');
                console.log(err);
                res.send(err);
            }
        });
    }
    else{
        console.log("Empty or wrong request received!");
    }
});

var server = app.listen(SERVER_PORT, function () {
    var port = server.address().port;

    console.log('Listening on port %s', port);
});
