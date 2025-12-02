const express = require('express');
const { register } = require('../controllers/registerController');
const { login } = require('../controllers/loginController');

const router = express.Router();

router.post('/api/register', register);
router.post('/api/login', login);

module.exports = router;
