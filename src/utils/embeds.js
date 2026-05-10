const { EmbedBuilder } = require("discord.js");
const config = require("../config");

module.exports = {
  dashboard() {
    return new EmbedBuilder()
      .setTitle("🛡️ Stormforged Verification Center")
      .setDescription(
        "**Welcome to Stormforged.**\n\n" +
        "Click the button below to verify your AdventureQuest Worlds account.\n\n" 
        
      )
      .setColor(0x5865F2)
      .setFooter({ text: "Stormforged Verification System" })
      .setTimestamp();
  },

  success(username) {
    return new EmbedBuilder()
      .setTitle("✅ Verification Complete")
      .setDescription(`You have successfully verified as **${username}**.`)
      .addFields(
        { name: "Status", value: "Verified", inline: true },
        { name: "Game", value: "AdventureQuest Worlds", inline: true }
      )
      .setColor(0x57F287)
      .setFooter({ text: "Stormforged Verification System" })
      .setTimestamp();
  },
welcomeLog(user, username, guild) {
  return new EmbedBuilder()
    .setTitle("📥 New Verified Member")
    .setDescription(`${user} has entered the server.`)
    .addFields(
      { name: "👤 Discord", value: user.tag, inline: true },
      { name: "🎮 AQW", value: username, inline: true },
      { name: "🏰 Guild", value: guild || "No Guild", inline: true }
    )
    .setColor(0x57F287)
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
    .setFooter({ text: "Stormforged Entry Log" })
    .setTimestamp();
},
  error(msg) {
    return new EmbedBuilder()
      .setTitle("❌ Verification Failed")
      .setDescription(msg)
      .setColor(0xED4245)
      .setFooter({ text: "Check spelling and try again" })
      .setTimestamp();
  },

  log(user, username, guild) {
  return new EmbedBuilder()
    .setTitle("🛡️ Stormforged Verification")
    .setDescription(`**${user.tag}** has successfully verified.`)
    .addFields(
      { name: "👤 Discord User", value: `${user}`, inline: true },
      { name: "🏷️ Discord Tag", value: user.tag, inline: true },
      { name: "🎮 AQW Username", value: username, inline: true },
      { name: "🏰 AQW Guild", value: guild || "No Guild", inline: true }
    )
    .setColor(0x5865F2)
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
    .setFooter({ text: "Stormforged Verification System" })
    .setTimestamp();
}
};