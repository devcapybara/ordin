const GlobalConfig = require('../../models/GlobalConfig');

const getPrices = async (req, res) => {
    try {
        const config = await GlobalConfig.findOne({ key: 'SUBSCRIPTION_PRICES' });
        const prices = config ? config.value : { BASIC: 69000, PRO: 99000, ENTERPRISE: 149000 };
        res.json(prices);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

module.exports = getPrices;