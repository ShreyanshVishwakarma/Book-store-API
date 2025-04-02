const express = require('express')
const authMiddleware = require('../middleware/auth-middleware')
const router = express.Router();

router.get('/home',authMiddleware,(req,res)=>{
    res.json({
        message: "welcome to home page"
    })
})

module.exports = router;
