const Order = require('../../models/Order');
const Expense = require('../../models/Expense');

const getFinanceReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!req.user.restaurantId) {
        return res.status(403).json({ message: 'Not authorized' });
    }

    // Default to current month if not provided
    const now = new Date();
    const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    
    // If endDate is provided, set it to end of that day (23:59:59.999)
    // If not, use current time
    let end;
    if (endDate) {
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
    } else {
        end = now;
    }

    // 1. Calculate Revenue (Total Paid Orders)
    const revenueAggregation = await Order.aggregate([
        { 
            $match: { 
                restaurantId: req.user.restaurantId,
                status: 'PAID',
                createdAt: { $gte: start, $lte: end }
            } 
        },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: '$totalAmount' }
            }
        }
    ]);

    const totalRevenue = revenueAggregation.length > 0 ? revenueAggregation[0].totalRevenue : 0;

    // 2. Calculate Expenses
    const expenseAggregation = await Expense.aggregate([
        {
            $match: {
                restaurantId: req.user.restaurantId,
                date: { $gte: start, $lte: end }
            }
        },
        {
            $group: {
                _id: null,
                totalExpenses: { $sum: '$amount' }
            }
        }
    ]);

    const totalExpenses = expenseAggregation.length > 0 ? expenseAggregation[0].totalExpenses : 0;

    // 3. Net Profit
    const netProfit = totalRevenue - totalExpenses;

    res.json({
        period: { start, end },
        totalRevenue,
        totalExpenses,
        netProfit
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error generating report' });
  }
};

module.exports = getFinanceReport;