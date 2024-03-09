const express = require("express");
const path = require("path");
require("dotenv").config();

const request = require("./request");
const generate = require("./generate");

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.static(path.join(__dirname, "docs")));

// Middleware to set Access-Control-Allow-Origin header
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", `${process.env.FRONTEND_URL}`);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "docs", "index.html"));
});

app.post("/generateTimetable", async (req, res) => {
  const { userEmail, userPassword } = req.body;

  if (userPassword === process.env.PASSWORD) {
    try {
      const apiData = await request(userEmail);
      const text = await generate(apiData);

      res.set({
        "Content-Disposition": 'attachment; filename="result.timetable"',
        "Content-Type": "application/xml",
      });

      res.send(text);
    } catch (error) {
      console.error("Error sending timetable to client:", error);
      res.status(500).send("Error: Could not generate timetable");
    }
  } else {
    res.status(401).send("Unauthorized: Incorrect password");
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
