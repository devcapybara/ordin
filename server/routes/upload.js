const express = require('express');
const router = express.Router();
const { upload } = require('../utils/fileUpload');
const { protect } = require('../middlewares/auth');

router.post('/', protect, upload.single('image'), (req, res) => {
  if (req.file && req.file.path) {
    res.json({ imageUrl: req.file.path });
  } else {
    res.status(400).json({ message: 'No file uploaded' });
  }
});

module.exports = router;
