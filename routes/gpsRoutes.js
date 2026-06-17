//gpsRoutes.js
const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const { createGPSData, getGPSData } = require('../controllers/gpsController');


router.post('/update', createGPSData);

router.get(
 '/',
 authMiddleware,
 roleMiddleware(['admin']),
 getGPSData
);

module.exports = router;
