const axios = require("axios");

async function checkAQWUser(username) {
  try {
    const url = `https://account.aq.com/CharPage?id=${encodeURIComponent(username)}`;

    const res = await axios.get(url, {
      timeout: 15000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept":
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://account.aq.com/",
        "Connection": "keep-alive"
      }
    });

    const html = res.data.toLowerCase();

    if (
      html.includes("no character found") ||
      html.includes("character not found") ||
      html.includes("could not find")
    ) {
      return false;
    }

    return true;
  } catch (err) {
    console.error("AQW check failed:", err.message);
    return false;
  }
}

module.exports = checkAQWUser;