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

    // These mean the character does NOT exist
    if (
      html.includes("no character found") ||
      html.includes("character not found") ||
      html.includes("could not find") ||
      html.includes("not found")
    ) {
      return false;
    }

    // These usually exist on real AQW character pages
    if (
      html.includes("charpage") ||
      html.includes("character page") ||
      html.includes("level") ||
      html.includes("class")
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