const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();

//middleware
app.use(cors());
app.use(express.json());

const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${dbUser}:${dbPassword}@cluster0.9mathic.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    client.connect();
    const toysCollection = client.db("toy-figures").collection("toys");
    const reviewsCollection = client.db("toy-figures").collection("reviews");

    //get a single data
    app.get("/figures/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toysCollection.findOne(query);
      res.send(result);
    });

    //find all toys
    app.get("/figures", async (req, res) => {
      let query = {};
      if (req.query?.category) {
        query = {
          subcategory: { $regex: new RegExp(req.query.category, "i") },
        };
      } else if (req.query?.name) {
        query = {
          name: { $regex: new RegExp(req.query.name, "i") },
        };
      }
      const result = await toysCollection.find(query).limit(20).toArray();
      res.send(result);
    });

    //sort by name
    app.get("/myToys", async (req, res) => {
      let query = {};
      let filter = {};
      console.log(req.query.email, req.query.sort)
      if (req.query?.email) {
        query = { email: { $regex: new RegExp(req.query.email, "i") } };
      }
      if (req.query?.sort == "ascending") {
        filter = { price: 1 };
      } else if (req.query?.sort == "descending") {
        filter = { price: -1 };
      }
      const result = await toysCollection.find(query).sort(filter).toArray();
      res.send(result);
    });

    //all reviews
    app.get("/reviews", async (req, res) => {
      let query = {};
      const result = await reviewsCollection.find().toArray();
      res.send(result);
    });

    //post a toy
    app.post("/figures", async (req, res) => {
      const toyData = req.body;
      const result = await toysCollection.insertOne(toyData);
      res.send(result);
    });

    //delete a single data
    app.delete("/figures/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toysCollection.deleteOne(query);
      res.send(result);
    });

    //update a toy
    app.put("/update/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const update = req.body;
      const updatedToy = {
        $set: {
          price: update.price,
          quantity: update.quantity,
          description: update.description,
        },
      };
      const options = { upsert: true };
      const result = await toysCollection.updateOne(query, updatedToy, options);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("The Web is running");
});

app.listen(port, () => {
  console.log(`listening port: 5000`);
});
