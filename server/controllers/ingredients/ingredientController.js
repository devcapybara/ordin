const Ingredient = require('../../models/Ingredient');

// Get all ingredients for the restaurant
const getIngredients = async (req, res) => {
  try {
    const ingredients = await Ingredient.find({ restaurantId: req.user.restaurantId });
    res.json(ingredients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new ingredient
const createIngredient = async (req, res) => {
  try {
    const { name, unit, currentStock, minStock, costPerUnit } = req.body;
    
    const ingredient = await Ingredient.create({
      restaurantId: req.user.restaurantId,
      name,
      unit,
      currentStock,
      minStock,
      costPerUnit
    });
    
    res.status(201).json(ingredient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update an ingredient
const updateIngredient = async (req, res) => {
  try {
    const { id } = req.params;
    const ingredient = await Ingredient.findOneAndUpdate(
      { _id: id, restaurantId: req.user.restaurantId },
      req.body,
      { new: true }
    );

    if (!ingredient) {
      return res.status(404).json({ message: 'Ingredient not found' });
    }

    res.json(ingredient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete an ingredient
const deleteIngredient = async (req, res) => {
  try {
    const { id } = req.params;
    const ingredient = await Ingredient.findOneAndDelete({ 
      _id: id, 
      restaurantId: req.user.restaurantId 
    });

    if (!ingredient) {
      return res.status(404).json({ message: 'Ingredient not found' });
    }

    res.json({ message: 'Ingredient deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Stock Adjustment (Add/Subtract)
const adjustStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { adjustment } = req.body; // positive to add, negative to subtract
        
        const ingredient = await Ingredient.findOne({ _id: id, restaurantId: req.user.restaurantId });
        if (!ingredient) return res.status(404).json({ message: 'Ingredient not found' });

        ingredient.currentStock += Number(adjustment);
        await ingredient.save();

        res.json(ingredient);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

module.exports = {
  getIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  adjustStock
};
