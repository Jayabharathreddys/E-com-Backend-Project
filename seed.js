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
        productImages: ["https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg"],
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
        productImages: ["https://fakestoreapi.com/img/71-3HjGNDUL._AC_SY879._SX._UX._SY._UY_.jpg"],
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
        productImages: ["https://fakestoreapi.com/img/71li-ujtlUL._AC_UX679_.jpg"],
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
        productImages: ["https://fakestoreapi.com/img/71YXzeOuslL._AC_UY879_.jpg"],
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
        productImages: ["https://fakestoreapi.com/img/71pWzhdJNwL._AC_UL640_FMwebp_QL65_.jpg"],
        description: "From our Legends Collection, the Naga was inspired by the mythical water dragon.",
        stock_quantity: "20",
        discount: 50,
        averageRating: 4.6
    },
    {
        name: "Pierced Owl Rose Gold Plated",
        brand: "Pierced Owl",
        price: "10",
        categories: ["jewelery"],
        productImages: ["https://fakestoreapi.com/img/51UDEzMJVpL._AC_UL640_FMwebp_QL65_.jpg"],
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
        productImages: ["https://fakestoreapi.com/img/71YAIFU48IL._AC_UL640_FMwebp_QL65_.jpg"],
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
        productImages: ["https://fakestoreapi.com/img/https://fakestoreapi.com/img/61IBBVJvSDL._AC_SY879_.jpg"],
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
        productImages: ["https://fakestoreapi.com/img/61U7T1koQqL._AC_SX679_.jpg"],
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
        productImages: ["https://fakestoreapi.com/img/61mtL65D4cL._AC_SX679_.jpg"],
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
        productImages: ["https://fakestoreapi.com/img/81QpkIctqPL._AC_SX679_.jpg"],
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
        productImages: ["https://fakestoreapi.com/img/51Y5NI-I5jL._AC_UX679_.jpg"],
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
        productImages: ["https://fakestoreapi.com/img/81XH0e8fefL._AC_UY879_.jpg"],
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
        productImages: ["https://fakestoreapi.com/img/71z3kpMAYsL._AC_UY879_.jpg"],
        description: "95% RAYON 5% SPANDEX. Made in USA or Imported. Machine Wash. Short sleeve.",
        stock_quantity: "120",
        discount: 1,
        averageRating: 4.5
    },
    {
        name: "Opna Womens Short Sleeve Moisture",
        brand: "Opna",
        price: "7",
        categories: ["women's clothing"],
        productImages: ["https://fakestoreapi.com/img/51eg55uWmdL._AC_UX679_.jpg"],
        description: "100% Polyester. Moisture-wicking active wear. Womens sizes XS-XL.",
        stock_quantity: "150",
        discount: 1,
        averageRating: 4.5
    },
    {
        name: "DANVOUY Womens T Shirt Casual",
        brand: "DANVOUY",
        price: "12",
        categories: ["women's clothing"],
        productImages: ["https://fakestoreapi.com/img/61pHAEJ4NML._AC_UX679_.jpg"],
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
