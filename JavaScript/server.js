var express = require('express');
var app = express();

var controllers = require('./controllers');
controllers.set(app);
var SERVER_PORT = 8080;
process.env['accountname'] = 'chooserstorage';
process.env['accountkey'] = 'rFb94KokcSFjPQJflCWmy9t8AqAM7rWdeUNYzGfiaEPKsY8kO2Lm2tF8fgEHsLIVCjGMYlYVP++vQ78+tYpV5A==';


var server = app.listen(SERVER_PORT, function () {
    var port = server.address().port;

    console.log('Listening on port %s', port);
});

