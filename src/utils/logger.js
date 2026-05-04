const { EmbedBuilder } = require("discord.js");
const config = require("../config");

async function sendLog(guild, embed) {
  const logChannel = guild.channels.cache.get(config.LOG_CHANNEL_ID);
  if (!logChannel) return;

  await logChannel.send({ embeds: [embed] }).catch(console.error);
}

function baseEmbed(title, color = 0x5865F2) {
  return new EmbedBuilder()
    .setTitle(title)
    .setColor(color)
    .setTimestamp()
    .setFooter({ text: "Stormforged Logging System" });
}

module.exports = {
  sendLog,
  baseEmbed
};