const express = require("express");
const app = express();
const fetch = require("node-fetch");

const PORT = process.env.PORT || 3000;
const JSON_URL = "https://www.digitalfarmsystem.com/recipes.json";

let recipes = {};
let lastFetch = 0;
const CACHE_TIME = 1000 * 60 * 10; // 10 minutes

async function fetchRecipes() {
  const now = Date.now();
  if (now - lastFetch < CACHE_TIME && Object.keys(recipes).length > 0) return;

  try {
    const res = await fetch(JSON_URL);
    const json = await res.json();
    recipes = json;
    lastFetch = now;
  } catch (err) {
    console.error("Failed to fetch recipes.json", err);
  }
}

app.get("/recipe", async (req, res) => {
  const name = (req.query.name || "").toLowerCase();
  const start = parseInt(req.query.start) || 0;
  const limit = parseInt(req.query.limit) || 5;
  const human = req.query.human;

  await fetchRecipes();

  if (!recipes || Object.keys(recipes).length === 0) {
    return res.status(500).json({ error: "Failed to fetch recipes.json" });
  }

  const matches = Object.values(recipes)
    .filter(recipe =>
      recipe.item_output && recipe.item_output.toLowerCase().includes(name)
    );

  const sliced = matches.slice(start, start + limit);

  if (human === "html") {
    // Return simple HTML with image previews
    let html = `<html><head><title>DFS Recipes: ${name}</title></head><body>`;
    html += `<h1>DFS Recipes Matching: "${name}"</h1>`;
    sliced.forEach(recipe => {
      html += `<hr/><h2>${recipe.item_output}</h2><ul>`;
      for (let i = 1; i <= 9; i++) {
        if (recipe[`ingredient${i}`]) {
          html += `<li>${recipe[`ingredient${i}`]}</li>`;
        }
      }
      html += `</ul>`;
      if (recipe.img_url) {
        html += `<img src="${recipe.img_url}" alt="Recipe Image" style="max-width:300px;"><br>`;
      }
    });
    html += `<p>Page ${Math.floor(start / limit) + 1} of ${Math.ceil(matches.length / limit)}</p>`;
    html += `</body></html>`;
    return res.send(html);
  }

  if (human) {
    // Pretty JSON version
    res.setHeader("Content-Type", "application/json");
    return res.send(JSON.stringify({
      total: matches.length,
      results: sliced
    }, null, 2));
  }

  // Standard API JSON response
  res.json({
    total: matches.length,
    results: sliced
  });
});

app.get("/", (req, res) => {
  res.send("DFS Recipe API is running.");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
