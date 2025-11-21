// server.js
const express = require("express");
const path = require("path");
const fs = require("fs");
const { Document, Packer, Paragraph, HeadingLevel } = require("docx");


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


// 3. Start the server
const PORT = process.env.PORT || 3000;

// Simple ask-a-question endpoint
app.post("/api/ask", (req, res) => {
  const { question } = req.body || {};

  if (!question) {
    return res.status(400).json({ error: "No question provided" });
  }

  // For now, just echo something back so the UI works
  const answer = `You asked: "${question}". (The server is running!)`;

  res.json({ answer });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

