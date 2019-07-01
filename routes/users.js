var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
var mongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

/* GET users listing. */
router.post('/login', function(req, res, next) {
    bcrypt.hash("021021",10).then((result) => console.log(result));
    console.log(req.body);
    mongoClient.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db("lora_server");
        dbo.collection("users").findOne({username: req.body.username},function(err, result) {
            bcrypt.compare(req.body.password, result.password).then((resu) => {
                if(!resu)
                    return res.json({status: "wrong password"});
                const token = jwt.sign({username: req.body.username, userID: result._id},'SePSepsEPsEpAicaICAIC');
                console.log("logged in");
                return res.json({status:"logged in",token: token});
            }).catch(err => {});
            db.close();
        });
    });
});

module.exports = router;
