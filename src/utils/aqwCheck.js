const axios = require("axios");

async function checkAQWUser(username) {
  try {
    const res = await axios.get(
      `https://account.aq.com/CharPage?id=${encodeURIComponent(username)}`
    );

    return !res.data.toLowerCase().includes("no character found");
  } catch {
    return false;
  }
}

module.exports = checkAQWUser;