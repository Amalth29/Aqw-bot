const fs = require("fs");
const path = require("path");
const checkAQWUser = require("../utils/aqwCheck");

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "../data");
const dbPath = path.join(DATA_DIR, "verifiedUsers.json");



function loadVerifiedUsers() {
  if (!fs.existsSync(dbPath)) return {};
  return JSON.parse(fs.readFileSync(dbPath, "utf8"));
}

function saveVerifiedUsers(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

async function verifyUser(interaction, username, config) {
  const result = await checkAQWUser(username);

  if (!result.exists) {
    return {
      success: false,
      reason: "not_found",
      message: "Account not found."
    };
  }

  const normalizedUsername = result.username.toLowerCase();
  const verifiedUsers = loadVerifiedUsers();

  // 🚨 Duplicate identity check
  if (
    verifiedUsers[normalizedUsername] &&
    verifiedUsers[normalizedUsername] !== interaction.user.id
  ) {
    return {
      success: false,
      reason: "duplicate",
      message: "User with this AQW Account already exists.",
      existingUserId: verifiedUsers[normalizedUsername],
      username: result.username,
      guild: result.guild
    };
  }

  const verified = interaction.guild.roles.cache.find(
    r => r.name === config.ROLES.VERIFIED
  );

  const unverified = interaction.guild.roles.cache.find(
    r => r.name === config.ROLES.UNVERIFIED
  );

  if (verified) await interaction.member.roles.add(verified);

  if (unverified && interaction.member.roles.cache.has(unverified.id)) {
    await interaction.member.roles.remove(unverified);
  }
 
  const guildRoleMap = {
  stormforged: "1446487749795250246",
  ravens: "1456027015194083472",
  solaris: "1501252106584199219",
  vanaheim: "1505597648240119908"
};

const aqwGuild = result.guild?.toLowerCase().trim();

if (aqwGuild && guildRoleMap[aqwGuild]) {
  const guildRole = interaction.guild.roles.cache.get(guildRoleMap[aqwGuild]);

  if (guildRole) {
    await interaction.member.roles.add(guildRole);
  }
}

  try {
    await interaction.member.setNickname(result.username);
  } catch (err) {
    console.error("Failed to rename user:", err.message);
  }

  // Save linked AQW username
  verifiedUsers[normalizedUsername] = interaction.user.id;
  saveVerifiedUsers(verifiedUsers);

  return {
    success: true,
    username: result.username,
    guild: result.guild
  };
}

module.exports = { verifyUser };