const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());

const DFS_JSON_URL = "https://www.digitalfarmsystem.com/recipes.json";
const PER_PAGE = 10;

app.get("/recipe", async (req, res) => {
  const search = (req.query.name || "").toLowerCase();
  const human = req.query.human === "1";
  const page = parseInt(req.query.page || "1");

  let data;
  try {
    const response = await fetch(DFS_JSON_URL);
    if (!response.ok) throw new Error("Network response not ok");
    data = await response.json();
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch recipes.json" });
  }

  const results = [];

  for (const [id, recipe] of Object.entries(data)) {
    const name = recipe.item_output?.toLowerCase() || "";
    if (name.includes(search)) {
      results.push(recipe);
    }
  }

  const totalPages = Math.ceil(results.length / PER_PAGE);
  const paginatedResults = results.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  if (human) {
    let html = `<html><body><h2>DFS Recipes matching: <code>${search}</code></h2>`;
    html += `<p>Page ${page} of ${totalPages} (${results.length} results total)</p>`;
    for (const recipe of paginatedResults) {
      html += `<hr><strong>${recipe.item_output}</strong><br>`;
      for (let i = 1; i <= 9; i++) {
        const ing = recipe["ingredient" + i];
        if (ing) html += `- ${ing}<br>`;
      }
      if (recipe.img_url) {
        html += `<img src="${recipe.img_url}" width="128"><br>`;
      }
    }

    html += `<hr><p>`;
    for (let i = 1; i <= totalPages; i++) {
      html += `<a href="/recipe?name=${encodeURIComponent(search)}&human=1&page=${i}">[${i}]</a> `;
    }
    html += `</p></body></html>`;
    return res.send(html);
  }

  return res.json({
    page,
    total_pages: totalPages,
    per_page: PER_PAGE,
    results: paginatedResults,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
