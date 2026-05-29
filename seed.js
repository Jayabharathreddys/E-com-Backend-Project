const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const { DB_USER, DB_PASSWORD, DB_CLUSTER } = process.env;
const dbURL = `mongodb+srv://${DB_USER}:${DB_PASSWORD}@${DB_CLUSTER || "cluster0.jdq8n60.mongodb.net"}/?retryWrites=true&w=majority`;
console.log("🔗 Connecting with:", `mongodb+srv://${DB_USER}:***@${DB_CLUSTER}`);
console.log("   DB_USER:", DB_USER, "| DB_PASSWORD set:", !!DB_PASSWORD, "| DB_CLUSTER:", DB_CLUSTER);

const ProductModel = require("./src/models/ProductModel");

const products = [
    {
        name: "Fjallraven Backpack",
        brand: "Fjallraven",
        price: "109",
        categories: ["men's clothing"],
        productImages: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400"],
        description: "Your perfect pack for everyday use and walks in the forest. Fits 15 inch laptops.",
        stock_quantity: "50",
        discount: 10,
        averageRating: 3.9
    },
    {
        name: "Mens Casual Slim Fit T-Shirts",
        brand: "Generic",
        price: "22",
        categories: ["men's clothing"],
        productImages: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400"],
        description: "Slim-fitting style, contrast raglan long sleeve, three-button henley placket, light weight & soft fabric.",
        stock_quantity: "100",
        discount: 5,
        averageRating: 4.1
    },
    {
        name: "Mens Cotton Jacket",
        brand: "Spring National",
        price: "55",
        categories: ["men's clothing"],
        productImages: ["https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=400"],
        description: "Great outerwear jackets for Spring/Autumn/Winter, suitable for many occasions.",
        stock_quantity: "40",
        discount: 8,
        averageRating: 4.7
    },
    {
        name: "Mens Casual Slim Fit Chinos",
        brand: "Casual Attire",
        price: "15",
        categories: ["men's clothing"],
        productImages: ["https://images.unsplash.com/photo-1542272604-787c3835535d?w=400"],
        description: "The color could be slightly different between on the screen and in practice.",
        stock_quantity: "80",
        discount: 3,
        averageRating: 2.1
    },
    {
        name: "Jewellery Bracelet Gold",
        brand: "John Hardy",
        price: "695",
        categories: ["jewelery"],
        productImages: ["https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400"],
        description: "From our Legends Collection, the Naga was inspired by the mythical water dragon.",
        stock_quantity: "20",
        discount: 50,
        averageRating: 4.6
    },
    {
        name: "Pierced Owl Rose Gold Earrings",
        brand: "Pierced Owl",
        price: "10",
        categories: ["jewelery"],
        productImages: ["https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400"],
        description: "Rose Gold Plated Double Flared Tunnel Plug Earrings. Made of 316L Stainless Steel.",
        stock_quantity: "100",
        discount: 2,
        averageRating: 1.9
    },
    {
        name: "White Gold Diamond Ring",
        brand: "Alyssa Burton",
        price: "9999",
        categories: ["jewelery"],
        productImages: ["https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400"],
        description: "Satisfaction Guaranteed. Return or exchange any order within 30 days.",
        stock_quantity: "10",
        discount: 500,
        averageRating: 3.0
    },
    {
        name: "Samsung Galaxy S10e",
        brand: "Samsung",
        price: "699",
        categories: ["electronics"],
        productImages: ["https://images.unsplash.com/photo-1610945264803-c22b62d2a7b3?w=400"],
        description: "Samsung Galaxy S10e, 6.1 inch, 128GB, Prism Black — Factory Unlocked Android Smartphone.",
        stock_quantity: "30",
        discount: 50,
        averageRating: 4.2
    },
    {
        name: "Silicon Power 256GB SSD",
        brand: "Silicon Power",
        price: "109",
        categories: ["electronics"],
        productImages: ["https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400"],
        description: "3D NAND flash are applied to deliver outstanding performance with low power consumption.",
        stock_quantity: "60",
        discount: 10,
        averageRating: 4.8
    },
    {
        name: "WD 4TB External Hard Drive",
        brand: "Western Digital",
        price: "64",
        categories: ["electronics"],
        productImages: ["https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=400"],
        description: "USB 3.0 and USB 2.0 Compatibility. Fat32 Format. Capacity 4 Terabytes.",
        stock_quantity: "45",
        discount: 5,
        averageRating: 3.3
    },
    {
        name: "Acer SB220Q Monitor",
        brand: "Acer",
        price: "599",
        categories: ["electronics"],
        productImages: ["https://images.unsplash.com/photo-1527443224154-c4a573d9e049?w=400"],
        description: "21.5 inches Full HD (1920 x 1080) widescreen IPS display. AMD FreeSync technology.",
        stock_quantity: "25",
        discount: 30,
        averageRating: 2.9
    },
    {
        name: "BIYLACLESEN Womens 3-in-1",
        brand: "BIYLACLESEN",
        price: "56",
        categories: ["women's clothing"],
        productImages: ["https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400"],
        description: "Detachable fleece liner, adjustable 3-point chin strap, and adjustable hood.",
        stock_quantity: "70",
        discount: 6,
        averageRating: 2.6
    },
    {
        name: "Womens Rain Jacket",
        brand: "Lock and Love",
        price: "29",
        categories: ["women's clothing"],
        productImages: ["https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=400"],
        description: "100% Polyester. Machine Wash. Slim fit. Lightweight & Breathable.",
        stock_quantity: "90",
        discount: 4,
        averageRating: 3.8
    },
    {
        name: "MBJ Womens Solid Short Sleeve",
        brand: "MBJ",
        price: "9",
        categories: ["women's clothing"],
        productImages: ["https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400"],
        description: "95% RAYON 5% SPANDEX. Made in USA or Imported. Machine Wash. Short sleeve.",
        stock_quantity: "120",
        discount: 1,
        averageRating: 4.5
    },
    {
        name: "Opna Womens Short Sleeve",
        brand: "Opna",
        price: "7",
        categories: ["women's clothing"],
        productImages: ["https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400"],
        description: "100% Polyester. Moisture-wicking active wear. Womens sizes XS-XL.",
        stock_quantity: "150",
        discount: 1,
        averageRating: 4.5
    },
    {
        name: "DANVOUY Womens T Shirt",
        brand: "DANVOUY",
        price: "12",
        categories: ["women's clothing"],
        productImages: ["https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=400"],
        description: "95%Cotton,5%Spandex. Features: Casual, Short Sleeve, Letter Print.",
        stock_quantity: "200",
        discount: 2,
        averageRating: 3.6
    }
];

async function seed() {
    try {
        await mongoose.connect(dbURL);
        console.log("✅ Connected to DB");

        await ProductModel.deleteMany({});
        console.log("🗑️  Cleared existing products");

        const inserted = await ProductModel.insertMany(products);
        console.log(`✅ Seeded ${inserted.length} products successfully`);

        await mongoose.disconnect();
        console.log("🔌 Disconnected from DB");
        process.exit(0);
    } catch (err) {
        console.error("❌ Seed failed:", err.message);
        process.exit(1);
    }
}

seed();
