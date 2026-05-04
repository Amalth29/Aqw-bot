const { Events } = require("discord.js");
const { sendLog, baseEmbed } = require("../utils/logger");

module.exports = (client) => {
  client.on(Events.MessageDelete, async (message) => {
    if (!message.guild || message.author?.bot) return;

    const embed = baseEmbed("🗑️ Message Deleted", 0xED4245)
      .addFields(
        { name: "User", value: `${message.author}`, inline: true },
        { name: "Channel", value: `${message.channel}`, inline: true },
        { name: "Message", value: message.content || "*No text content*" }
      );

    sendLog(message.guild, embed);
  });

  client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
    if (!oldMessage.guild || oldMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;

    const embed = baseEmbed("✏️ Message Edited", 0xFEE75C)
      .addFields(
        { name: "User", value: `${oldMessage.author}`, inline: true },
        { name: "Channel", value: `${oldMessage.channel}`, inline: true },
        { name: "Before", value: oldMessage.content || "*No text*" },
        { name: "After", value: newMessage.content || "*No text*" }
      );

    sendLog(oldMessage.guild, embed);
  });

  client.on(Events.GuildMemberAdd, async (member) => {
    const embed = baseEmbed("👋 Member Joined", 0x57F287)
      .addFields(
        { name: "User", value: `${member.user}`, inline: true },
        { name: "Tag", value: member.user.tag, inline: true }
      )
      .setThumbnail(member.user.displayAvatarURL());

    sendLog(member.guild, embed);
  });

  client.on(Events.GuildMemberRemove, async (member) => {
    const embed = baseEmbed("🚪 Member Left", 0xED4245)
      .addFields(
        { name: "User", value: `${member.user}`, inline: true },
        { name: "Tag", value: member.user.tag, inline: true }
      )
      .setThumbnail(member.user.displayAvatarURL());

    sendLog(member.guild, embed);
  });

  client.on(Events.GuildBanAdd, async (ban) => {
    const embed = baseEmbed("🔨 Member Banned", 0xED4245)
      .addFields(
        { name: "User", value: `${ban.user}`, inline: true },
        { name: "Tag", value: ban.user.tag, inline: true },
        { name: "Reason", value: ban.reason || "No reason provided" }
      );

    sendLog(ban.guild, embed);
  });

  client.on(Events.GuildBanRemove, async (ban) => {
    const embed = baseEmbed("♻️ Member Unbanned", 0x57F287)
      .addFields(
        { name: "User", value: `${ban.user}`, inline: true },
        { name: "Tag", value: ban.user.tag, inline: true }
      );

    sendLog(ban.guild, embed);
  });
};