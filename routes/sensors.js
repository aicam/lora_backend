var express = require('express');
var router = express.Router();
var mongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017";
//var url = "mongodb+srv://aicam:021021ali@loraserver-g7s1o.azure.mongodb.net/test?retryWrites=true&w=majority";
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
router.get('/sensorLocation/:sensorID', checkAuth, function (req, res, next) {
    mongoClient.connect(url, function (err, db) {
        var dbo = db.db("lora_server");
        dbo.collection("sensors").findOne({sensorID: req.params.sensorID}, (err, result) => {
            return res.json({long: result.long, lat: result.lat});
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


router.get('/add_sensor/:sensorID/:sensorName/:period/:long/:lat/:username', function (req, res, next) {
    mongoClient.connect(url, {useNewUrlParser: true}, function (err, db) {
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

router.post('/schedule/', checkAuth, function (req, res, next) {
    var username = req.body.username;
    var gpname = req.body.gpname;
    var plan = req.body.plan;
    var filter = {
        username: username,
        gpname: gpname
    };
    var update = {
        $set: {
            plan: plan,
            new_plan: true
        }
    };
    mongoClient.connect(url, function (err, db) {
        var dbo = db.db("lora_server");
        dbo.collection("groups_plan").updateOne(filter, update, function (err, resp) {
            if (err) throw err;
            db.close();
            return res.json({"status": 1});
        });
    })
});

router.get('/emergency_situation/:username', function (req, res, next) {
   mongoClient.connect(url, function (err, db) {
      var dbo = db.db("lora_server");
      var situations = [];
      dbo.collection("groups_plan").find({username: req.params.username}).toArray(function (err, result) {
          result.map(item => {
             situations.push({gpname: item.gpname, emergency: item.emergency === 'true'});
          });
          return res.json(situations);
      });
   });
});

router.get('/emergency_call/:gpname/:value', checkAuth, function (req, res, next) {
   mongoClient.connect(url, function (err, db) {
       var dbo = db.db("lora_server");
       dbo.collection("groups_plan").updateOne({gpname: req.params.gpname},{$set: {emergency: req.params.value}});
       res.json({status: 1});
   })
});

router.get('/get_groups/:username', checkAuth, function (req, res, next) {
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

router.get('/get_relays/:username', function (req, res, next) {
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

router.post('/add_group/:username', checkAuth, function (req, res, next) {
    mongoClient.connect(url, function (err, db) {
        var dbo = db.db("lora_server");
        var names = JSON.parse(req.body.relays);
        names.map(item => {
            var ins = {gpname: req.body.gpname, relayID: item};
            dbo.collection("groups").insertOne(ins);
        });
        dbo.collection("groups_plan").insertOne({username: req.params.username,gpname: req.body.gpname,plan:"", new_plan: false, emergency: false});
        return res.json({status: 1});
    });
});


function find_gpnames(dbo, username) {
    return new Promise((resolve => {
        let coll = dbo.collection("groups_plan");
        var gpnames = [];
        let ad = coll.find({username: username});
        ad.toArray(function (err, result) {
            result.map(function (items) {
                gpnames.push(items.gpname);
            });
            resolve(gpnames)
        });
    }));
}
async function find_relayID(collection, gpnames){
    return new Promise(async resolve => {
        var jsonstring = [];
        for (let i = 0; i < gpnames.length; i++) {
            let r3 = await find_relays(collection, gpnames[i]);
            jsonstring.push({relays: r3, gpname: gpnames[i]});
        }
        resolve(jsonstring);
    });
}
async function find_relays(collection, gpname){
    return new Promise(resolve => {
        var relays = [];
        collection.find({gpname: gpname}).toArray(function (err, result) {
            result.map(item => relays.push(item.relayID));
            resolve(relays);
        });
    });
}
router.get('/get_groupsArray/:username', async function (req, res, next) {
    const mongoserver = await mongoClient.connect(url);
    var dbo = mongoserver.db("lora_server");
    let coll = dbo.collection("groups_plan");
    gpnames = await find_gpnames(dbo, req.params.username);
    var coll2 = dbo.collection("groups");
    var jsonstring = await find_relayID(coll2,gpnames);
    console.log(jsonstring);
    return res.json(jsonstring);
});
module.exports = router;
