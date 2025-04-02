const express = require("express")
const {registerUser , loginUser} = require('../controllers/auth-controller');
const { route } = require("./book-routes");

const router = express.Router();

router.post('/signup',registerUser)
router.post('/login',loginUser)

module.exports = router;