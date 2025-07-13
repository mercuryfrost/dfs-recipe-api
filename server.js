const express = require("express");
const cors = require("cors");
const axios = require("axios");
const app = express();

const PORT = process.env.PORT || 3000;
const DFS_JSON_URL = "https://www.digitalfarmsystem.com/recipes.json";

// In-memory cache
let cache = {
  data: null,
  timestamp: 0
};

async function fetchRecipes() {
  if (cache.data && Date.now() - cache.timestamp < 1000 * 60 * 60) {
    return cache.data;
  }

  const response = await axios.get(DFS_JSON_URL);
  cache.data = response.data;
  cache.timestamp = Date.now();
  return cache.data;
}

app.use(cors());

app.get("/", (req, res) => {
  res.send(`
    <h1>DFS Recipe API</h1>
    <p>Use <code>?name=...</code> to search.</p>
    <p>Optional: <code>&human=1</code> for pretty JSON, <code>&human=html</code> for a browser view</p>
    <p>Example: <a href="/recipe?name=strawberry">/recipe?name=strawberry</a></p>
  `);
});

app.get("/recipe", async (req, res) => {
  const { name = "", human, page = 1 } = req.query;
  const pageSize = 10;

  if (!name.trim()) {
    return res.status(400).json({ error: "Missing name parameter." });
  }

  try {
    const data = await fetchRecipes();
    const recipes = Object.values(data);

    const matches = recipes.filter(r =>
      r.item_output.toLowerCase().includes(name.toLowerCase())
    );

    if (matches.length === 0) {
      return res.status(404).json({ error: "Recipe not found." });
    }

    if (human === "1") {
      return res.setHeader("Content-Type", "application/json").send(JSON.stringify(matches, null, 2));
    }

    if (human === "html") {
      const pageNum = parseInt(page) || 1;
      const totalPages = Math.ceil(matches.length / pageSize);
      const paginated = matches.slice((pageNum - 1) * pageSize, pageNum * pageSize);

      let html = `<h2>Results for "${name}" – Page ${pageNum} of ${totalPages}</h2><ul>`;
      for (const r of paginated) {
        html += `<li><strong>${r.item_output}</strong><ul>`;
        for (let i = 1; i <= 9; i++) {
          const ing = r["ingredient" + i];
          if (ing) html += `<li>${ing}</li>`;
        }
        html += `</ul></li>`;
      }
      html += `</ul><p>`;
      if (pageNum > 1) html += `<a href="?name=${encodeURIComponent(name)}&human=html&page=${pageNum - 1}">Previous</a> `;
      if (pageNum < totalPages) html += `<a href="?name=${encodeURIComponent(name)}&human=html&page=${pageNum + 1}">Next</a>`;
      html += `</p>`;

      return res.send(html);
    }

    res.json(matches);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error." });
  }
});

app.listen(PORT, () => {
  console.log(`DFS API running at http://localhost:${PORT}`);
});
