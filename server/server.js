
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log("Request received:", req.method, req.url);
    next();
});


const client = new MongoClient(process.env.MONGODB_URI);

let notesCollection;

async function startServer() {
  try {
    await client.connect();

    const database = client.db("googleKeep");
    notesCollection = database.collection("notes");

    console.log("Connected to MongoDB Atlas!");

    app.get("/api/notes", async (req, res) => {
      try {
        const notes = await notesCollection.find({}).toArray();
        res.json(notes);
      } catch (error) {
        res.status(500).json({ error: "Could not load notes" });
      }
    });

    app.post("/api/notes", async (req, res) => {
      try {
        const note = req.body;

        if (!note || typeof note !== "object" || Array.isArray(note)) {
          return res.status(400).json({ error: "Invalid note data" });
        }

        const result = await notesCollection.insertOne({
          ...note,
          createdAt: new Date()
        });

        res.status(201).json({
          message: "Note saved successfully",
          insertedId: result.insertedId
        });
      } catch (error) {
        res.status(500).json({ error: "Could not save note" });
      }
    });


    
    // Update an existing note
    app.put("/api/notes/:id", async (req, res) => {
      try {
        const { title, text } = req.body;

        const result = await notesCollection.updateOne(
          { id: req.params.id },
          { $set: { title, text } }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ error: "Note not found" });
        }

        res.json({ message: "Note updated successfully" });
      } catch (error) {
        res.status(500).json({ error: "Could not update note" });
      }
    });

    // Delete an existing note
  
app.delete("/api/notes/:id", async (req, res) => {
    try {
        const noteId = req.params.id;

        console.log("Deleting note ID:", noteId);

        // First, search using the app's note ID
        let result = await notesCollection.deleteOne({
            id: noteId
        });

        // If not found, check MongoDB's _id
        if (result.deletedCount === 0) {
            const { ObjectId } = require("mongodb");

            if (ObjectId.isValid(noteId)) {
                result = await notesCollection.deleteOne({
                    _id: new ObjectId(noteId)
                });
            }
        }

        console.log("Deleted count:", result.deletedCount);

        if (result.deletedCount === 0) {
            return res.status(404).json({
                error: "Note not found in MongoDB"
            });
        }

        res.json({ message: "Note deleted successfully" });

    } catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({
            error: "Could not delete note"
        });
    }
});



    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Could not connect to MongoDB Atlas:", error.message);
    process.exit(1);
  }
}

startServer();
