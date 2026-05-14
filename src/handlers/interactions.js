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
if (interaction.isChatInputCommand()) {
  if (interaction.commandName === "calendar") {
    const { EmbedBuilder } = require("discord.js");

    const embed = new EmbedBuilder()
      .setTitle("📅 AQW Boost Calendar — May 2026")
      .setColor(0x5865F2)
      .setDescription(
        "**May 2026 Daily Boosts**\n\n" +
        "```text\n" +
        "Sun Mon Tue Wed Thu Fri Sat\n" +
        "                1   2\n" +
        "                ALL Keys\n" +
        "\n" +
        "3   4   5   6   7   8   9\n" +
        "    Gold MW  Rep Ess CP\n" +
        "\n" +
        "10  11  12  13  14  15  16\n" +
        "    EXP MW  Gold    Rep\n" +
        "\n" +
        "17  18  19  20  21  22  23\n" +
        "    CP  MW  EXP     Gold\n" +
        "\n" +
        "24  25  26  27  28  29  30\n" +
        "    Rep MW  CP      ALL\n" +
        "\n" +
        "31\n" +
        "```\n"
      )
      .addFields(
        { name: "🟣 May 1", value: "Double ALL Boost\nMembers: Free Keys Available", inline: false },
        { name: "🟡 May 4", value: "Double Gold Boost", inline: true },
        { name: "🛠️ May 5", value: "Mid-Week Update", inline: true },
        { name: "🟢 May 6", value: "Double Rep Boost", inline: true },
        { name: "✨ May 7", value: "Essences + Totems Boost", inline: true },
        { name: "🔵 May 8", value: "Double Class Points Boost", inline: true },
        { name: "⚡ May 11", value: "Double EXP Boost", inline: true },
        { name: "🛠️ May 12", value: "Mid-Week Update", inline: true },
        { name: "🟡 May 13", value: "Double Gold Boost", inline: true },
        { name: "🟢 May 15", value: "Double Rep Boost", inline: true },
        { name: "🔵 May 18", value: "Double Class Points Boost", inline: true },
        { name: "🛠️ May 19", value: "Mid-Week Update", inline: true },
        { name: "⚡ May 20", value: "Double EXP Boost", inline: true },
        { name: "🟡 May 22", value: "Double Gold Boost", inline: true },
        { name: "🟢 May 25", value: "Double Rep Boost", inline: true },
        { name: "🛠️ May 26", value: "Mid-Week Update", inline: true },
        { name: "🔵 May 27", value: "Double Class Points Boost", inline: true },
        { name: "🟣 May 29", value: "Double ALL Boost", inline: true }
      )
      .setFooter({ text: "AQW Calendar" })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
}
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
