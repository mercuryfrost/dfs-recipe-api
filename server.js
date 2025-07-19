const express = require("express");
const cors = require("cors");
const recipeRoutes = require("./routes/name");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Use recipe routes
app.use("/", recipeRoutes);

// Root help page
app.get("/", (req, res) => {
  res.send(`
    <h1>DFS Recipe API</h1>
    <p>Use <code>/name?name=yourquery</code> to search by item name.</p>
    <ul>
      <li><code>/name?name=strawberry</code> - search for recipes</li>
      <li><code>&human=1</code> - returns HTML with ingredients and image</li>
      <li><code>&page=2</code> - optional pagination for HTML view</li>
    </ul>
  `);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
