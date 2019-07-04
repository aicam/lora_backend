var express = require('express');
var router = express.Router();
var mongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
/* GET users listing. */
router.get('/', function(req, res, next) {
    var mqtt = require('mqtt');
    //doker connection
    var client  = mqtt.connect('mqtt://io.lpwandata.com:1883',{ useNewUrlParser: true, username: 'sepantopAdmin', password: '5epanT0p_Adm1n' });

    client.on('connect', function () {
        client.subscribe('application/#', function (err) {
            if (!err) {
                console.log("connected");
            }
        })
    });
    //start interaction
    client.on('message', function (topic, message) {
        // message is Buffer
        console.log(message.toString());
        res.end(message.toString());
        client.end();
    })
});
module.exports = router;