var express = require('express');
var router = express.Router();
var mongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
router.post('/send_data/:sensorID/', function (req, res, next) {
    mongoClient.connect(url, function (err, db) {
        /* too encoded_data data i ke sensor ferestade hast */
        if (err) throw err;
        var encoded_data = req.body.data; // input data from sensor ( encrypted )
        var dbo = db.db("lora_server");

        //tabdile binary be string inja bayad bashe , tarjihan ye function bashe behtare ;)

        var decoded_data = ''; // variable that will replace with decrypted encoded_data
        console.log(decoded_data); // test decryption
        /* code e ziri male mongodb hast ke age mongodb dashti runesh kon age na ham mohem nist , in oke */
        // var data_insert = {sensorID: req.body.sensorID, data: decoded_data, time_received: new Date()};
        // dbo.collection('sensors_data').insertOne(data_insert);
    });
});
module.exports = router;