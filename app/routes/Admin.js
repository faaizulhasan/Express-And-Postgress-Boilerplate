const express = require("express");
const router = express.Router();

const CheckApiToken = require("../Middleware/CheckApiToken");
const AdminApiAuthentication = require("../Middleware/AdminApiAuthentication");

const UserController = require("../Controllers/Api/Admin/UserController");
const PageController = require("../Controllers/Api/PageController");
const LookupController = require("../Controllers/Api/Admin/LookupController");
const LookupDataController = require("../Controllers/Api/Admin/LookupDataController");
const AppUserController = require("../Controllers/Api/User/UserController");
const AppUpdateController = require("../Controllers/Api/AppUpdateController");


/*---------------------------------- AppUpdate ROUTES------------------------------*/
router.get("/app-updates", AdminApiAuthentication.authenticate, (req, res) => (new AppUpdateController()).index({ request: req, response: res }))
router.post("/app-updates", AdminApiAuthentication.authenticate, (req, res) => (new AppUpdateController()).store({ request: req, response: res }))

/*---------------------------------- Attachments ROUTES ------------------------------*/
router.post('/upload-attachments', AdminApiAuthentication.authenticate, (req, res) => (new AppUserController()).uploadAttachments({ request: req, response: res }))

/*----------------------------------   Lookups Routes  ------------------------------*/
router.get('/lookup', AdminApiAuthentication.authenticate, (req, res) => (new LookupController()).index({ request: req, response: res }))
router.post('/lookup/:id', AdminApiAuthentication.authenticate, (req, res) => (new LookupDataController()).store({ request: req, response: res }))

/*---------------------------------- Page ROUTES ------------------------------*/
router.get("/page", AdminApiAuthentication.authenticate, (req, res) => (new PageController()).index({ request: req, response: res }))
router.get("/page/:id", AdminApiAuthentication.authenticate, (req, res) => (new PageController()).show({ request: req, response: res }))
router.post("/page", AdminApiAuthentication.authenticate, (req, res) => (new PageController()).store({ request: req, response: res }))
router.patch("/page/:id", AdminApiAuthentication.authenticate, (req, res) => (new PageController()).update({ request: req, response: res }))
router.delete("/page/:id", AdminApiAuthentication.authenticate, (req, res) => (new PageController()).destroy({ request: req, response: res }))

/*----------------------------------   Account Routes  ------------------------------*/
router.post('/login', CheckApiToken, (req, res) => (new UserController()).login({ request: req, response: res }))
router.patch('/', AdminApiAuthentication.authenticate, (req, res) => (new UserController()).update({ request: req, response: res }))
router.post('/forgot-password', CheckApiToken, (req, res) => (new UserController()).forgotPassword({ request: req, response: res }))
router.post('/change-password', AdminApiAuthentication.authenticate, (req, res) => (new UserController()).changePassword({ request: req, response: res }))
router.post('/logout', AdminApiAuthentication.authenticate, (req, res) => (new UserController()).logout({ request: req, response: res }))
router.get('/', AdminApiAuthentication.authenticate, (req, res) => (new UserController()).getMyProfile({ request: req, response: res }))


module.exports = router