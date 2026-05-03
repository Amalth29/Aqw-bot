const axios = require("axios");

async function checkAQWUser(username) {
  try {
    const url = `https://account.aq.com/CharPage?id=${encodeURIComponent(username)}`;

    const res = await axios.get(url, {
      timeout: 15000,
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "text/html"
      }
    });

    const html = res.data.toLowerCase();

    // Clear fake/not-found signals
    const invalidSignals = [
      "no character found",
      "character not found",
      "could not find",
      "does not exist",
      "not found"
    ];

    if (invalidSignals.some(signal => html.includes(signal))) {
      return false;
    }

    // Require real character-page data, not just a page load
    const hasLevel = /level\s*[:\-]?\s*\d+/i.test(res.data);
    const hasClass = html.includes("class");
    const hasCharacterInfo =
      html.includes("character page") ||
      html.includes("charpage") ||
      html.includes("character details");

    // Only verify if it has multiple real-profile indicators
    if (hasLevel && hasClass && hasCharacterInfo) {
      return true;
    }

    return false;
  } catch (err) {
    console.error("AQW check failed:", err.message);
    return false;
  }
}

module.exports = checkAQWUser;