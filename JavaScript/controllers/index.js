module.exports.set = function(app) {

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

    app.get('/', function (req, res) {
        console.log("/ request recieved!");
        res.send('Hello World!');
    });

    app.post('/deletePost', rawBody, function (req, res) {
        if (req.rawBody && req.bodyLength > 0) {
            console.log(req.bodyLength);
            //Parse the JSON from binary:
            var rawJson = req.rawBody;
            var jsonBuffer = new Buffer(rawJson, "binary");
            var json = JSON.parse(jsonBuffer);

            var id = json['id'];
            res.setHeader('Access-Control-Allow-Origin', '*');
            console.log("Delete request received");
            console.log(req.query.id);
            var idToDelete = req.query.id;
            var sql = "DELETE FROM posts_with_mediumblob WHERE id = " + id ;
            console.log(sql);
            connection.query(
                sql,
                function (err, result) {
                    if (err) throw err;
                    console.log('Deleted ' + result.affectedRows + ' rows');
                    res.send('Deleted');
                }
            );
        }
    });

    app.post('/addPostWithBlob', rawBody, function (req, res){
        if (req.rawBody && req.bodyLength > 0) {
            console.log(req.bodyLength);
            //Parse the JSON from binary:
            var rawJson = req.rawBody;
            var jsonBuffer = new Buffer(rawJson, "binary");
            var json = JSON.parse(jsonBuffer);
            var user_id = json['user_id'];
            var title = json['title'];
            var image1Base64 = json['image1'];
            var image2Base64 = json['image2'];
            var description1 = json['description1'];
            var description2 = json['description1'];

            var sql = "INSERT INTO posts_with_mediumblob (user_id, title, image1, description1, image2, description2, upload_time)" +
                " VALUES ('"
                + user_id + "', '"
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

    app.post('/getAllPosts', rawBody, function (req, res) {
        console.log('Request Received at: /getAllPosts');

        var sql = 'SELECT id, title, image1, description1, image2, description2 from posts_with_mediumblob';

        connection.query(sql, function(err, rows, fields) {
            if (!err) {
                var result = [];
                for (var i = 0; i < rows.length; i++) {
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

    app.post('/login', rawBody, function (req, res) {
        console.log("Login Request received.");
        if (req.rawBody && req.bodyLength > 0) {
            console.log(req.bodyLength);
            //Parse the JSON from binary:
            var rawJson = req.rawBody;
            var jsonBuffer = new Buffer(rawJson, "binary");
            var json = JSON.parse(jsonBuffer);

            var username = json['username'];
            var password = json['password'];

            var sql = "select id from users where" +
                " username = '" + username + "' and password = '" + password + "'";

            console.log("Got SQL Query");
            connection.query(sql, function (err, rows, fields) {
                if (!err) {
                    if(rows.length == 1) {
                        var id = rows[0]['id'];
                        res.setHeader('Access-Control-Allow-Origin', '*');
                        res.contentType('application/json');
                        console.log("Sending result: " + id);
                        res.send(String(id));
                    }
                    else{
                        console.log("Wrong username/password");
                        res.send('-1');
                    }
                }
                else {
                    console.log('Error while performing Query: %s', sql);
                    console.log(err);
                    res.send(-1);
                }

            });
        }
    });
}