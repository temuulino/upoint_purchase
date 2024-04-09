require("dotenv").config();

const express = require("express");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User, Item } = require("../models/models");

const router = express.Router();

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Шинээр хэрэглэгч үүсгэх
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: bold
 *               password:
 *                 type: string
 *                 example: password
 *     responses:
 *       201:
 *         description: Хэрэглэгч амжилттай үүслээ
 *       400:
 *         description: Username already exists
 *       500:
 *         description: Дотоод асуудал
 */

// Бүртгүүлэх
// router.post("/signup", async (req, res) => {
//   try {
//     const { username, password } = req.body;
//     const existingUser = await User.findOne({ username });

//     if (existingUser) {
//       return res.status(400).json({ message: "Username already exists" });
//     }

//     const hashedPassword = await bcryptjs.hash(password, 10);
//     const newUser = new User({ username, password: hashedPassword });
//     await newUser.save();

//     res.status(201).json({ message: "User created successfully" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });
router.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body;
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const defaultBalance = 1500;

    const newUser = new User({
      username,
      password,
      card: {
        balance: defaultBalance,
      },
    });

    await newUser.save();

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in an existing user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: user1
 *               password:
 *                 type: string
 *                 example: pass1234
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNDI2MjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
 *       401:
 *         description: Invalid username or password
 *       500:
 *         description: Internal server error
 */

// Нэвтрэх
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const passwordMatch = await bcryptjs.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get the current user's information
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns the current user's information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized, token missing or invalid
 *       403:
 *         description: Forbidden, token no longer valid
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password"); //пасс харагдуулахгүй байх
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @swagger
 * /auth/items:
 *   get:
 *     summary: Get a list of all items
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: Example Item Name
 *                   price:
 *                     type: number
 *                     format: float
 *                     example: 99.99
 *                   quantity:
 *                     type: number
 *                     example: 100
 *       500:
 *         description: Internal server error
 */

router.get("/items", authenticateToken, async (req, res) => {
  try {
    const items = await Item.find({});
    console.log(items);
    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @swagger
 * /auth/purchase:
 *   post:
 *     summary: Purchase an item
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               itemId:
 *                 type: string
 *                 description: The ID of the item to purchase
 *                 example: 615d1400babc841a35c9c3ab
 *     responses:
 *       200:
 *         description: Purchase successful, returns purchase details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Purchase successful
 *                 itemPurchased:
 *                   type: string
 *                   example: Example Item Name
 *                 cashbackReceived:
 *                   type: number
 *                   format: float
 *                   example: 2.25
 *                 newBalance:
 *                   type: number
 *                   format: float
 *                   example: 97.75
 *       400:
 *         description: Bad request, such as item not found or out of stock, or insufficient balance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Insufficient balance
 *       401:
 *         description: Unauthorized, token missing or invalid
 *       404:
 *         description: Item not found
 *       500:
 *         description: Internal server error
 */

router.post("/purchase", authenticateToken, async (req, res) => {
  const { itemId } = req.body;

  try {
    const user = await User.findById(req.user.userId);
    const item = await Item.findById(itemId);

    if (!item) {
      return res.status(404).json({ message: "Бараа олдсонгүй" });
    }

    if (item.quantity < 1) {
      return res.status(400).json({ message: "Бараа дууссан байна" });
    }

    if (user.card.balance < item.price) {
      return res.status(400).json({ message: "Үлдэгдэл хүрэлцэхгүй байна." });
    }

    const cashback = item.price * 0.03; // 3% cashback
    user.card.balance -= item.price;
    user.card.balance += cashback;

    item.quantity -= 1;

    await user.save();
    await item.save();

    res.json({
      message: "Худалдан авалт амжилттай",
      itemPurchased: item.name,
      cashbackReceived: cashback,
      newBalance: user.card.balance,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
