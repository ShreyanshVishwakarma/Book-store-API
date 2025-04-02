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
