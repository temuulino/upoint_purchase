const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  card: {
    cardNumber: { type: String, required: true, unique: true },
    balance: { type: Number, required: true },
  },
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

// Хэрэглэгчийн картын дугаарийг 16 оронтой санамсаргүй тоо байлгах
userSchema.pre("save", function (next) {
  if (!this.isModified("card.cardNumber")) return next();

  this.card.cardNumber = generateCardNumber();
  next();
});

function generateCardNumber() {
  let cardNumber = "";
  for (let i = 0; i < 16; i++) {
    cardNumber += Math.floor(Math.random() * 10);
  }
  return cardNumber;
}

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
});

const User = mongoose.model("User", userSchema);
const Item = mongoose.model("Item", itemSchema);

module.exports = { User, Item };
