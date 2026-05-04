const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const embeds = require("../utils/embeds");
const config = require("../config");

module.exports = (client) => {
  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    if (message.content === "!dashboard") {

      if (message.channel.id !== config.VERIFY_CHANNEL_ID) return;

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("start_verify")
          .setLabel("Verify Account")
          .setStyle(ButtonStyle.Primary)
      );
      if (message.content.startsWith("!say")) {

    const args = message.content.slice(5).trim();
    const targetChannelId = "1441450698347909300"; // replace this

    const channel = message.guild.channels.cache.get(targetChannelId);

    if (!channel) {
      return message.reply("❌ Channel not found.");
    }

    channel.send(args);
  }

      message.channel.send({
        embeds: [embeds.dashboard()],
        components: [row]
      });
    }
  });
};