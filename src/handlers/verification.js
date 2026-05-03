const checkAQWUser = require("../utils/aqwCheck");

async function verifyUser(interaction, username, config) {
  const exists = await checkAQWUser(username);

  if (!exists) {
    return { success: false };
  }

  const verified = interaction.guild.roles.cache.find(r => r.name === config.ROLES.VERIFIED);
  const unverified = interaction.guild.roles.cache.find(r => r.name === config.ROLES.UNVERIFIED);

  if (verified) await interaction.member.roles.add(verified);
  if (unverified && interaction.member.roles.cache.has(unverified.id)) {
    await interaction.member.roles.remove(unverified);
  }

  return { success: true };
}

module.exports = { verifyUser };