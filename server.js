var express = require('express');
var app = express();

app.get('/', function (req, res) {
	res.send('Hello World!');
});

app.get('/addShit', function (req, res) {
	res.send('Shit added!!');
});

var server = app.listen(8080, function () {
  var port = server.address().port;

  console.log('Example app listening on port %s', port);
});