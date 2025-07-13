const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;
const PER_PAGE = 10;

app.use(cors());

app.get("/", (req, res) => {
  res.send(`
    <html>
      <body style="font-family: sans-serif; padding: 2em;">
        <h1>DFS Recipe Search API</h1>
        <p>Use this endpoint to search <code>recipes.json</code> by recipe name.</p>

        <h2>Examples</h2>
        <ul>
          <li><a href="/recipe?name=strawberry">/recipe?name=strawberry</a> — JSON results</li>
          <li><a href="/recipe?name=strawberry&human=1">/recipe?name=strawberry&human=1</a> — HTML view</li>
          <li><a href="/recipe?name=strawberry&human=1&page=2">/recipe?name=strawberry&human=1&page=2</a> — HTML, page 2</li>
        </ul>

        <p>Each page contains 10 results. Images and up to 9 ingredients shown in human mode.</p>
        <p style="font-size: small; margin-top: 3em;">This is a personal proxy for use with LSL in Second Life. Not affiliated with DFS.</p>
      </body>
    </html>
  `);
});

app.get("/recipe", async (req, res) => {
  const { name = "", human = false, page = 1 } = req.query;

  try {
    const response = await fetch("https://www.digitalfarmsystem.com/recipes.json");
    if (!response.ok) throw new Error("Failed to fetch recipes.json");
    const raw = await response.json();

    const recipes = Object.values(raw).filter(r =>
      r.item_output && r.item_output.toLowerCase().includes(name.toLowerCase())
    );

    if (human) {
      const pageNum = parseInt(page) || 1;
      const totalPages = Math.ceil(recipes.length / PER_PAGE);
      const paged = recipes.slice((pageNum - 1) * PER_PAGE, pageNum * PER_PAGE);

      const html = `
        <html>
        <body style="font-family: sans-serif; padding: 2em;">
          <h1>Results for "${name}"</h1>
          <p>Showing page ${pageNum} of ${totalPages} (${recipes.length} total results)</p>
          ${paged.map(r => `
            <div style="margin-bottom: 2em;">
              <h2>${r.item_output}</h2>
              ${r.img_url ? `<img src="${r.img_url}" style="max-width: 300px; display:block; margin-bottom: 1em;">` : ""}
              <ul>
                ${Array.from({ length: 9 }).map((_, i) => {
                  const key = `ingredient${i + 1}`;
                  return r[key] ? `<li>${r[key]}</li>` : "";
                }).join("")}
              </ul>
            </div>
          `).join("")}
          <div style="margin-top: 2em;">
            ${pageNum > 1 ? `<a href="/recipe?name=${name}&human=1&page=${pageNum - 1}">Previous</a>` : ""}
            ${pageNum < totalPages ? ` | <a href="/recipe?name=${name}&human=1&page=${pageNum + 1}">Next</a>` : ""}
          </div>
        </body>
        </html>
      `;
      res.send(html);
    } else {
      res.json(recipes);
    }
  } catch (err) {
    console.error("Error fetching recipes.json:", err.message);
    res.status(500).json({ error: "Failed to fetch recipes.json" });
  }
});

app.listen(PORT, () => {
  console.log(`DFS Recipe API listening on port ${PORT}`);
});
