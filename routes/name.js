const express = require("express");
const loadRecipes = require("../utils/loadRecipes");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const name = req.query.name?.toLowerCase();
    const limit = parseInt(req.query.limit) || 75;
    const human = req.query.human;
    const page = parseInt(req.query.page) || 1;
    const pageSize = 9;

    if (!name) {
      return res.status(400).json({ error: "Missing 'name' query parameter." });
    }

    const recipesData = await loadRecipes();
    const recipes = Object.values(recipesData);
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
    }

    const limited = matching.slice(0, limit);

    res.json(matching.map(r => ({
      id: r.id,
      item_output: r.item_output
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

module.exports = router;
