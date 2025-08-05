const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { createSubcategory } = require('../controller/subcategory/create');
const { getSubcategory } = require('../controller/subcategory/fetch');
const { updateSubcategory } = require('../controller/subcategory/update');
const { deleteSubcategory } = require('../controller/subcategory/delete');

router.post('/create', authMiddleware, createSubcategory);
router.get('/get', getSubcategory);
router.put('/update/:id', authMiddleware, updateSubcategory);
router.delete('/delete/:id', authMiddleware, deleteSubcategory);

module.exports = router;
