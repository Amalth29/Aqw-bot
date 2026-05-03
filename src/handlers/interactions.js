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
          return interaction.editReply({
            embeds: [embeds.error("Account not found")]
          });
        }

        const log = interaction.guild.channels.cache.get(config.LOG_CHANNEL_ID);
        if (log) log.send(`✅ ${interaction.user.tag} verified as ${username}`);

        return interaction.editReply({
          embeds: [embeds.success(username)]
        });
      }
    }
  });
};