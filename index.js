const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const dotenv = require("dotenv").config();
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const sendMail = require("./sendMail");
const nodemailer = require("nodemailer");

app.use(cors());
app.use(express.json());

const uri = process.env.URI;
console.log(uri);
const client = new MongoClient(uri, {
  serverApi: ServerApiVersion.v1,
});
const transporter = nodemailer.createTransport({
  host: "mail.infinityalgostation.com",
  port: 465,
  secure: true,
  auth: {
    user: `${process.env.USER}`,
    pass: `${process.env.PASSWORD}`,
  },
});

const generateVerificationToken = () => {
  return Math.random().toString(36).substring(2, 15);
};

const run = async () => {
  try {
    const db = client.db("cpanel");
    const usersCollection = db.collection("users");

    app.get("/sendMail", async (req, res) => {
      const info = await transporter.sendMail({
        from: `${process.env.USER}`, // sender address
        to: "mdsabbigdfsgfgsr1as054@gmail.com", // list of receivers
        subject: "Hello ✔", // Subject line
        text: "Hello world?", // plain text body
        html: "<b>Hello world?</b>", // html body
      });

      console.log("Message sent: %s", info.messageId);
      console.log(info);

      res.json(info);
    });

    app.post("/sendVerificationEmail", async (req, res) => {
      const { email } = req.body;
      const token = generateVerificationToken();

      // Save the token with the user's email in your database
      const result = await usersCollection.insertOne({
        email: email,
        token: token,
      });
      // res.json(result);
      const info = await transporter.sendMail({
        from: process.env.USER,
        to: email,
        subject: "Verify Your Email",
        html: `<a href="${process.env.BASE_URL}/verifyEmail/${token}">Click here to verify your email</a>`,
      });

      res.json({ message: "Verification email sent!", token: token });
    });

    app.get("/verifyEmail/:token", async (req, res) => {
      const { token } = req.params;

      // Check if the token exists in your database
      const user =usersCollection.findOne({ verificationToken: token });

      if (!user) {
        return res.json({ message: "Invalid verification token" });
      }

      // Step 5: Update User Status
      await usersCollection.updateOne({ _id: user._id }, { $set: { verified: true } });

      res.json({ message: "Email verified successfully" });
    });
  } finally {
  }
};

run().catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
