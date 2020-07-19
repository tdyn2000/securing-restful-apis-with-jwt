var express = require("express");
var router = express.Router();
var bodyParser = require("body-parser");

var VerifyToken = require("./VerifyToken");

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());
var User = require("../user/User");

/**
 * Configure JWT
 */
var jwt = require("jsonwebtoken"); // used to create, sign, and verify tokens
var bcrypt = require("bcryptjs");
var config = require("../config"); // get config file

router.post("/login", function (req, res) {
  User.findOne({ email: req.body.email }, function (err, user) {
    if (err) return res.status(500).send("Error on the server.");
    if (!user) return res.status(404).send("No user found.");

    // check if the password is valid
    var passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
    if (!passwordIsValid)
      return res.status(401).send({ auth: false, token: null });

    // if user is found and password is valid
    // create a token
    var token = jwt.sign({ id: user._id }, config.secret, {
      expiresIn: 86400, // expires in 24 hours
    });

    // return the information including token as JSON
    res.status(200).send({ auth: true, token: token });
  });
});

router.get("/logout",VerifyToken, function (req, res) {
  jwt.destr
  res.status(200).send({ auth: false, token: null });
});

router.post("/register", function (req, res) {
  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.json({
      success: false,
      message: "Please enter email and password.",
    });
  }
  User.findOne({ email: email }, function (err, user) {
    if (user) {
      return res.status(500).send("Email is registered!");
    } else {
      var hashedPassword = bcrypt.hashSync(req.body.password);
      User.create(
        {
          name: name,
          email: email,
          password: hashedPassword,
        },
        function (err, user) {
          if (err)
            return res
              .status(500)
              .send("There was a problem registering the user`.");
          
          // create a token
          var token = jwt.sign({ id: user._id }, config.secret, {
            expiresIn: 86400, // expires in 24 hours
          });
          res.status(200).send({ auth: true, token: token });
        }
      );
    }
  });
});

router.get("/me", VerifyToken, function (req, res, next) {
  User.findById(req.userId, { password: 0 }, function (err, user) {
    if (err)
      return res.status(500).send("There was a problem finding the user.");
    if (!user) return res.status(404).send("No user found.");
    res.status(200).send(user);
  });
});

module.exports = router;
