require('dotenv').config();
const express = require("express");
const connectDB = require('./database/db');
const routerAuth = require('./routes/user-auth-router');
const routerApi = require('./routes/book-routes');
const routerhome = require('./routes/home-routes');
const routeradmin = require('./routes/admin-routes');

const app = express();
const port = process.env.PORT || 3000;

connectDB();

app.use(express.json());

// Routes
app.use('/auth', routerAuth);
app.use('/api/books', routerApi);

app.use('/', routerhome);
app.use('/', routeradmin);
// Simple error handler (optional)
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ message: 'Internal server error' });
});

app.listen(3000, () => {
    console.log(`✅ Server is running on http://localhost:${port}`);
});
