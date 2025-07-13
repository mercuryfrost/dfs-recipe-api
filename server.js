const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

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

app.get("/recipe", async (req, res) => {
  try {
    const name = req.query.name?.toLowerCase();
    const human = req.query.human;
    const page = parseInt(req.query.page) || 1;
    const pageSize = 9;

    const recipesData = await loadRecipes();
    const recipes = Object.values(recipesData);

    if (name) {
      const matching = recipes.filter(r => r.item_output?.toLowerCase().includes(name));
      if (!matching.length) {
        return res.status(404).json({ error: "Recipe not found." });
      }

      if (human === "1" || human === "html") {
        const totalPages = Math.ceil(matching.length / pageSize);
        const currentPage = Math.max(1, Math.min(page, totalPages));
        const start = (currentPage - 1) * pageSize;
        const paged = matching.slice(start, start + pageSize);

        const html = `
          <html><head><title>Recipes</title></head><body>
          <h2>Found ${matching.length} matching recipes</h2>
          <ul>
            ${paged.map(r => `
              <li>
                <strong>${r.item_output}</strong><br/>
                ${[...Array(9).keys()]
                  .map(i => r[`ingredient${i + 1}`])
                  .filter(Boolean)
                  .map(ing => `- ${ing}<br/>`)
                  .join("")}
                ${r.img_url ? `<img src="${r.img_url}" width="100"/>` : ""}
              </li>
            `).join("")}
          </ul>
          <div>Page ${currentPage} of ${totalPages}</div>
          </body></html>
        `;

        return res.send(html);
      } else {
        return res.json(matching.map(r => ({
          id: r.id,
          item_output: r.item_output
        })));
      }
    }

    res.status(400).json({ error: "Missing 'name' query parameter." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

app.get("/", (req, res) => {
  res.send(`
    <h1>DFS Recipe API</h1>
    <p>Use <code>/recipe?name=yourquery</code> to search.</p>
    <ul>
      <li><code>?name=strawberry</code> - search for recipes</li>
      <li><code>&human=1</code> - returns HTML with ingredient list and image</li>
      <li><code>&page=2</code> - use for paginated HTML results</li>
    </ul>
  `);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
