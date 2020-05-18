var express = require('express');
var router = express.Router();
var mongoClient = require('mongodb').MongoClient;
var moment = require('jalali-moment');
var url = "mongodb://localhost:27018";

//var url = "mongodb+srv://aicam:021021ali@loraserver-g7s1o.azure.mongodb.net/test?retryWrites=true&w=majority";
function decode(Encoded_data, key) {
    key = key.substr(1);
    var tmp = key.slice(0, 2);
    tmp = parseInt(tmp);
    var num_byte = (tmp - 1) / 2;
    var tmp_2 = key.substr(2);
    tmp_2 = parseInt(tmp_2);
    var be_not = tmp_2 % 8;

    function binaryToString(str, num_byte) {
        mystring = new Array();
        for (i = 0; i < num_byte; i++) {
            mystring[i] = str.slice(i * 8, (i + 1) * 8).split('');
        }
        return mystring
    }

    var string_data = binaryToString(Encoded_data, num_byte);

    function correct_ness(str, num_byte, be_not) {
        for (i = 0; i < num_byte; i++) {
            for (j = 0; j < be_not; j++) {
                if (str[i][j] == '1') {
                    str[i][j] = str[i][j].replace('1', '0');

                } else {
                    str[i][j] = str[i][j].replace('0', '1');
                }
            }
        }
        return str
    }

    var cur_str = correct_ness(string_data, num_byte, be_not);

    function join(str) {
        var joined = str.join();
        joined = joined.replace(/,/g, '');
        return joined
    }

    var decoded = join(cur_str);
    return decoded
}

router.post('/send_data/:sensorID/', function (req, res, next) {
    mongoClient.connect(url, function (err, db) {
        /* too encoded_data data i ke sensor ferestade hast */
        if (err) throw err;
        var encoded_data = req.body.data; // input data from sensor ( encrypted )
        var dbo = db.db("lora_server");
        var decoded_data = '';
        console.log(decoded_data);
        res.send("ok bitch :)))");
        var data_insert = {sensorID: req.params.sensorID, data: req.body.data, time_received: new Date()};
        dbo.collection('sensors_data').insertOne(data_insert);
    });
});
router.get('/check_new_data/:relayID', function (req, res, next) {
    try {
        var relayID = req.params.relayID;
        mongoClient.connect(url, function (err, db) {
            var dbo = db.db('lora_server');
            var filter = {relayID: relayID};
            dbo.collection('groups').findOne(filter, function (err, result) {
                dbo.collection('groups_plan').findOne({gpname: result.gpname}, function (err2, result2) {
                    if (result2.new_plan) {
                        dbo.collection('groups_plan').updateOne({gpname: result.gpname}, {$set: {new_plan: false}});
                        return res.json({new_plan: true, day: moment().locale('fa').format('D'), emergency:result2.emergency == 'true'});
                    } else
                        return res.json({new_plan: true, day: moment().locale('fa').format('D'), emergency:result2.emergency == 'true'});
                });
            })
        });
    } catch (e) {
        res.json({status: 0})
    }
});
router.get('/new_plan/:relayID', function (req, res, next) {
    try {
        var group_name = 'dasd';
        mongoClient.connect(url, function (err, db) {
            var dbo = db.db('lora_server');
            var filter = {relayID: req.params.relayID};
            dbo.collection('groups').findOne(filter, function (err, result_gp) {
                group_name = result_gp.gpname;
                filter = {gpname: group_name};
                var plan_regex = RegExp('"[0-9]+":"[0-9]+:[0-9]+-[0-9]+:[0-9]+"');
                // [{"04":"12:03-16:0"},{"10":"8:0-9:0"}]
                dbo.collection('groups_plan').findOne(filter, function (err, result) {
                    var finalJson;
                    var day_plan = {};
                    var plan = result.plan;
                    var day;
                    if (!plan)
                        return res.json({status: 0});
                    plan.toString().split(',').map(day_sep => {
                        if (plan_regex.test(day_sep)) {
                            var go_parse = true;
                            if (!day_sep) {
                                go_parse = false;
                            }
                            if (go_parse) {
                                day = parseInt(day_sep.split('"')[1]).toString();
                                console.log(day);
                                var save_day_plan = [];
                                day_sep.split('"')[3].split('/').map(time_sep => {
                                    save_day_plan.push({
                                        "startHour": time_sep.split('-')[0].split(':')[0],
                                        "startMinute": time_sep.split('-')[0].split(':')[1],
                                        "endHour": time_sep.split('-')[1].split(':')[0],
                                        "endMinute": time_sep.split('-')[1].split(':')[1]
                                    })
                                });
                                day_plan[`${day}`] = save_day_plan;
                            }
                        }
                    });
                    return res.json(plan);
                });
            });
        });
        throw "error";
    } catch (e) {
        console.log("aa");
    }
});
module.exports = router;
