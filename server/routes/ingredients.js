const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const checkRole = require('../middlewares/checkRole');
const {
  getIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  adjustStock
} = require('../controllers/ingredients/ingredientController');

router.use(protect);

router.get('/', getIngredients);
router.post('/', checkRole(['OWNER', 'MANAGER']), createIngredient);
router.put('/:id', checkRole(['OWNER', 'MANAGER']), updateIngredient);
router.delete('/:id', checkRole(['OWNER', 'MANAGER']), deleteIngredient);
router.put('/:id/stock', checkRole(['OWNER', 'MANAGER', 'CHEF']), adjustStock); // Chefs can adjust stock too

module.exports = router;
