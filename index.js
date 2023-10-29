const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const dotenv = require("dotenv").config();
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const sendMail = require("./sendMail");
const nodemailer = require("nodemailer");
const cron = require("node-cron");
app.use(cors());
app.use(express.json());

const uri = process.env.URI;

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
        verified: false,
        createdAt: Date.now(),
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
      console.log(token);
      // Check if the token exists in your database
      const user = await usersCollection.findOne({ token: token });

      if (!user) {
        return res.json({ message: "Invalid verification token" });
      }

      // Step 5: Update User Status
      const result = await usersCollection.updateOne(
        { _id: user._id },
        { $set: { verified: true } }
      );

      res.json({
        message: "Email verified successfully",
        data: result,
        user: user,
      });
    });

    // Schedule a task to run every day at 2:00 AM

    /* 
    Details about threshold
    The thresholdTime is used to determine a cutoff point for deleting unverified users. It represents a time threshold before which users need to verify their email addresses.

In this example, it's set to 24 hours (1 day) before the current time. This means that any user who has not verified their email within the last 24 hours will be deleted.

The benefit of using a threshold time like this is to ensure that you don't accidentally delete users who may have just signed up and haven't had a chance to verify their email yet. It provides a grace period for users to complete the email verification process before their accounts are removed.

You can adjust the threshold time based on your specific use case and how long you think it's reasonable to give users to verify their email addresses after signing up.
    
    */

    // cron.schedule("0 2 * * *", async () => {
    //   const thresholdTime = new Date();
    //   thresholdTime.setDate(thresholdTime.getDate() - 1);

    //   const result = await usersCollection.deleteMany({
    //     verified: false,
    //     createdAt: { $lt: thresholdTime },
    //   });

    //   console.log(`${result.deletedCount} unverified users deleted`);
    // });
    //This code works for at 2 am and every unverified user delete at 2 am
    /*  cron.schedule("0 2 * * * *", async () => {
      console.log("delete");
      const result = await usersCollection.deleteMany({
        verified: false,
      });
    }); */
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
