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

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
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

const run = async () => {
  try {
    const db = client.db("cpanel");

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
