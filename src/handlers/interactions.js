const {
  Events,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require("discord.js");

const config = require("../config");
const embeds = require("../utils/embeds");
const { verifyUser } = require("./verification");
function log(message) {
  const timestamp = new Date().toLocaleString();

  console.log(`[${timestamp}] ${message}`);
}

module.exports = (client) => {

  client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isModalSubmit()) {
  if (interaction.customId.startsWith("announce_modal:")) {
    const channelId = interaction.customId.split(":")[1];
    const channel = interaction.guild.channels.cache.get(channelId);

    const title = interaction.fields.getTextInputValue("title");
    const message = interaction.fields.getTextInputValue("message");
    const logo = interaction.fields.getTextInputValue("logo");
    const banner = interaction.fields.getTextInputValue("banner");
    const footer = interaction.fields.getTextInputValue("footer");

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(message)
      .setColor(0x5865F2)
      .setTimestamp();

    if (logo) embed.setThumbnail(logo);
    if (banner) embed.setImage(banner);
    if (footer) embed.setFooter({ text: footer });

    const sent = await channel.send({ embeds: [embed] });

    return interaction.reply({
      content: `✅ Announcement sent.\nMessage ID: \`${sent.id}\``,
      ephemeral: true
    });
  }

  if (interaction.customId.startsWith("edit_announce_modal:")) {
    const parts = interaction.customId.split(":");
    const channelId = parts[1];
    const messageId = parts[2];

    const channel = interaction.guild.channels.cache.get(channelId);

    const title = interaction.fields.getTextInputValue("title");
    const message = interaction.fields.getTextInputValue("message");
    const logo = interaction.fields.getTextInputValue("logo");
    const banner = interaction.fields.getTextInputValue("banner");
    const footer = interaction.fields.getTextInputValue("footer");

    try {
      const targetMessage = await channel.messages.fetch(messageId);

      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(message)
        .setColor(0x5865F2)
        .setTimestamp();

      if (logo) embed.setThumbnail(logo);
      if (banner) embed.setImage(banner);
      if (footer) embed.setFooter({ text: footer });

      await targetMessage.edit({ embeds: [embed] });

      return interaction.reply({
        content: "✅ Announcement updated.",
        ephemeral: true
      });
    } catch (err) {
      console.error(err);

      return interaction.reply({
        content: "❌ Could not edit that announcement.",
        ephemeral: true
      });
    }
  }
}
if (interaction.isChatInputCommand()) {
  if (interaction.commandName === "announce") {
  const allowedRole = "YOUR_STAFF_ROLE_ID";

  const isAdmin = interaction.member.permissions.has("Administrator");
  const hasRole = interaction.member.roles.cache.has(allowedRole);

  if (!isAdmin && !hasRole) {
    return interaction.reply({
      content: "❌ No permission.",
      ephemeral: true
    });
  }

  const channel = interaction.options.getChannel("channel");

  if (!channel || !channel.isTextBased()) {
    return interaction.reply({
      content: "❌ Please select a text channel.",
      ephemeral: true
    });
  }

  const modal = new ModalBuilder()
    .setCustomId(`announce_modal:${channel.id}`)
    .setTitle("Create Announcement");

  const titleInput = new TextInputBuilder()
    .setCustomId("title")
    .setLabel("Embed Title")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder("🌩️ WELCOME TO STORMFORGED 🌩️");

  const messageInput = new TextInputBuilder()
    .setCustomId("message")
    .setLabel("Message")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setPlaceholder("Write your announcement here...");

  const logoInput = new TextInputBuilder()
    .setCustomId("logo")
    .setLabel("Logo URL / Thumbnail URL")
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setPlaceholder("https://example.com/logo.png");

  const bannerInput = new TextInputBuilder()
    .setCustomId("banner")
    .setLabel("Banner Image URL")
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setPlaceholder("https://example.com/banner.png");

  const footerInput = new TextInputBuilder()
    .setCustomId("footer")
    .setLabel("Footer Text")
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setPlaceholder("Stormforged Announcement");

  modal.addComponents(
    new ActionRowBuilder().addComponents(titleInput),
    new ActionRowBuilder().addComponents(messageInput),
    new ActionRowBuilder().addComponents(logoInput),
    new ActionRowBuilder().addComponents(bannerInput),
    new ActionRowBuilder().addComponents(footerInput)
  );

  return interaction.showModal(modal);
}
  if (interaction.commandName === "calendar") {
    const { EmbedBuilder } = require("discord.js");
const calendarText =
`        📅 May 2026
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ Sun │ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│     │     │     │     │     │  1  │  2  │
│     │     │     │     │     │ ALL │Keys │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│  3  │  4  │  5  │  6  │  7  │  8  │  9  │
│     │Gold │ MW  │ Rep │Ess  │ CP  │     │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ 10  │ 11  │ 12  │ 13  │ 14  │ 15  │ 16  │
│     │ EXP │ MW  │Gold │     │ Rep │     │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ 17  │ 18  │ 19  │ 20  │ 21  │ 22  │ 23  │
│     │ CP  │ MW  │ EXP │     │Gold │     │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ 24  │ 25  │ 26  │ 27  │ 28  │ 29  │ 30  │
│     │ Rep │ MW  │ CP  │     │ ALL │     │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ 31  │     │     │     │     │     │     │
│     │     │     │     │     │     │     │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┘`;
   const embed = new EmbedBuilder()
  .setTitle("📅 AQW Boost Calendar — May 2026")
  .setColor(0x5865F2)
  .setDescription("```text\n" + calendarText + "\n```")
  .addFields({
    name: "Legend",
    value:
      "🟣 **ALL** = Double ALL Boost\n" +
      "⚡ **EXP** = Double EXP Boost\n" +
      "🟡 **Gold** = Double Gold Boost\n" +
      "🟢 **Rep** = Double Rep Boost\n" +
      "🔵 **CP** = Double Class Points Boost\n" +
      "✨ **Ess** = Essences + Totems Boost\n" +
      "🛠️ **MW** = Mid-Week Update\n" +
      "🔑 **Keys** = Members Free Keys",
    inline: false
  })
  .setFooter({ text: "Stormforged AQW Calendar" })
  .setTimestamp();
    return interaction.reply({ embeds: [embed] });
  }
}
if (interaction.commandName === "announce") {
  const allowedRole = "1448328583020941423";

  const isAdmin = interaction.member.permissions.has("Administrator");
  const hasRole = interaction.member.roles.cache.has(allowedRole);

  if (!isAdmin && !hasRole) {
    return interaction.reply({
      content: "❌ No permission.",
      ephemeral: true
    });
  }

  const channel = interaction.options.getChannel("channel");
  const title = interaction.options.getString("title");
  const message = interaction.options.getString("message");

  if (!channel || !channel.isTextBased()) {
    return interaction.reply({
      content: "❌ Please select a text channel.",
      ephemeral: true
    });
  }

  const { EmbedBuilder } = require("discord.js");

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(message)
    .setColor(0x5865F2)
    .setFooter({ text: "Stormforged Announcement" })
    .setTimestamp();

  const sentMessage = await channel.send({ embeds: [embed] });

  return interaction.reply({
    content: `✅ Announcement sent to ${channel}.\nMessage ID: \`${sentMessage.id}\``,
    ephemeral: true
  });
}

if (interaction.commandName === "editannounce") {
  const allowedRole = "1448328583020941423";

  const isAdmin = interaction.member.permissions.has("Administrator");
  const hasRole = interaction.member.roles.cache.has(allowedRole);

  if (!isAdmin && !hasRole) {
    return interaction.reply({
      content: "❌ No permission.",
      ephemeral: true
    });
  }

  const channel = interaction.options.getChannel("channel");
  const messageId = interaction.options.getString("message_id");

  if (!channel || !channel.isTextBased()) {
    return interaction.reply({
      content: "❌ Please select a text channel.",
      ephemeral: true
    });
  }

  let targetMessage;

  try {
    targetMessage = await channel.messages.fetch(messageId);
  } catch (err) {
    return interaction.reply({
      content: "❌ Could not find that announcement message.",
      ephemeral: true
    });
  }

  const existingEmbed = targetMessage.embeds[0];

  if (!existingEmbed) {
    return interaction.reply({
      content: "❌ That message does not contain an embed.",
      ephemeral: true
    });
  }

  const modal = new ModalBuilder()
    .setCustomId(`edit_announce_modal:${channel.id}:${messageId}`)
    .setTitle("Edit Announcement");

  const titleInput = new TextInputBuilder()
    .setCustomId("title")
    .setLabel("Embed Title")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setValue(existingEmbed.title || "");

  const messageInput = new TextInputBuilder()
    .setCustomId("message")
    .setLabel("Message")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setValue(existingEmbed.description || "");

  const logoInput = new TextInputBuilder()
    .setCustomId("logo")
    .setLabel("Logo URL / Thumbnail URL")
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setValue(existingEmbed.thumbnail?.url || "");

  const bannerInput = new TextInputBuilder()
    .setCustomId("banner")
    .setLabel("Banner Image URL")
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setValue(existingEmbed.image?.url || "");

  const footerInput = new TextInputBuilder()
    .setCustomId("footer")
    .setLabel("Footer Text")
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setValue(existingEmbed.footer?.text || "");

  modal.addComponents(
    new ActionRowBuilder().addComponents(titleInput),
    new ActionRowBuilder().addComponents(messageInput),
    new ActionRowBuilder().addComponents(logoInput),
    new ActionRowBuilder().addComponents(bannerInput),
    new ActionRowBuilder().addComponents(footerInput)
  );

  return interaction.showModal(modal);
}
if (interaction.commandName === "say") {
  const allowedRole = "1448328583020941423";

  const isAdmin = interaction.member.permissions.has("Administrator");
  const hasRole = interaction.member.roles.cache.has(allowedRole);

  if (!isAdmin && !hasRole) {
    return interaction.reply({
      content: "❌ No permission.",
      ephemeral: true
    });
  }

  const channel = interaction.options.getChannel("channel");
  const content = interaction.options.getString("message");

  if (!channel || !channel.isTextBased()) {
    return interaction.reply({
      content: "❌ Please select a text channel.",
      ephemeral: true
    });
  }

  await channel.send({
    content,
    allowedMentions: {
      parse: ["users", "roles", "everyone"]
    }
  });
log(
  `[SAY COMMAND] ${interaction.user.tag} (${interaction.user.id}) sent a message in #${channel.name}: ${content}`
);
  return interaction.reply({
    content: `✅ Message sent to ${channel}.`,
    ephemeral: true
  });
}
if (interaction.commandName === "reply") {

  const allowedRole = "1448328583020941423";

  if (!interaction.member.roles.cache.has(allowedRole)) {
    return interaction.reply({
      content: "❌ No permission.",
      ephemeral: true
    });
  }

  const link = interaction.options.getString("message_link");
  const content = interaction.options.getString("content");

  try {

    const match = link.match(/channels\/(\d+)\/(\d+)\/(\d+)/);

    if (!match) {
      return interaction.reply({
        content: "❌ Invalid message link.",
        ephemeral: true
      });
    }

    const channelId = match[2];
    const messageId = match[3];

    const channel = await client.channels.fetch(channelId);

    const targetMessage = await channel.messages.fetch(messageId);

    await targetMessage.reply(content);
log(
  `[SAY COMMAND] ${interaction.user.tag} (${interaction.user.id}) sent a message in #${channel.name}: ${content}`
);
    await interaction.reply({
      content: "✅ Reply sent.",
      ephemeral: true
    });

  } catch (err) {

    console.error(err);

    interaction.reply({
      content: "❌ Failed to send reply.",
      ephemeral: true
    });

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
        log(`Verify button clicked by: ${interaction.user.tag}`);
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
    const logChannel = interaction.guild.channels.cache.get(config.LOG_CHANNEL_ID);

    if (logChannel) {
      logChannel.send({
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
        log(`Modal submitted by: ${interaction.user.tag}`);
        log(`Username entered: ${username}`);
        const logChannel = interaction.guild.channels.cache.get(config.LOG_CHANNEL_ID);
        if (logChannel) {
            logChannel.send({
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
