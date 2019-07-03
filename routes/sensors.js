var express = require('express');
var router = express.Router();
var mongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
const checkAuth = require('../check-auth');
/* GET users listing. */
router.get('/sensors/:username', checkAuth, function (req, res, next) {
    var names = [];
    mongoClient.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db("lora_server");
        dbo.collection("sensors").find({user: req.params.username}).toArray(function (err, result) {
            if (err) throw err;
            result.map((item) => {
                names.push({name: item.name, id: item.sensorID})
            });
            db.close();
            return res.json(names);
        });
    });
});

router.get('/sensor_data/:sensorID', checkAuth, function (req, res, next) {
    var names = [];
    mongoClient.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db("lora_server");
        dbo.collection("sensors_data").find({sensorID: req.params.sensorID}).toArray(function (err, result) {
            if (err) throw err;
            result.map((item) => {
                names.push({data: item.data, time: item.time_received})
            });
            db.close();
            return res.json(names);
        });
    });
});

router.get('/add_relay/:relayID/:name/:long/:lat/:user', checkAuth, function (req, res, next) {
    mongoClient.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db("lora_server");
        var new_sensor = {
            relayID: req.params.relayID,
            name: req.params.name,
            user: req.params.user,
            last_update: 0,
            auto_on_active: 0,
            long: req.params.long,
            lat: req.params.lat
        };
        dbo.collection("relay").insertOne(new_sensor, function (err, resp) {
            if (err) throw err;
            db.close();
            return res.json({"status": 1});
        });
    });
});


router.get('/add_sensor/:sensorID/:sensorName/:period/:long/:lat/:username', checkAuth, function (req, res, next) {
    mongoClient.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db("lora_server");
        var new_sensor = {
            name: req.params.sensorName,
            sensorID: req.params.sensorID,
            period: req.params.period,
            long: req.params.long,
            lat: req.params.lat,
            dtype: "normal",
            condition: "new",
            user: req.params.username,
        };
        dbo.collection("sensors").insertOne(new_sensor, function (err, resp) {
            if (err) throw err;
            db.close();
            return res.json({"status": 1});
        });
    });
});

router.post('/schedule/',function (req,res,next) {
    var username = req.body.username;
    var gpname = req.body.gpname;
    var plan = req.body.plan;
    var filter = {
        username: username,
        gpname: gpname
    };
    var update = {
        $set : {
            plan: plan
        }
    };
    mongoClient.connect(url,function (err, db) {
        var dbo = db.db("lora_server");
        dbo.collection("groups_plan").updateOne(filter, update, function (err, resp) {
            if (err) throw err;
            db.close();
            return res.json({"status": 1});
        });
    })
});

router.get('/get_groups/:username', function (req, res, next) {
    mongoClient.connect(url, function (err, db) {
        var dbo = db.db("lora_server");
        var names = [];
        dbo.collection("groups_plan").find({username: req.params.username}).toArray(function (err, result) {
            result.map(item => {
               names.push(item.gpname);
            });
            return res.json(names);
        });
    });
});

router.get('/get_relays/:username', function (req,res,next) {
   mongoClient.connect(url, function (err, db) {
       var dbo = db.db("lora_server");
       var names = [];
       dbo.collection("relay").find({user: req.params.username}).toArray(function (err, result) {
          result.map(item => {
              names.push({name: item.name, id: item.relayID});
          });
          return res.json(names);
       });
   })
});

router.post('/add_group/', function (req,res,next) {
   mongoClient.connect(url, function (err, db) {
       var dbo = db.db("lora_server");
       var names = JSON.parse(req.body.relays);
       names.map(item => {
           var ins = {gpname: req.body.gpname, relayID: item};
          dbo.collection("groups").insertOne(ins);
       });
       return res.json({status:1});
   });
});
module.exports = router;