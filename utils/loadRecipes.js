const fetch = require("node-fetch");

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

module.exports = loadRecipes;
