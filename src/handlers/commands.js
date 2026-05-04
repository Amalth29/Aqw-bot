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
      const args = message.content.slice(5).trim();
      
      if (!args) {
        return message.reply("❌ Please provide a message.");
      }

      const targetChannelId = "1441450698347909300";
      const channel = message.guild.channels.cache.get(targetChannelId);
      console.log("Message received:", message.content);
      if (!channel) {
        return message.reply("❌ Channel not found.");
      }

      return channel.send(args);
    }
  });
};