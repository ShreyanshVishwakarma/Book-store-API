const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const authMiddleware = (req, res, next) =>{
    console.log('middleware running')
        const Bearertoken = req.headers['authorization']
        const token = Bearertoken.split(" ")[1]
        console.log(token)

    try {
        const decodedTokenInfo =  jwt.verify(token,process.env.JWT_SECRETKEY)
        console.log(decodedTokenInfo)
        req.userInfo = decodedTokenInfo;
        next();

    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            message: "Access denied!"
        })
    }
    next();
}


module.exports = authMiddleware;