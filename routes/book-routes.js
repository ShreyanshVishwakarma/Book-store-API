const express = require('express')

const {
    getAllBooks,
    getAllBooksById,
    addBook,
    deleteBookById,
    updateBookById
} = require('../controllers/book-controller') 
// creating express router

const router = express.Router();

router.get('/get', getAllBooks)
router.get('/get/:id', getAllBooksById)
router.post('/post', addBook)
router.put('/update/:id', updateBookById)
router.delete('/delete/:id',deleteBookById)


module.exports = router;