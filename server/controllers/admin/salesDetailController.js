const User = require('../../models/User');
const Restaurant = require('../../models/Restaurant');
const CommissionPayout = require('../../models/CommissionPayout');
const GlobalConfig = require('../../models/GlobalConfig');

const getSalesDetail = async (req, res) => {
    try {
        const salesId = req.params.id;
        const sales = await User.findById(salesId).select('-password');
        if (!sales) return res.status(404).json({ message: 'Sales not found' });

        // Get Commission Rates
        const commissionConfig = await GlobalConfig.findOne({ key: 'SALES_COMMISSION_RATES' });
        const rates = commissionConfig ? commissionConfig.value : { BASIC: 19000, PRO: 29000, ENTERPRISE: 49000 };

        // Get Tenants created by this sales
        const tenants = await Restaurant.find({ createdBy: salesId });

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // Tenants registered this month
        const currentMonthTenants = tenants.filter(t => new Date(t.createdAt) >= startOfMonth);
        
        let currentMonthEstimate = 0;
        currentMonthTenants.forEach(t => {
            if (t.subscription.status === 'active') {
                let commission = rates[t.subscription.plan] || 0;
                if (t.subscription.billingCycle === 'YEARLY') {
                    commission *= 10;
                }
                currentMonthEstimate += commission;
            }
        });

        // Payout History
        const payouts = await CommissionPayout.find({ salesId }).sort({ createdAt: -1 });

        res.json({
            sales,
            stats: {
                totalTenants: tenants.length,
                activeTenants: tenants.filter(t => t.subscription.status === 'active').length,
                currentMonthEstimate,
                currentMonthTenantsCount: currentMonthTenants.length
            },
            payouts
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const createPayout = async (req, res) => {
    try {
        const salesId = req.params.id;
        const { amount, proofUrl, periodMonth, periodYear } = req.body;

        const payout = await CommissionPayout.create({
            salesId,
            amount,
            proofUrl,
            periodMonth: periodMonth || new Date().getMonth() + 1, 
            periodYear: periodYear || new Date().getFullYear(),
            status: 'PAID'
        });

        res.status(201).json(payout);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getSalesDetail, createPayout };