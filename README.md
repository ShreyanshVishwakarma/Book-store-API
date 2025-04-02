author : Shreyansh Vishwakarma

# Persistent HTTP 1.1 Server Documentation

## Overview

This project implements a persistent HTTP 1.1 server based on RFC 7231 using Node.js and Express. The server manages books and user authentication, supporting methods such as GET, POST, PUT, and DELETE. It uses JWT for authentication, cookies for session management, and MongoDB Atlas for data persistence.

## Project Structure

```
.env
controllers/
	auth-controller.js
	book-controller.js
database/
	db.js
middleware/
	auth-middleware.js
models/
	Book.js
	User.js
package.json
routes/
	admin-routes.js
	book-routes.js
	home-routes.js
	user-auth-router.js
server.js
```

## Technologies Used

-   Node.js
-   Express
-   Mongoose
-   jsonwebtoken
-   bcrypt
-   dotenv

## Environment Variables

The `.env` file contains sensitive information and configuration settings:

```properties
PORT = 3000
MONGO_URI="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority&appName=Test"
JWT_SECRETKEY = <your_jwt_secret_key>
```

-   `PORT`: The port on which the server will listen for incoming connections.  Defaults to 3000 if not specified.
-   `MONGO_URI`: The connection string for the MongoDB Atlas database.  Replace `<username>`, `<password>`, and `<cluster>` with your actual MongoDB Atlas credentials.  The database name is `test` in this configuration.
-   `JWT_SECRETKEY`: A secret key used to sign and verify JSON Web Tokens (JWTs).  This should be a strong, randomly generated string.  **Important:** Keep this key secure.

## MongoDB Atlas Integration

The application uses MongoDB Atlas as its database.  To connect to MongoDB Atlas:

1.  **Create an Atlas account:** If you don't have one, sign up at [https://www.mongodb.com/atlas/](https://www.mongodb.com/atlas/).
2.  **Create a cluster:** Follow the Atlas instructions to create a new cluster.
3.  **Whitelist your IP address:**  In the Atlas dashboard, under "Security" -> "Network Access", add your current IP address to the whitelist.  For development, you can whitelist all IP addresses (0.0.0.0/0), but this is **not recommended** for production.
4.  **Create a database user:**  In the Atlas dashboard, under "Security" -> "Database Access", create a new user with appropriate permissions for your database.
5.  **Get the connection string:**  In the Atlas dashboard, click "Connect" for your cluster.  Choose "Connect your application" and select Node.js as your driver.  Copy the connection string and paste it into the .env file as the value for `MONGO_URI`.  **Remember to replace `<username>` and `<password>` with the credentials of the database user you created.**

The connection to MongoDB is established in db.js:

```javascript
require('dotenv').config();
const mongoose = require('mongoose');


async function connectDB(){
    if (mongoose.connection.readyState >= 1) {
        console.log("MongoDB already connected");
        return;
    }
    try {
       await mongoose.connect(process.env.MONGO_URI);
        console.log("connected to database successfully")
    } catch (error) {
        console.log("error : ",error)
    }
}

connectDB();
module.exports = connectDB;
```

This code uses Mongoose to connect to the MongoDB Atlas database specified in the `MONGO_URI` environment variable.  It also includes a check to prevent multiple connections.

## Models

### User Model (models/User.js)

```javascript
const mongoose = require("mongoose")

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    user: {
        type: String,
        enum : ['admin','user'],
        default: 'user'
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('user', UserSchema);
```

-   `username`:  A unique string representing the user's username.  Required.
-   `email`: A unique string representing the user's email address. Required.
-   `password`: A string representing the user's password.  Required.  This should be stored as a hash, not in plain text.
-   `user`: A string representing the user's role.  Can be either 'admin' or 'user'.  Defaults to 'user'.
-   `date`: A Date object representing the date the user was created.  Defaults to the current date and time.

### Book Model (models/Book.js)

```javascript
const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        unique: true,
        required: [true, 'The book title is required'],
        maxLength: [100, 'The book may be at most 100 characters long']
    },
    author: {
        type: String,
        trim: true,
        required: [true, 'The book author is required'],
        maxLength: [50, 'The author name can’t be too long']
    },
    year: {
        type: Number,
        min: [1700, 'Year must be greater than 1700'],
        max: [new Date().getFullYear(), 'Are you from the future?']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('book', BookSchema);
```

-   `title`: A unique string representing the book's title. Required.  Maximum length of 100 characters.
-   `author`: A string representing the book's author. Required. Maximum length of 50 characters.
-   `year`: A number representing the book's publication year. Must be between 1700 and the current year.
-   `createdAt`: A Date object representing the date the book was added. Defaults to the current date and time.

## Authentication

Authentication is handled using JWTs and bcrypt for password hashing.

### User Registration

-   **Endpoint:** `/auth/signup`
-   **Method:** POST
-   **Request Body:**

    ```json
    {
        "username": "exampleUser",
        "email": "user@example.com",
        "password": "password123"
    }
    ```
-   **Response:**
    -   **201 Created:** User created successfully.
    -   **400 Bad Request:** Missing required fields.
    -   **409 Conflict:** Username or email already exists.
    -   **500 Internal Server Error:** Error occurred while registering the user.

The registration logic is implemented in the `registerUser` function in auth-controller.js:

```javascript
const registerUser = async (req, res) => {
    try {
        const { username, email, password, role = 'user' } = req.body;

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
```

Key steps:

1.  **Input Validation:** Checks if all required fields (`username`, `email`, `password`) are present in the request body.
2.  **Duplicate Check:** Queries the database to check if a user with the given `username` or `email` already exists.
3.  **Password Hashing:** Uses `bcrypt` to generate a salt and hash the user's password before storing it in the database.
4.  **User Creation:** Creates a new `User` object with the provided information and saves it to the database.
5.  **Response:** Sends a success response with the created user data or an error response if something goes wrong.

### User Login

-   **Endpoint:** `/auth/login`
-   **Method:** POST
-   **Request Body:**

    ```json
    {
        "username": "exampleUser",
        "password": "password123"
    }
    ```
-   **Response:**
    -   **200 OK:** Logged in successfully, returns JWT token.
    -   **400 Bad Request:** Missing username or password.
    -   **401 Unauthorized:** Invalid username or password.
    -   **500 Internal Server Error:** Error occurred during authentication.

The login logic is implemented in the `loginUser` function in auth-controller.js:

```javascript
const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required"
            });
        }

        const isuser = await User.findOne({ username });

        if (!isuser) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password"
            });
        }

        const isPasswordCorrect = await bcrypt.compare(password, isuser.password);

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password"
            });
        }

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
```

Key steps:

1.  **Input Validation:** Checks if both `username` and `password` are provided.
2.  **User Lookup:** Attempts to find a user with the given `username` in the database.
3.  **Password Verification:** If a user is found, it uses `bcrypt.compare` to compare the provided password with the stored password hash.
4.  **JWT Generation:** If the password is correct, it generates a JWT containing the user's ID, username, and role.  The JWT is signed using the `JWT_SECRETKEY` from the .env file and expires after 15 minutes.
5.  **Cookie Setting:** Sets a cookie named `loggedin` with the value `logged`.  The `HttpOnly` flag is set to `true` to prevent client-side JavaScript from accessing the cookie.
6.  **Response:** Sends a success response containing the JWT.

### Authentication Middleware (middleware/auth-middleware.js)

```javascript
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
```

This middleware is used to protect routes that require authentication.

Key steps:

1.  **Token Extraction:** Extracts the JWT from the `Authorization` header of the request.  It assumes the header is in the format `Bearer <token>`.
2.  **Token Verification:** Uses `jwt.verify` to verify the token's signature and expiration.  It uses the `JWT_SECRETKEY` from the .env file to verify the signature.
3.  **User Information:** If the token is valid, it decodes the token and attaches the user information to the `req.userInfo` object.
4.  **Next:** Calls the `next()` function to pass control to the next middleware or route handler.
5.  **Error Handling:** If the token is invalid or missing, it sends an error response with a 401 Unauthorized status code.

## Book Management

The book management endpoints are defined in book-routes.js and handled by the functions in book-controller.js.

### Get All Books

-   **Endpoint:** `/api/books/get`
-   **Method:** GET
-   **Response:**
    -   **201 OK:** Returns a list of all books.
    -   **500 Internal Server Error:** Error fetching books.

The logic for fetching all books is implemented in the `getAllBooks` function in book-controller.js:

```javascript
async function getAllBooks(req, res) {
    try {
        const data = await Book.find({});
        res.status(201).json(data);
    } catch (err) {
        console.error('Error fetching books:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}
```

### Get Book by ID

-   **Endpoint:** `/api/books/get/:id`
-   **Method:** GET
-   **Response:**
    -   **201 OK:** Returns the book with the specified ID.
    -   **404 Not Found:** Book not found.
    -   **500 Internal Server Error:** Error fetching book.

The logic for fetching a book by ID is implemented in the `getAllBooksById` function in book-controller.js:

```javascript
async function getAllBooksById(req, res) {
    try {
        const bookId = req.params.id;
        const data = await Book.findById(bookId);
        if (!data) {
            return res.status(404).json({ message: 'Book not found' });
        }
        res.status(201).json(data);
    } catch (err) {
        console.error('Error fetching book:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}
```

### Add a New Book

-   **Endpoint:** `/api/books/post`
-   **Method:** POST
-   **Request Body:**

    ```json
    {
        "title": "Book Title",
        "author": "Author Name",
        "year": 2021
    }
    ```
-   **Response:**
    -   **200 OK:** New book added successfully.
    -   **400 Bad Request:** Invalid book data.
    -   **500 Internal Server Error:** Error adding book.

The logic for adding a new book is implemented in the `addBook` function in book-controller.js:

```javascript
async function addBook(req, res) {
    try {
        const data = req.body;
        if (data) {
            const newBook = new Book(data);
            await newBook.save();
            console.log('New book saved');
            res.json({
                message: "New book added successfully",
                data: newBook
            });
        } else {
            res.status(400).json({ message: 'Invalid book data' });
        }
    } catch (error) {
        console.log("Error: ", error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
}
```

### Update Book by ID

-   **Endpoint:** `/api/books/update/:id`
-   **Method:** PUT
-   **Request Body:**

    ```json
    {
        "title": "Updated Title",
        "author": "Updated Author",
        "year": 2022
    }
    ```
-   **Response:**
    -   **200 OK:** Book updated successfully.
    -   **404 Not Found:** Book not found.
    -   **500 Internal Server Error:** Error updating book.

The logic for updating a book by ID is implemented in the `updateBookById` function in book-controller.js:

```javascript
async function updateBookById(req, res) {
    try {
        const bookId = req.params.id;
        const updateData = req.body;
        const updatedBook = await Book.findByIdAndUpdate(bookId, updateData, { new: true });
        if (!updatedBook) {
            return res.status(404).json({ message: "Book not found" });
        }
        res.status(200).json({
            message: "Book updated successfully",
            data: updatedBook
        });
    } catch (error) {
        console.error("Error updating book:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}
```

### Delete Book by ID

-   **Endpoint:** `/api/books/delete/:id`
-   **Method:** DELETE
-   **Response:**
    -   **200 OK:** Book deleted successfully.
    -   **404 Not Found:** Book not found.
    -   **500 Internal Server Error:** Error deleting book.

The logic for deleting a book by ID is implemented in the `deleteBookById` function in book-controller.js:

```javascript
async function deleteBookById(req, res) {
    try {
        const bookId = req.params.id;
        const deletedBook = await Book.findByIdAndDelete(bookId);
        if (!deletedBook) {
            return res.status(404).json({ message: "Book not found" });
        }
        res.status(200).json({
            message: "Book deleted successfully",
            data: deletedBook
        });
    } catch (error) {
        console.error("Error deleting book:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}
```

## HTTP Methods

The server supports the following HTTP methods:

-   **GET:** Retrieves a resource.
-   **POST:** Creates a new resource.
-   **PUT:** Updates an existing resource.
-   **DELETE:** Deletes a resource.
-   **HEAD:** Similar to GET, but only retrieves the headers, not the body. (Not explicitly implemented, but Express handles it automatically for GET requests).

## Error Codes

The server generates the following HTTP response codes:

-   **200 OK:** Request succeeded.
-   **201 Created:** Resource created successfully.
-   **400 Bad Request:** Invalid request data.
-   **401 Unauthorized:** Authentication failed.
-   **403 Forbidden:** Access denied. (Not currently implemented)
-   **404 Not Found:** Resource not found.
-   **409 Conflict:** Resource conflict. (User already exists)
-   **500 Internal Server Error:** Server error.
-   **502 Bad Gateway:** Invalid response from upstream server. (Not currently implemented)
-   **503 Service Unavailable:** Server is currently unavailable. (Not currently implemented)

## Cookies

The server uses cookies for session management. Upon successful login, a cookie named `loggedin` is set with the value `logged`. This cookie is used to track whether a user is logged in.  The `HttpOnly` flag is set to prevent client-side JavaScript from accessing the cookie, improving security.

## Routes

-   `/auth`: Contains authentication routes (`/auth/signup`, `/auth/login`).  See user-auth-router.js.
-   `/api/books`: Contains book management routes (`/api/books/get`, `/api/books/post`, `/api/books/update/:id`, `/api/books/delete/:id`). See book-routes.js.
-   `/home`:  A protected route that requires authentication. See home-routes.js.
-   `/admin`: An admin route. See admin-routes.js. (Currently empty).

## Running the Server

1.  **Install dependencies:**

    ```sh
    npm install
    ```
2.  **Configure the .env file:**  Make sure to set the `MONGO_URI` and `JWT_SECRETKEY` environment variables.
3.  **Start the server:**

    ```sh
    npm run dev
    ```
4.  The server will be running at `http://localhost:3000`.

## Testing

You can use Postman to verify request messages and test the endpoints.

## Conclusion

This documentation provides a comprehensive overview of the HTTP server, including authentication, book management, error codes, and usage of cookies. The server is designed to handle various HTTP methods and generate appropriate response codes as per RFC 7231.  It also integrates with MongoDB Atlas for persistent data storage.
```
