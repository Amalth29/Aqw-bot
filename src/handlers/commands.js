const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const embeds = require("../utils/embeds");
const config = require("../config");
console.log("commands.js loaded");

module.exports = (client) => {
  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

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