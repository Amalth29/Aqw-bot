const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const embeds = require("../utils/embeds");
const config = require("../config");
console.log("commands.js loaded");
function log(message) {
  const timestamp = new Date().toLocaleString();
  console.log(`[${timestamp}] ${message}`);
}
module.exports = (client) => {
  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    
if (message.content === "!syncnames") {
  if (!message.member.permissions.has("Administrator")) {
    return message.reply("❌ You don't have permission to use this.");
  }

  const fs = require("fs");
  const path = require("path");

  const dbPath = path.join(__dirname, "../data/verifiedUsers.json");

  const verifiedUsers = fs.existsSync(dbPath)
    ? JSON.parse(fs.readFileSync(dbPath, "utf8"))
    : {};

  await message.reply("🔄 Syncing server nicknames...");

  const members = await message.guild.members.fetch();

  let added = 0;

  members.forEach(member => {
    if (member.user.bot) return;

    const name = member.nickname || member.displayName;
    if (!name) return;

    const normalized = name.toLowerCase().trim();

    if (!verifiedUsers[normalized]) {
      verifiedUsers[normalized] = member.user.id;
      added++;
    }
  });

  fs.writeFileSync(dbPath, JSON.stringify(verifiedUsers, null, 2));

  return message.channel.send(`✅ Synced ${added} names into verifiedUsers.json.`);
}
    // !dashboard command
    if (message.content === "!dashboard") {
      if (message.channel.id !== config.VERIFY_CHANNEL_ID) return;

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("start_verify")
          .setLabel("Verify Account")
          .setStyle(ButtonStyle.Primary)
      );

      return message.channel.send({
        embeds: [embeds.dashboard()],
        components: [row]
      });
    }

    // !say command
    if (message.content.startsWith("!say")) {

  const allowedRoleName = "MODERATOR"; // 👈 change this to your role name

  const hasRole = message.member.roles.cache.some(
    role => role.name === allowedRoleName
  );

  if (!hasRole) {
    return message.reply("❌ You don't have permission to use this command.");
  }

  const args = message.content.slice(5).trim();

  if (!args) {
    return message.reply("❌ Please provide a message.");
  }

  const targetChannelId = "1441450698347909300";
  const channel = message.guild.channels.cache.get(targetChannelId);

  if (!channel) {
    return message.reply("❌ Channel not found.");
  }

  await channel.send({
    content: args,
    allowedMentions: { parse: ["users", "roles", "everyone"] }
  });

  return message.reply("✅ Sent.");
}
  });
};