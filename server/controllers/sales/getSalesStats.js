const Restaurant = require('../../models/Restaurant');
const GlobalConfig = require('../../models/GlobalConfig');

const getSalesStats = async (req, res) => {
    try {
        const salesId = req.user._id;

        // Fetch tenants created by this sales agent
        const tenants = await Restaurant.find({ createdBy: salesId })
            .select('name ownerEmail phone subscription createdAt');

        // Fetch commission rates
        const commissionConfig = await GlobalConfig.findOne({ key: 'SALES_COMMISSION_RATES' });
        // Default rates if not set
        const rates = commissionConfig ? commissionConfig.value : { BASIC: 19000, PRO: 29000, ENTERPRISE: 49000 };

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Calculate stats
        let totalEarnings = 0;
        const tenantData = tenants.map(t => {
            const plan = t.subscription.plan;
            let commission = rates[plan] || 0;
            
            // Apply multiplier for YEARLY billing
            if (t.subscription.billingCycle === 'YEARLY') {
                commission *= 10;
            }
            
            // Commission is earned for active tenants registered in CURRENT MONTH
            const isThisMonth = new Date(t.createdAt) >= startOfMonth;
            
            if (t.subscription.status === 'active' && isThisMonth) {
                totalEarnings += commission;
            }

            return {
                _id: t._id,
                name: t.name,
                ownerEmail: t.ownerEmail,
                plan: t.subscription.plan,
                status: t.subscription.status,
                joinedAt: t.createdAt,
                potentialCommission: commission // Show potential per tenant
            };
        });

        res.json({
            tenants: tenantData,
            rates,
            totalEarnings,
            totalTenants: tenants.length
        });

    } catch (error) {
        console.error('Get Sales Stats Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = getSalesStats;