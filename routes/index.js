var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

const {verifyToken} = require("../middleware/auth")
const USER_CONTROLLER = require("../app/auth/controller/controller")
const POST_CONTROLLER = require("../app/post/controller/controller")



router.post("/signup",USER_CONTROLLER.signup)
router.put('/verifyOtp',USER_CONTROLLER.verifyOtp);
router.post("/login",USER_CONTROLLER.login)
router.put("/editProfile",verifyToken,USER_CONTROLLER.editProfile)
router.put("/forgotPassword",USER_CONTROLLER.forgotPassword)
router.post("/resetPassword",USER_CONTROLLER.resetPassword)
router.put("/updatePassword",verifyToken,USER_CONTROLLER.updatePassword)

router.post("/addpost",verifyToken,POST_CONTROLLER.add)
router.get("/listpost",verifyToken,POST_CONTROLLER.list)
router.get("/posts/:id",verifyToken,POST_CONTROLLER.edit)
router.get("/posts/:id",verifyToken,POST_CONTROLLER.remove)


module.exports = router;
