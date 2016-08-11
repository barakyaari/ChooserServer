var mysql = require('mysql');

module.exports.set = function(app) {

    var connection = mysql.createConnection({
        host     : 'localhost',
        user     : 'admin',
        password : 'Nsghvnjac1',
        database : 'chooser',
        multipleStatements: true
    });
    connection.connect();

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
        console.log("EMPTY REQUEST RECEIVED!");
        res.send('Hello World!');
    });

    app.post('/deletePost', rawBody, function (req, res) {
        if (req.rawBody && req.bodyLength > 0) {
            console.log("DELETE REQUEST RECEIVED");
            console.log(req.bodyLength);
            //Parse the JSON from binary:
            var rawJson = req.rawBody;
            var jsonBuffer = new Buffer(rawJson, "binary");
            var json = JSON.parse(jsonBuffer);

            var id = json['id'];
            res.setHeader('Access-Control-Allow-Origin', '*');
            console.log(req.query.id);

            var sql =   "DELETE FROM votes WHERE post_id = " + id +" ;" +
                        "DELETE FROM posts_with_mediumblob WHERE id = " + id;

            console.log(sql);
            connection.query(
                sql,
                function (err, result) {
                    if (err)
                        throw err;
                    console.log('Deleted ' + result.affectedRows + ' rows');
                    res.send('Deleted');
                }
            );
        }
    });

    app.post('/addPostWithBlob', rawBody, function (req, res){
        console.log("ADD POST REQUEST RECEIVED");
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
            var description2 = json['description2'];
            var promotionDuration = json['promotionDuration'];
            var promotionTime = json['promotionTime'];
            console.log("USERID: " +  user_id);
            var price;
            switch(promotionTime) {
                case "MINUTE":
                    price = parseInt(promotionDuration)*50;
                    break;
                case "HOUR":
                    price = 700+1800*parseInt(promotionDuration);
                    break;
                case "DAY":
                    price = 11200+28800*parseInt(promotionDuration);
                    break;
                default:
                    price = 0;
            }
            var sql = "SELECT Tokens FROM users " +
                        "WHERE ID = " + user_id;

            connection.query(sql, function (err, rows, fields) {
                if (err) {
                    console.log('Error while performing Query');
                    res.send(err);
                    throw err;
                }
                var tokens = rows[0]['Tokens'];
                if (tokens < price || price == 0) {

                    var sql = "INSERT INTO posts_with_mediumblob (user_id, title, image1, description1, image2, description2, upload_time)" +
                        " VALUES ('"
                        + user_id + "', '"
                        + title + "', '"
                        + image1Base64 + "', '"
                        + description1 + "', '"
                        + image2Base64 + "', '"
                        + description2 + "', "
                        + "NOW())";

                    console.log("Got SQL Query");
                    connection.query(sql, function (err, rows, fields) {
                        if (err) {
                            console.log('Error while performing Query');
                            res.send(err);
                            throw err;
                        }

                        res.contentType('application/json');
                        console.log("Post was successfully added. Token Count: "+ tokens);
                        res.send(String(tokens));
                    });
                }

                else {
                    console.log(promotionTime);
                    var sql = "INSERT INTO posts_with_mediumblob (user_id, title, image1, description1, image2, description2, upload_time, promotion_expiration)" +
                        " VALUES ('"
                        + user_id + "', '"
                        + title + "', '"
                        + image1Base64 + "', '"
                        + description1 + "', '"
                        + image2Base64 + "', '"
                        + description2 + "', "
                        + "NOW(), "
                        + "NOW() + INTERVAL " + promotionDuration +" "+ promotionTime + "); "

                        + "UPDATE users "
                        + "SET Tokens = Tokens - "+ price + " "
                        + "WHERE ID = '" + user_id +"' ";


                    console.log("Got SQL Query");
                    connection.query(sql, function (err, rows, fields) {
                        if (err) {
                            console.log('Error while performing Query');
                            res.send(err);
                            throw err;
                        }
                        res.contentType('application/json');
                        console.log("Post with promotion was successfully added");
                        res.send("1");
                    });
                }
            });
        }
        else{
            console.log("Empty or wrong request received!");
        }
    });

    app.post('/getAllPosts', rawBody, function (req, res) {
        console.log("GET ALL POSTS REQUEST RECEIVED");

        var sql = 'SELECT id, title, image1, description1, image2, description2, votes1, votes2 from posts_with_mediumblob';

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
                    var votes1 = rows[i]['votes1'];
                    var votes2 = rows[i]['votes2'];
                    var id = rows[i]['id'];

                    result.push({
                        'title':title,
                        'description1':description1,
                        'description2':description2,
                        'image1':image1Base64,
                        'image2':image2Base64,
                        'id':id,
                        'votes1':votes1,
                        'votes2':votes2,
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




    app.post('/getStatistics', rawBody, function (req, res) {
        if (req.rawBody && req.bodyLength <= 0) {
            console.log("Empty or wrong request received!");
            return;
        }
        console.log("GET STATISTICS REQUEST RECEIVED");
        console.log(req.bodyLength);
        //Parse the JSON from binary:
        var rawJson = req.rawBody;
        var jsonBuffer = new Buffer(rawJson, "binary");
        var json = JSON.parse(jsonBuffer);
        var post_id = json['post_id'];
        var result = [];
        var sql =   "SELECT users.Gender, votes.vote, " +
                    "COUNT(votes.vote) AS Votes " +
                    "FROM votes " +
                    "INNER JOIN users " +
                    "on users.ID = votes.user_id " +
                    "AND votes.post_id = " + post_id + " " +
                    "GROUP BY users.Gender, votes.vote";
        connection.query(sql, function (err, rows, fields) {
            if (err) {
                console.log('Error while performing Query: %s', sql);
                res.send(err);
                throw err
            }
            console.log(rows);
            var femaleVotes1 = 0;
            var femaleVotes2 = 0;
            var maleVotes1 = 0;
            var maleVotes2 = 0;
            for (var i = 0; i < rows.length; i++) {
                var voteNum = rows[i]['vote'];
                var voteSum = rows[i]['Votes'];
                if (rows[i]['Gender'] == "Male") {
                    if (voteNum == 1)
                        maleVotes1 = voteSum;
                    else
                        maleVotes2 = voteSum;
                } else {
                    if (voteNum == 1)
                        femaleVotes1 = voteSum;
                    else
                        femaleVotes2 = voteSum;
                }

            }

            var sql = 'SELECT DATE_FORMAT(NOW(),\'%Y.%m.%d %H:%i:%s\') as Time';
            connection.query(sql, function (err, rows, fields) {
                if (err) {
                    console.log('Error while performing Query: %s', sql);
                    res.send(err);
                    throw err;
                }
                var time = rows[0]['Time'];
                console.log("Sending result: " + time);

                var sql =   "SELECT votes.vote, year(now()) - year(users.DOB) - (DATE_FORMAT(NOW(), '00-%m-%d') < DATE_FORMAT(users.DOB, '00-%m-%d')) AS age," +
                            "COUNT(votes.vote) AS SumVotes " +
                            "FROM votes " +
                            "INNER JOIN users " +
                            "on users.ID = votes.user_id " +
                            "AND votes.post_id = " + post_id + " " +
                            "GROUP BY votes.vote, age";
                connection.query(sql, function (err, rows, fields) {
                    if (err) {
                        console.log('Error while performing Query: %s', sql);
                        res.send(err);
                        throw err
                    }


                    result.push({
                        'maleVotes1': maleVotes1,
                        'maleVotes2': maleVotes2,
                        'femaleVotes1': femaleVotes1,
                        'femaleVotes2': femaleVotes2
                    });

                    result.push(rows);

                    result.push({
                        'currentTime': time
                    });


                    res.contentType('application/json');
                    console.log("Sending result: " + result);
                    res.send(JSON.stringify(result));

                });
            });
        });
    });





    app.post('/getMyPosts', rawBody, function (req, res) {
        console.log("GET MY POSTS REQUEST RECEIVED");
        if (req.rawBody && req.bodyLength > 0) {
            console.log(req.bodyLength);
            //Parse the JSON from binary:
            var rawJson = req.rawBody;
            var jsonBuffer = new Buffer(rawJson, "binary");
            var json = JSON.parse(jsonBuffer);
            var uID = json['uID'];

            var sql =   "SELECT id, title, image1, description1, image2, description2, votes1, votes2, DATE_FORMAT(upload_time,'%Y.%m.%d %H:%i:%s') as upload_time, DATE_FORMAT(promotion_expiration,'%Y.%m.%d %H:%i:%s') as promotion_expiration " +
                        "FROM posts_with_mediumblob WHERE user_id = '" + uID + "'";

            connection.query(sql, function (err, rows, fields) {
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
                        var date = rows[i]['upload_time'];
                        var promExp = rows[i]['promotion_expiration'];
                        var votes1 = rows[i]['votes1'];
                        var votes2 = rows[i]['votes2'];
                        var id = rows[i]['id'];

                        console.log("PROMOTION EXPIRATION:" + promExp);

                        result.push({
                            'title': title,
                            'description1': description1,
                            'description2': description2,
                            'image1': image1Base64,
                            'image2': image2Base64,
                            'id': id,
                            'votes1': votes1,
                            'votes2': votes2,
                            'date': date,
                            'promotion_expiration': promExp
                        })
                    }
                    res.contentType('application/json');
                    console.log("Sending result: " + result);
                    res.send(JSON.stringify(result));
                }
                else {
                    console.log('Error while performing Query: %s', sql);
                    res.send(err);
                    throw err;
                }
            });
        }
        else {
            console.log("Empty or wrong request received!");
        }
    });


    app.post('/login', rawBody, function (req, res) {
        console.log("LOGIN REQUEST RECEIVED.");
        if (req.rawBody && req.bodyLength > 0) {
            console.log(req.bodyLength);
            //Parse the JSON from binary:
            var rawJson = req.rawBody;
            var jsonBuffer = new Buffer(rawJson, "binary");
            var json = JSON.parse(jsonBuffer);

            var uID = json['uID'];

            var sql =   "INSERT IGNORE INTO users " +
                        "SET ID = " + uID + "; " +
                        "SELECT Tokens FROM users " +
                        "WHERE ID = " + uID;

            console.log("Got SQL Query");
            connection.query(sql, function (err, rows, fields) {
                if (err) {
                    console.log('Error while performing Query');
                    res.send("-1");
                    throw err
                }
                var tokens = rows[1][0]['Tokens'];
                res.contentType('application/json');
                console.log("Send Tokens: " + tokens);
                res.send(String(tokens));
            });
        }
        else{
            console.log("Empty or wrong request received!");
        }
    });


    app.post('/getTokenCount', rawBody, function (req, res) {
        console.log("GET TOKENS REQUEST RECEIVED.");
        if (req.rawBody && req.bodyLength > 0) {
            console.log(req.bodyLength);
            //Parse the JSON from binary:
            var rawJson = req.rawBody;
            var jsonBuffer = new Buffer(rawJson, "binary");
            var json = JSON.parse(jsonBuffer);
            var user_id = json['uid'];
            console.log("Received User ID: " + user_id);

            var sql =
                "SELECT Tokens FROM users " +
                "WHERE ID = " + user_id;

            connection.query(sql, function (err, result) {
                if (err) {
                    console.log(err);
                    res.send("-1");
                    return;
                }

                var tokens = result[0]['Tokens'];
                res.contentType('application/json');
                console.log("Token Count: "+ tokens);
                res.send(String(tokens));

            });
        }
        else {
            console.log("Empty or wrong request received!");
        }
    });

    app.post('/vote', rawBody, function (req, res) {
        console.log("VOTE REQUEST RECEIVED.");
        if (req.rawBody && req.bodyLength > 0) {
            console.log(req.bodyLength);
            //Parse the JSON from binary:
            var rawJson = req.rawBody;
            var jsonBuffer = new Buffer(rawJson, "binary");
            var json = JSON.parse(jsonBuffer);
            var post_id = json['id'];
            var user_id = json['uid'];
            var vote = json['vote'];
            console.log("Received: "+post_id + " " + user_id + " " +vote);

            var sql =
                "INSERT INTO votes (user_id, post_id, vote, vote_time)" +
                " VALUES ('" + user_id + "', '" + post_id + "', '" + vote + "', "+ "NOW()); " +

                "UPDATE posts_with_mediumblob " +
                "SET votes" + vote + " = votes" + vote + " + 1 " +
                "WHERE id = " + post_id + "; " +

                "UPDATE users " +
                "SET Tokens = @tokens := Tokens + 10 " +
                "WHERE ID = " + user_id +"; " +

                "SELECT @tokens as Tokens;";

            connection.query(sql, function (err, result) {
                if (err) {
                    console.log('Error while performing Query');
                    res.send("-1");
                    return;
                }

                var tokens = result[3][0]['Tokens'];
                res.contentType('application/json');
                console.log("Vote was successful, Tokens: "+ tokens);
                res.send(String(tokens));

            });
        }
        else {
            console.log("Empty or wrong request received!");
        }
    });


    app.post('/report', rawBody, function (req, res) {
        console.log("REPORT REQUEST RECEIVED.");
        if (req.rawBody && req.bodyLength > 0) {
            console.log(req.bodyLength);
            //Parse the JSON from binary:
            var rawJson = req.rawBody;
            var jsonBuffer = new Buffer(rawJson, "binary");
            var json = JSON.parse(jsonBuffer);
            var post_id = json['id'];
            console.log("Received: "+post_id);

            var sql =
                "UPDATE posts_with_mediumblob " +
                "SET report_count = report_count + 1 " +
                "WHERE id = " + post_id;

            connection.query(sql, function (err, rows, fields) {
                if (!err) {
                    res.contentType('application/json');
                    console.log("Report was successful");
                    res.send("true");
                } else {
                    console.log('Error while performing Query');
                    res.send("false");
                    throw err;
                }
            });
        }
        else {
            console.log("Empty or wrong request received!");
        }
    });




    app.post('/updateUser', rawBody, function (req, res) {
        console.log("` USER REQUEST RECEIVED.");
        if (req.rawBody && req.bodyLength > 0) {
            console.log(req.bodyLength);
            //Parse the JSON from binary:
            var rawJson = req.rawBody;
            var jsonBuffer = new Buffer(rawJson, "binary");
            var json = JSON.parse(jsonBuffer);

            var id = json['ID'];
            var firstName = json['FirstName'];
            var lastName = json['LastName'];
            var email = json['Email'];
            var birthDate = json['BirthDate'];
            var gender = json['Gender'];
            var country = json['Country'];

            var sql =
                "UPDATE users " +
                "SET FirstName = '" + firstName + "', " +
                    "LastName = '" + lastName + "', " +
                    "Email = '" + email + "', " +
                    "Gender = '" + gender + "', " +
                    "DOB = '" + birthDate + "', " +
                    "Country = '" + country + "' " +

                "WHERE ID = '" + id + "'";

            console.log("Got SQL Query");
            connection.query(sql, function (err, rows, fields) {
                if (!err) {
                    var id = rows['insertId'];
                    res.contentType('application/json');
                    console.log("Sending result: " + id);
                    res.send(String(id));
                }
                else {
                    console.log('Error while performing Query');
                    res.send("-1");
                    throw err;
                }
            });
        }
        else{
            console.log("Empty or wrong request received!");
        }
    });

}