const Book = require('../models/Book');

async function getAllBooks(req, res) {
    try {
        const data = await Book.find({});
        res.status(201).json(data);
    } catch (err) {
        console.error('Error fetching books:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

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

module.exports = {
    getAllBooks,
    getAllBooksById,
    addBook,
    updateBookById,
    deleteBookById
};