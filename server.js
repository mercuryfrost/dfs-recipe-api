const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(cors());

// Load full recipe data
const recipes = JSON.parse(fs.readFileSync(path.join(__dirname, "recipes.json"), "utf8"));

// Main route
app.get("/recipe", async (req, res) => {
  const {
    name = "",
    start = 0,
    limit = 9999,
    human,
    maxChars = 2048
  } = req.query;

  const query = name.toLowerCase();
  const startIndex = parseInt(start) || 0;
  const maxCharLimit = parseInt(maxChars) || 2048;

  // Filter by search term
  let matched = Object.values(recipes).filter(
    recipe => recipe.item_output && recipe.item_output.toLowerCase().includes(query)
  );

  // Paginate with character cap
  let results = [];
  let charCount = 0;

  for (let i = startIndex; i < matched.length; i++) {
    const next = matched[i];
    const testPayload = JSON.stringify([...results, next]);
    if (testPayload.length > maxCharLimit) break;

    results.push(next);
    charCount = testPayload.length;
  }

  const payload = {
    query,
    totalMatches: matched.length,
    returned: results.length,
    characterCount: charCount,
    start: startIndex,
    results
  };

  // Pretty JSON for debugging
  if (human === "1" || human === "true") {
    res.setHeader("Content-Type", "application/json");
    return res.send(JSON.stringify(payload, null, 2));
  }

  // HTML rendering
  if (human === "html") {
    return res.send(renderHtml(results, startIndex, matched.length));
  }

  // Default: compact JSON for LSL
  res.json(payload);
});

// Browser-friendly HTML output
function renderHtml(results, start, total) {
  const page = Math.floor(start / results.length) + 1;
  const pages = Math.ceil(total / results.length);

  const rows = results.map(recipe => {
    const name = recipe.item_output || "Unnamed";
    const img = recipe.img_url
      ? `<img src="${recipe.img_url}" alt="" width="100"><br>`
      : "";
    const ingredients = Object.keys(recipe)
      .filter(k => k.startsWith("ingredient") && recipe[k])
      .map(k => `<li>${recipe[k]}</li>`)
      .join("");

    return `<div style="border:1px solid #ccc; margin:10px; padding:10px;">
      ${img}
      <strong>${name}</strong>
      <ul>${ingredients}</ul>
    </div>`;
  }).join("");

  return `
    <html>
      <head><title>DFS Recipes</title></head>
      <body>
        <h1>Recipes – Page ${page} of ${pages}</h1>
        ${rows}
        <hr>
        <small>Total Matches: ${total}</small>
      </body>
    </html>
  `;
}

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`DFS Recipe API listening on port ${port}`);
});
