// server.js
const express = require("express");
const path = require("path");
const fs = require("fs");
const { Document, Packer, Paragraph, HeadingLevel } = require("docx");

const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
app.use(express.json());
//const PORT = 3000;

// 1. Serve everything in the "public" folder (HTML, CSS, JS, audio)
app.use(express.static(path.join(__dirname, "public")));

// ===== Notes folder setup =====
const NOTES_DIR = path.join(__dirname, "notes");

// Create the folder if it doesn't exist
if (!fs.existsSync(NOTES_DIR)) {
  fs.mkdirSync(NOTES_DIR);
}

// Serve generated notes as static files
app.use("/notes", express.static(NOTES_DIR));

// 2. For any route, send back index.html (single-page app style)
//app.get("*", (req, res) => {
  //res.sendFile(path.join(__dirname, "public", "index.html"));
//});

// ===== Export session notes as Word doc =====
app.post("/api/session-notes/export", async (req, res) => {
  try {
    const { caseId, notes } = req.body;

    if (!Array.isArray(notes) || notes.length === 0) {
      return res.status(400).json({ error: "No notes provided" });
    }

    // Make sure caseId is safe to use in a filename
    const safeCaseId = (caseId || "lawdio-case")
      .toString()
      .replace(/[^a-zA-Z0-9-_]/g, "-");

    const children = [];

    // Optional title
    children.push(
      new Paragraph({
        text: `Lawdio Notes – ${safeCaseId}`,
        heading: HeadingLevel.HEADING_1,
      })
    );

    // Add a blank line
    children.push(new Paragraph({ text: "" }));

    // Each note as its own line
    notes.forEach((note, index) => {
      children.push(
        new Paragraph({
          text: `${index + 1}. ${note}`,
        })
      );
    });

    const doc = new Document({
      sections: [
        {
          properties: {},
          children,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    // One doc file per export
    const timestamp = Date.now();
    const filename = `lawdio-notes-${safeCaseId}-${timestamp}.docx`;
    const filePath = path.join(NOTES_DIR, filename);

    fs.writeFileSync(filePath, buffer);

    const downloadUrl = `/notes/${filename}`;
    res.json({ downloadUrl });
  } catch (err) {
    console.error("Error generating session notes doc:", err);
    res.status(500).json({ error: "Server error generating document" });
  }
});

// ===== Export session notes as Word doc =====
app.post("/api/session-notes/export", async (req, res) => {
  // existing code
});


// ===== Your OpenAI route MUST be here — BEFORE app.listen =====
app.post("/api/ask", async (req, res) => {
  try {
    const { question } = req.body || {};

    if (!question) {
      return res.status(400).json({ error: "No question provided" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful tutor for law students." },
        { role: "user", content: question }
      ]
    });

    const answerText =
      completion.choices[0]?.message?.content ||
      "Sorry, I couldn't generate an answer.";

    res.json({ answerText });
  } catch (err) {
    console.error("Error in /api/ask:", err);
    res.status(500).json({ error: "Server error calling OpenAI" });
  }
});

// ===== Your OpenAI route MUST be here — BEFORE app.listen =====
app.post("/api/ask", async (req, res) => {
  try {
    const { question } = req.body || {};

    if (!question) {
      return res.status(400).json({ error: "No question provided" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful tutor for law students." },
        { role: "user", content: question }
      ]
    });

    const answerText =
      completion.choices[0]?.message?.content ||
      "Sorry, I couldn't generate an answer.";

    res.json({ answerText });
  } catch (err) {
    console.error("Error in /api/ask:", err);
    res.status(500).json({ error: "Server error calling OpenAI" });
  }
});

// 3. Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


