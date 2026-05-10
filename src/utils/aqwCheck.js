const axios = require("axios");

function cleanText(text) {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function checkAQWUser(username) {
  try {
    const url = `https://account.aq.com/CharPage?id=${encodeURIComponent(username)}`;

    const res = await axios.get(url, {
      timeout: 15000,
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const html = res.data;

    const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (!h1Match) return { exists: false };

    const foundName = cleanText(h1Match[1]);

    if (foundName.toLowerCase() !== username.trim().toLowerCase()) {
      return { exists: false };
    }

    // Convert page HTML into readable text
const plainText = cleanText(html);

let guild = "No Guild";

const guildMatch = plainText.match(/Guild:\s*(.*?)\s*Achievements/i);

if (guildMatch && guildMatch[1]) {
  guild = guildMatch[1].trim();
}

console.log("AQW username:", foundName);
console.log("AQW guild:", guild);

return {
  exists: true,
  username: foundName,
  guild
};
  } catch (err) {
    console.error("AQW check failed:", err.message);
    return { exists: false };
  }
}

module.exports = checkAQWUser;