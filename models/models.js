const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");
// const faker = require("@faker-js/faker");
const { faker } = require("@faker-js/faker");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  card: {
    cardNumber: { type: String, unique: true },
    balance: { type: Number, required: true },
  },
});

// Хэрэглэгчийн картын дугаарийг 16 оронтой санамсаргүй тоо байлгах
userSchema.pre("save", function (next) {
  if (!this.isModified("card.cardNumber")) return next();

  this.card.cardNumber = generateCardNumber();
  next();
});
// Хэрэглэгчийн password-ийг hash хийх.
userSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) return next();

    const hashedPassword = await bcryptjs.hash(this.password, 10);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

function generateCardNumber() {
  let cardNumber = "";
  for (let i = 0; i < 16; i++) {
    cardNumber += Math.floor(Math.random() * 10).toString();
  }
  console.log("Generated Card Number:", cardNumber); // Add logging to debug
  return cardNumber;
}

// Faker хэрэглэж хуурамч дата хийнэ.

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
});

function generateFakeItem() {
  return {
    name: faker.commerce.product(),
    price: faker.number.int({ min: 100, max: 1000 }),
    quantity: faker.number.int({ min: 1, max: 100 }),
  };
}

const fakeItems = Array.from({ length: 10 }, generateFakeItem);

fakeItems.forEach(async (fakeItemData) => {
  try {
    const newItem = new Item(fakeItemData);
    await newItem.save();
    console.log("Fake item saved:", newItem);
  } catch (error) {
    console.error("Error saving fake item:", error);
  }
});

const User = mongoose.model("User", userSchema);
const Item = mongoose.model("Item", itemSchema);

module.exports = { User, Item };
