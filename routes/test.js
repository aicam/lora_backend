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

// var day_plan_by_time = [];
// item.split(':')[1].replace('"','').replace('"','').split('/').map(item2 => {
//
//     day_plan_by_time.push({"startHour": item2.split('-')[0].split(':')[0]
//         ,"startMinute":item2.split('-')[0].split(':')[1],
//         "endHour": item2.split('-')[1].split(':')[0],
//         "endMinute": item2.split('-')[1].split(':')[1]});
// });
// day_plan[day.toString()] = day_plan_by_time;