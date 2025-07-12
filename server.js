const express = require("express");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

const RECIPES_URL = "https://www.digitalfarmsystem.com/recipes.json";

let cachedData = null;
let lastFetched = 0;
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

async function loadRecipes() {
  const now = Date.now();
  if (!cachedData || now - lastFetched > CACHE_TTL_MS) {
    const res = await fetch(RECIPES_URL);
    if (!res.ok) throw new Error("Failed to fetch recipes.json");
    cachedData = await res.json();
    lastFetched = now;
  }
  return cachedData;
}

app.get("/recipe", async (req, res) => {
  const name = req.query.name;
  if (!name) {
    return res.status(400).json({ error: "Missing 'name' query parameter" });
  }

  try {
    const data = await loadRecipes();
    const lower = name.toLowerCase();

    const results = Object.values(data)
      .filter(item =>
        item.item_output &&
        item.item_output.toLowerCase().includes(lower)
      )
      .map(item => ({
        id: item.id,
        item_output: item.item_output,
        ingredient1: item.ingredient1,
        ingredient2: item.ingredient2,
        ingredient3: item.ingredient3
      }));

    if (results.length === 0) {
      return res.status(404).json({ message: "No recipes found" });
    }

    // ✅ Pretty JSON for browser readability, still fine for LSL
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(results, null, 2));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("DFS Recipe API is running.");
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
