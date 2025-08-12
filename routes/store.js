const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { createStore } = require('../controller/store/create');
const { getStore } = require('../controller/store/fetch');
const { updateStore } = require('../controller/store/update');
const { deleteStore } = require('../controller/store/delete');
const upload = require('../middleware/upload');

router.post('/create', upload.single('logo'), createStore);
router.get('/get', getStore);
router.put('/update/:id', updateStore);
router.delete('/delete/:id', deleteStore);

module.exports = router;
