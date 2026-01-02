const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    // Paksa pakai URI Atlas dari .env
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI missing in .env");
    
    await mongoose.connect(uri);
    console.log(`Connected to MongoDB Atlas`);
    
    // Define schema sederhana
    const ProductSchema = new mongoose.Schema({}, { strict: false });
    const Product = mongoose.model('Product', ProductSchema);
    
    const products = await Product.find({}, 'name imageUrl').limit(5);
    
    console.log("\n--- PRODUCT IMAGE URLS ---");
    products.forEach(p => {
        console.log(`[${p.name}]: ${p.imageUrl}`);
    });
    console.log("--------------------------\n");

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

connectDB();
