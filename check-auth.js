const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    jwt.verify(token, "SePSepsEPsEpAicaICAIC");
    next();
  } catch (error) {
    console.log(req.headers.Authorization);
    res.status(401).json({ message: "Auth failed!" });
  }
};
