const Restaurant = require('../../models/Restaurant');

const approveTenant = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        restaurant.subscription.status = 'active';
        
        // Reset validity start date to today upon approval
        const today = new Date();
        const expiry = new Date(today);
        if (restaurant.subscription.billingCycle === 'YEARLY') {
            expiry.setFullYear(expiry.getFullYear() + 1);
        } else {
            expiry.setMonth(expiry.getMonth() + 1);
        }
        restaurant.subscription.validUntil = expiry;

        await restaurant.save();

        res.json({ message: 'Tenant approved and activated', restaurant });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = approveTenant;