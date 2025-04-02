const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const User = require('../models/User');


// register user

const registerUser = async (req, res) => {
    try {
        const { username, email, password, role = 'user' } = req.body;

        // Check if required fields are provided
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields (username, email, password) are required"
            });
        }

        const checkExistingUser = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (checkExistingUser) {
            return res.status(409).json({
                success: false,
                message: 'Username or email already exists, please try with another one.'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash(password, salt);

        const createUser = new User({
            username,
            email,
            password: hashedPass,
            role,
        });

        await createUser.save();

        console.log("New user created successfully");
        return res.status(201).json({
            success: true,
            message: "New user created successfully",
            data: createUser
        });

    } catch (error) {
        console.error("Error: ", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while registering the user"
        });
    }
};


// login user
const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required"
            });
        }

        // Find user in the database (MUST use await)
        const isuser = await User.findOne({ username });

        if (!isuser) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password"
            });
        }

        // Compare password
        const isPasswordCorrect = await bcrypt.compare(password, isuser.password);

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password"
            });
        }

        // Generate JWT token
        const accessToken = jwt.sign(
            {
                id: isuser._id,
                username: isuser.username,
                role: isuser.role
            },
            process.env.JWT_SECRETKEY,
            { expiresIn: "15m" }
        );

        // Set cookie before sending the response
        res.cookie('loggedin', 'logged', { HttpOnly: true });

        res.status(200).json({
            success: true,
            message: "Logged in successfully",
            token: accessToken
        });

    } catch (error) {
        console.error('User authentication failed:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error. Please try again later."
        });
    }
};


module.exports = {
    registerUser,
    loginUser
}