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

      message.channel.send({
        embeds: [embeds.dashboard()],
        components: [row]
      });
    }
  });
};