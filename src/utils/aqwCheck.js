const axios = require("axios");

async function checkAQWUser(username) {
  try {
    const url = `https://account.aq.com/CharPage?id=${encodeURIComponent(username)}`;

    const res = await axios.get(url, {
      timeout: 10000,
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const html = res.data.toLowerCase();

    // Invalid / missing account checks
    if (
      html.includes("no character found") ||
      html.includes("character not found") ||
      html.includes("does not exist") ||
      html.includes("not found")
    ) {
      return false;
    }

    // Valid AQW character pages usually contain actual character data
    if (
      html.includes("level") &&
      html.includes("class") &&
      html.includes("character")
    ) {
      return true;
    }

    return false;
  } catch (err) {
    console.error("AQW check failed:", err.message);
    return false;
  }
}

module.exports = checkAQWUser;