const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { createCategory } = require('../controller/category/create');
const { getCategory } = require('../controller/category/fetch');
const { updateCategory } = require('../controller/category/update');
const { deleteCategory } = require('../controller/category/delete');

router.post('/create', authMiddleware, createCategory);
router.get('/get', getCategory);
router.put('/update/:id', authMiddleware, updateCategory);
router.delete('/delete/:id', authMiddleware, deleteCategory);

module.exports = router;
