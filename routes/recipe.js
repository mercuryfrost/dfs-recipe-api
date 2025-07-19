const express = require("express");
const fetch = require("node-fetch");
const router = express.Router();

// Simple in-memory cache
const CACHE_DURATION_MS = 1000 * 60 * 60; // 1 hour
let cache = {
  timestamp: 0,
  data: null
};

async function loadRecipes() {
  const now = Date.now();
  if (cache.data && now - cache.timestamp < CACHE_DURATION_MS) {
    return cache.data;
  }

  const url = "https://www.digitalfarmsystem.com/recipes.json";
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch recipes.json");
  const json = await response.json();

  cache = {
    timestamp: now,
    data: json
  };

  return json;
}

// GET /recipe?id=1234
router.get("/recipe", async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) {
      return res.status(400).json({ error: "Missing 'id' query parameter." });
    }

    const recipes = await loadRecipes();
    const recipe = recipes[id];
    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found." });
    }

    return res.json(recipe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

module.exports = router;
