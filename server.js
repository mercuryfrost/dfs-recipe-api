const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Routes
const nameRoute = require("./routes/name");
app.use("/name", nameRoute);

// Homepage
app.get("/", (req, res) => {
  res.send(`
    <h1>DFS Recipe API</h1>
    <p>Use <code>/name?name=yourquery</code> to search.</p>
    <ul>
      <li><code>?name=strawberry</code> - search for recipes</li>
      <li><code>&human=1</code> - returns HTML with ingredient list and image</li>
      <li><code>&page=2</code> - paginated HTML</li>
    </ul>
  `);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
