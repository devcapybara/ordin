const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Expense = require('./models/Expense');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

const seedExpenses = async () => {
    try {
        const email = 'owner@ordin.com';
        const user = await User.findOne({ email });

        if (!user) {
            console.log('User not found:', email);
            process.exit(1);
        }

        console.log(`Seeding expenses for ${user.username} (${user.restaurantId})...`);

        const categories = ['INGREDIENTS', 'UTILITIES', 'SALARIES', 'RENT', 'MAINTENANCE', 'OTHER'];
        const descriptions = [
            'Beli Sayuran', 'Bayar Listrik', 'Gaji Karyawan', 'Sewa Ruko', 'Service AC', 
            'Beli Beras', 'Beli Daging', 'Gas Elpiji', 'Internet Wifi', 'Plastik Kemasan',
            'Beli Minyak Goreng', 'Beli Telur', 'Sabun Cuci Piring', 'Tissue', 'Aqua Galon'
        ];

        const expenses = [];
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        for (let i = 0; i < 60; i++) {
            // Random date within current month (1 - 28)
            const randomDay = Math.floor(Math.random() * 28) + 1;
            const date = new Date(currentYear, currentMonth, randomDay);
            
            // Random hour/minute
            date.setHours(Math.floor(Math.random() * 24));
            date.setMinutes(Math.floor(Math.random() * 60));

            expenses.push({
                restaurantId: user.restaurantId,
                description: descriptions[Math.floor(Math.random() * descriptions.length)] + ` #${i+1}`,
                amount: (Math.floor(Math.random() * 50) + 5) * 10000, // 50k - 550k
                category: categories[Math.floor(Math.random() * categories.length)],
                date: date,
                recordedBy: user._id
            });
        }

        await Expense.insertMany(expenses);
        console.log(`Successfully seeded ${expenses.length} expenses!`);
        process.exit();
    } catch (error) {
        console.error('Error seeding:', error);
        process.exit(1);
    }
};

seedExpenses();