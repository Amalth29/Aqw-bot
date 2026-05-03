const { EmbedBuilder } = require("discord.js");
const config = require("../config");

module.exports = {
  dashboard() {
    return new EmbedBuilder()
      .setTitle("🔐 Verification Dashboard")
      .setDescription("Click below to verify your AQW account.")
      .setColor(config.COLORS.MAIN);
  },

  success(username) {
    return new EmbedBuilder()
      .setTitle("✅ Verified")
      .setDescription(`Linked as **${username}**`)
      .setColor(config.COLORS.SUCCESS);
  },

  error(msg) {
    return new EmbedBuilder()
      .setTitle("❌ Error")
      .setDescription(msg)
      .setColor(config.COLORS.ERROR);
  }
};