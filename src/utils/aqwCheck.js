const axios = require("axios");

// ─── Cache Setup ───────────────────────────────────────────
const cache = new Map();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

// ─── Queue Setup ───────────────────────────────────────────
const queue = [];
let processing = false;

// ─── Logger ────────────────────────────────────────────────
function log(levelOrMessage, message, data = {}) {
  const levels = ["INFO", "WARN", "ERROR", "DEBUG"];
  let level, msg;
  if (levels.includes(levelOrMessage)) {
    level = levelOrMessage;
    msg = message;
  } else {
    level = "INFO";
    msg = levelOrMessage;
  }
  const timestamp = new Date().toLocaleString();
  const dataStr = Object.keys(data).length > 0 ? " | " + JSON.stringify(data) : "";
  console.log(`[${timestamp}] [${level}] ${msg}${dataStr}`);
}

// ─── Text Cleaner ──────────────────────────────────────────
function cleanText(text) {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Core Fetch (no cache, no queue) ──────────────────────
async function fetchAQWUser(username) {
  const url = `https://account.aq.com/CharPage?id=${encodeURIComponent(username)}`;

  const res = await axios.get(url, {
    timeout: 15000,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Connection": "keep-alive",
      "Referer": "https://www.aq.com/",
      "Cache-Control": "no-cache",
    }
  });

  const html = res.data;
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (!h1Match) return { exists: false };

  const foundName = cleanText(h1Match[1]);
  if (foundName.toLowerCase() !== username.trim().toLowerCase()) {
    return { exists: false };
  }

  const plainText = cleanText(html);
  let guild = "No Guild";
  const guildMatch = plainText.match(/Guild:\s*(.*?)\s*Achievements/i);
  if (guildMatch && guildMatch[1]) {
    guild = guildMatch[1].trim();
  }

  return { exists: true, username: foundName, guild };
}

// ─── Queue Processor ───────────────────────────────────────
async function processQueue() {
  processing = true;
  while (queue.length > 0) {
    const { username, resolve, reject } = queue.shift();
    log("INFO", "Processing verification from queue", { username, remaining: queue.length });
    try {
      const result = await fetchAQWUser(username);
      // Save to cache after successful fetch
      cache.set(username.toLowerCase(), { data: result, timestamp: Date.now() });
      log("INFO", "Cached result for user", { username });
      resolve(result);
    } catch (err) {
      log("ERROR", "Queue fetch failed", { username, error: err.message });
      reject(err);
    }
    // Wait 1.5s between requests to avoid hammering AQW
    if (queue.length > 0) {
      await new Promise(r => setTimeout(r, 1500));
    }
  }
  processing = false;
}

// ─── Main Export (cache + queue) ──────────────────────────
async function checkAQWUser(username) {
  try {
    // 1. Check cache first
    const cached = cache.get(username.toLowerCase());
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      log("INFO", "Returning cached result", { username });
      return cached.data;
    }

    // 2. Add to queue and wait for result
    log("INFO", "Queuing verification request", { username, position: queue.length + 1 });
    return await new Promise((resolve, reject) => {
      queue.push({ username, resolve, reject });
      if (!processing) processQueue();
    });

  } catch (err) {
    log("ERROR", "AQW check failed", { username, error: err.message });
    return { exists: false };
  }
}

module.exports = checkAQWUser;