const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const config = require("../config");

const userMessages = new Map();


module.exports = (client) => {
 const imageSpamMap = new Map();

function isImageAttachment(attachment) {
  return attachment.contentType?.startsWith("image/");
}
  client.on("messageCreate", async (message) => {
   
const hasImages =
  message.attachments.size > 0 ||
  message.embeds.some(embed =>
    embed.image ||
    embed.thumbnail ||
    embed.url?.match(/\.(png|jpg|jpeg|gif|webp)$/i)
  ) ||
  message.content.match(/\.(png|jpg|jpeg|gif|webp)/i);
if (hasImages) {
  const now = Date.now();
  const userId = message.author.id;

  if (!imageSpamMap.has(userId)) {
    imageSpamMap.set(userId, []);
  }

  const recentImages = imageSpamMap.get(userId);

  recentImages.push({
    messageId: message.id,
    channelId: message.channel.id,
    time: now
  });

  const filtered = recentImages.filter(item => now - item.time < 30000);
  imageSpamMap.set(userId, filtered);

  const uniqueChannels = new Set(filtered.map(item => item.channelId));

  if (filtered.length >= 2 && uniqueChannels.size >= 2) {
    for (const item of filtered) {
      const channel = message.guild.channels.cache.get(item.channelId);
      if (!channel) continue;

      const msg = await channel.messages.fetch(item.messageId).catch(() => null);
      if (msg) await msg.delete().catch(() => {});
    }

    await message.member.timeout(
      10 * 60 * 1000,
      "Possible hacked account image spam"
    ).catch(() => {});

    const logChannel = message.guild.channels.cache.get(config.LOG_CHANNEL_ID);

    if (logChannel) {
      logChannel.send(
        `🚨 Possible hacked account detected: ${message.author}\nReason: Image spam across multiple channels.`
      );
    }

    return;
  }
}

    if (!message.guild) return;
    if (message.author.bot) return;
    

    // Ignore admins
    if (message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return;
    }

    const now = Date.now();

    const content = message.content.toLowerCase();

    // Detect Discord invite links
    const hasInvite =
      content.includes("discord.gg/") ||
      content.includes("discord.com/invite/");

    // Track user messages
    if (!userMessages.has(message.author.id)) {
      userMessages.set(message.author.id, []);
    }

    const messages = userMessages.get(message.author.id);

   messages.push({
  content,
  channelId: message.channel.id,
  messageId: message.id,
  time: now
});

    // Keep only last 15 seconds
    const recent = messages.filter(
      m => now - m.time < 15000
    );

    userMessages.set(message.author.id, recent);

    // Count repeated messages
    const sameMessages = recent.filter(
      m => m.content === content
    );

    // Count different channels
    const channels = new Set(recent.map(m => m.channelId));

    // 🚨 Trigger conditions
    const spamDetected =
      sameMessages.length >= 5 ||
      (hasInvite && channels.size >= 3);

    if (!spamDetected) return;

    try {

      // Delete current message
     // Delete all recent spam messages
for (const msgData of sameMessages) {

  try {

    const channel = message.guild.channels.cache.get(msgData.channelId);

    if (!channel) continue;

    const fetchedMessage = await channel.messages.fetch(msgData.messageId)
      .catch(() => null);

    if (fetchedMessage) {
      await fetchedMessage.delete().catch(() => {});
    }

  } catch (err) {
    console.error("Failed to delete spam message:", err);
  }
}

      // Timeout user for 10 minutes
      await message.member.timeout(
        10 * 60 * 1000,
        "Possible hacked/spam account"
      );

      // Log channel
      const logChannel = message.guild.channels.cache.get(
        config.LOG_CHANNEL_ID
      );

      if (logChannel) {

        const embed = new EmbedBuilder()
          .setTitle("🚨 Possible Hacked Account Detected")
          .setColor(0xED4245)
          .addFields(
            {
              name: "User",
              value: `${message.author}`,
              inline: true
            },
            {
              name: "Reason",
              value: "Repeated spam / Discord invite spam",
              inline: true
            },
            {
              name: "Message",
              value: message.content.slice(0, 1000) || "No content"
            }
          )
          .setTimestamp();

        logChannel.send({
          embeds: [embed]
        });
      }

      // DM user
      await message.author.send(
        "⚠️ Your account was automatically timed out due to suspected spam/hacked-account behavior. Please contact staff if this was a mistake."
      ).catch(() => {});

    } catch (err) {
      console.error("Automod error:", err);
    }

  });

};