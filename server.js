const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

const RECIPE_JSON_URL = "https://www.digitalfarmsystem.com/recipes.json";

let cache = {
  timestamp: 0,
  data: {}
};

async function fetchRecipes() {
  try {
    const response = await fetch(RECIPE_JSON_URL);
    const json = await response.json();
    cache = {
      timestamp: Date.now(),
      data: json
    };
  } catch (err) {
    console.error("Failed to fetch recipes.json", err);
  }
}

app.use(cors());

app.get("/", (req, res) => {
  res.send(`
    <h1>DFS Recipe API</h1>
    <p>Usage:</p>
    <ul>
      <li><code>/search?name=strawberry</code> – returns recipe names only, paginated</li>
      <li><code>/recipe?name=DFS%20Strawberry%20Tartlets</code> – full detail lookup</li>
    </ul>
  `);
});

app.get("/search", async (req, res) => {
  const nameQuery = (req.query.name || "").toLowerCase();
  const page = parseInt(req.query.page) || 1;
  const perPage = 9;

  if (!cache.data || Object.keys(cache.data).length === 0) {
    await fetchRecipes();
  }

  const recipes = Object.values(cache.data);
  const matched = recipes.filter(r => r.item_output && r.item_output.toLowerCase().includes(nameQuery));
  const total = matched.length;
  const pages = Math.ceil(total / perPage);
  const results = matched
    .slice((page - 1) * perPage, page * perPage)
    .map(r => r.item_output);

  res.json({
    total,
    page,
    pages,
    results
  });
});

app.get("/recipe", async (req, res) => {
  const name = req.query.name;

  if (!name) {
    return res.status(400).json({ error: "Missing 'name' query parameter." });
  }

  if (!cache.data || Object.keys(cache.data).length === 0) {
    await fetchRecipes();
  }

  const recipes = Object.values(cache.data);
  const match = recipes.find(r => r.item_output === name);

  if (!match) {
    return res.status(404).json({ error: "Recipe not found." });
  }

  res.json(match);
});

app.listen(PORT, () => {
  console.log(`DFS API server running on port ${PORT}`);
  fetchRecipes(); // Initial fetch
});
