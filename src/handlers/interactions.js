const {
  Events,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require("discord.js");

const config = require("../config");
const embeds = require("../utils/embeds");
const { verifyUser } = require("./verification");

module.exports = (client) => {

  client.on(Events.InteractionCreate, async (interaction) => {

    // BUTTON
    if (interaction.isButton()) {
      if (interaction.customId === "start_verify") {

        const modal = new ModalBuilder()
          .setCustomId("verify_modal")
          .setTitle("AQW Verification");

        const input = new TextInputBuilder()
          .setCustomId("username")
          .setLabel("AQW Username")
          .setStyle(TextInputStyle.Short);

        modal.addComponents(new ActionRowBuilder().addComponents(input));
        console.log("Verify button clicked by:", interaction.user.tag);
        return interaction.showModal(modal);
      }
    }

    // MODAL
    if (interaction.isModalSubmit()) {

      if (interaction.customId === "verify_modal") {

        const username = interaction.fields.getTextInputValue("username");

        await interaction.reply({ content: "🔍 Checking...", ephemeral: true });

        const result = await verifyUser(interaction, username, config);

        if (!result.success) {
  if (result.reason === "duplicate") {
    const log = interaction.guild.channels.cache.get(config.LOG_CHANNEL_ID);

    if (log) {
      log.send({
        content: "<@&1441458984581206087>",
        embeds: [
          embeds.error(
            `⚠️ Possible identity fake detected.\n\n` +
            `User: ${interaction.user}\n` +
            `Tried to claim AQW account: **${result.username}**\n` +
            `Already claimed by: <@${result.existingUserId}>`
          )
        ]
      });
    }

    return interaction.editReply({
      embeds: [
        embeds.error(
          "User with this AQW Account already in the Server. A moderator has been notified Kindly wait for verification."
        )
      ]
    });
  }

  return interaction.editReply({
    embeds: [embeds.error(result.message || "Verification failed.")]
  });
}
        console.log("Modal submitted by:", interaction.user.tag);
        console.log("Username entered:", username); 
        const log = interaction.guild.channels.cache.get(config.LOG_CHANNEL_ID);
        if (log) {
            log.send({
                embeds: [embeds.log(interaction.user, result.username, result.guild)]
  });
}
const welcomeLogChannel = interaction.guild.channels.cache.get(config.WELCOME_LOG_CHANNEL_ID);

if (welcomeLogChannel) {
  welcomeLogChannel.send({
    embeds: [embeds.welcomeLog(interaction.user, result.username, result.guild)]
  });
}

const mainChatChannel = interaction.guild.channels.cache.get(config.MAIN_CHAT_CHANNEL_ID);

if (mainChatChannel) {
  mainChatChannel.send(`Welcome to Stormforged ${interaction.user}!`);
}

        return interaction.editReply({
          embeds: [embeds.success(username)]
        });
      }
    }
  });
};
