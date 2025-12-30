const Shift = require('../../models/Shift');

const startShift = async (req, res) => {
  try {
    const { startCash } = req.body;

    // Check if user already has an open shift
    const existingShift = await Shift.findOne({
      userId: req.user._id,
      status: 'OPEN'
    });

    if (existingShift) {
      return res.status(400).json({ message: 'You already have an active shift.', shift: existingShift });
    }

    const shift = await Shift.create({
      restaurantId: req.user.restaurantId,
      userId: req.user._id,
      startCash: startCash || 0,
      startTime: new Date(),
      status: 'OPEN'
    });

    res.status(201).json(shift);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = startShift;
