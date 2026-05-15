const { Events, EmbedBuilder } = require("discord.js");
const config = require("../config");

module.exports = (client) => {
  log("✅ Full logging system loaded");
const recentLogs = new Set();

function isDuplicateLog(key) {
  if (recentLogs.has(key)) return true;

  recentLogs.add(key);

  setTimeout(() => {
    recentLogs.delete(key);
  }, 5000);

  return false;
}
  async function sendLog(guild, embed) {
    const logChannel = guild.channels.cache.get(config.LOG_CHANNEL_ID);
    if (!logChannel) return;

    await logChannel.send({ embeds: [embed] }).catch(console.error);
  }

  function baseEmbed(title, color = 0x5865f2) {
    return new EmbedBuilder()
      .setTitle(title)
      .setColor(color)
      .setTimestamp()
      .setFooter({ text: "Stormforged Logging System" });
  }

  // Message deleted
  client.on(Events.MessageDelete, async (message) => {
    if (!message.guild || message.author?.bot) return;

    const embed = baseEmbed("🗑️ Message Deleted", 0xed4245)
      .addFields(
        { name: "User", value: message.author ? `${message.author}` : "Unknown", inline: true },
        { name: "Channel", value: `${message.channel}`, inline: true },
        { name: "Message", value: message.content || "*No text content*" }
      );
const key = `delete-${message.id}`;

if (isDuplicateLog(key)) return; 
    await sendLog(message.guild, embed);
  });

  // Message edited
  client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
    if (!oldMessage.guild || oldMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;

    const embed = baseEmbed("✏️ Message Edited", 0xfee75c)
      .addFields(
        { name: "User", value: `${oldMessage.author}`, inline: true },
        { name: "Channel", value: `${oldMessage.channel}`, inline: true },
        { name: "Before", value: oldMessage.content || "*No text*" },
        { name: "After", value: newMessage.content || "*No text*" }
      );

    await sendLog(oldMessage.guild, embed);
  });

  // Member joined
  client.on(Events.GuildMemberAdd, async (member) => {
    const embed = baseEmbed("👋 Member Joined", 0x57f287)
      .addFields(
        { name: "User", value: `${member.user}`, inline: true },
        { name: "Tag", value: member.user.tag, inline: true },
        { name: "ID", value: member.id, inline: false }
      )
      .setThumbnail(member.user.displayAvatarURL());

    await sendLog(member.guild, embed);
  });

  // Member left
  client.on(Events.GuildMemberRemove, async (member) => {
    const embed = baseEmbed("🚪 Member Left", 0xed4245)
      .addFields(
        { name: "User", value: `${member.user}`, inline: true },
        { name: "Tag", value: member.user.tag, inline: true },
        { name: "ID", value: member.id, inline: false }
      )
      .setThumbnail(member.user.displayAvatarURL());

    await sendLog(member.guild, embed);
  });

  // Role + nickname updates
  client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    // Nickname change
    if (oldMember.nickname !== newMember.nickname) {
      const embed = baseEmbed("📝 Nickname Changed", 0x5865f2)
        .addFields(
          { name: "User", value: `${newMember.user}`, inline: true },
          { name: "Before", value: oldMember.nickname || "*None*", inline: true },
          { name: "After", value: newMember.nickname || "*None*", inline: true }
        );

      await sendLog(newMember.guild, embed);
    }

    // Role change
    const oldRoles = oldMember.roles.cache;
    const newRoles = newMember.roles.cache;

    const addedRoles = newRoles.filter(role => !oldRoles.has(role.id));
    const removedRoles = oldRoles.filter(role => !newRoles.has(role.id));

    if (addedRoles.size > 0 || removedRoles.size > 0) {
      const embed = baseEmbed("🎭 Role Update", 0x5865f2)
        .addFields(
          { name: "User", value: `${newMember.user}`, inline: true },
          {
            name: "Added Roles",
            value: addedRoles.map(r => `${r}`).join(", ") || "None",
            inline: false
          },
          {
            name: "Removed Roles",
            value: removedRoles.map(r => `${r}`).join(", ") || "None",
            inline: false
          }
        );

      await sendLog(newMember.guild, embed);
    }
  });

  // Ban added
  client.on(Events.GuildBanAdd, async (ban) => {
    const embed = baseEmbed("🔨 Member Banned", 0xed4245)
      .addFields(
        { name: "User", value: `${ban.user}`, inline: true },
        { name: "Tag", value: ban.user.tag, inline: true },
        { name: "Reason", value: ban.reason || "No reason provided" }
      );

    await sendLog(ban.guild, embed);
  });

  // Ban removed
  client.on(Events.GuildBanRemove, async (ban) => {
    const embed = baseEmbed("♻️ Member Unbanned", 0x57f287)
      .addFields(
        { name: "User", value: `${ban.user}`, inline: true },
        { name: "Tag", value: ban.user.tag, inline: true }
      );

    await sendLog(ban.guild, embed);
  });

  // Channel created
  client.on(Events.ChannelCreate, async (channel) => {
    if (!channel.guild) return;

    const embed = baseEmbed("📁 Channel Created", 0x57f287)
      .addFields(
        { name: "Channel", value: `${channel}`, inline: true },
        { name: "Name", value: channel.name, inline: true },
        { name: "ID", value: channel.id, inline: false }
      );

    await sendLog(channel.guild, embed);
  });

  // Channel deleted
  client.on(Events.ChannelDelete, async (channel) => {
    if (!channel.guild) return;

    const embed = baseEmbed("🗑️ Channel Deleted", 0xed4245)
      .addFields(
        { name: "Name", value: channel.name, inline: true },
        { name: "ID", value: channel.id, inline: false }
      );

    await sendLog(channel.guild, embed);
  });

  // Channel updated
  client.on(Events.ChannelUpdate, async (oldChannel, newChannel) => {
    if (!newChannel.guild) return;

    if (oldChannel.name === newChannel.name) return;

    const embed = baseEmbed("⚙️ Channel Updated", 0xfee75c)
      .addFields(
        { name: "Before", value: oldChannel.name, inline: true },
        { name: "After", value: newChannel.name, inline: true },
        { name: "Channel", value: `${newChannel}`, inline: false }
      );

    await sendLog(newChannel.guild, embed);
  });

  // Role created
  client.on(Events.GuildRoleCreate, async (role) => {
    const embed = baseEmbed("➕ Role Created", 0x57f287)
      .addFields(
        { name: "Role", value: `${role}`, inline: true },
        { name: "Name", value: role.name, inline: true },
        { name: "ID", value: role.id, inline: false }
      );

    await sendLog(role.guild, embed);
  });

  // Role deleted
  client.on(Events.GuildRoleDelete, async (role) => {
    const embed = baseEmbed("➖ Role Deleted", 0xed4245)
      .addFields(
        { name: "Name", value: role.name, inline: true },
        { name: "ID", value: role.id, inline: false }
      );

    await sendLog(role.guild, embed);
  });

  // Role updated
  client.on(Events.GuildRoleUpdate, async (oldRole, newRole) => {
    if (oldRole.name === newRole.name) return;

    const embed = baseEmbed("🎭 Role Updated", 0xfee75c)
      .addFields(
        { name: "Before", value: oldRole.name, inline: true },
        { name: "After", value: newRole.name, inline: true },
        { name: "Role", value: `${newRole}`, inline: false }
      );

    await sendLog(newRole.guild, embed);
  });

  // Emoji created
  client.on(Events.GuildEmojiCreate, async (emoji) => {
    const embed = baseEmbed("😀 Emoji Created", 0x57f287)
      .addFields(
        { name: "Emoji", value: `${emoji}`, inline: true },
        { name: "Name", value: emoji.name, inline: true },
        { name: "ID", value: emoji.id, inline: false }
      );

    await sendLog(emoji.guild, embed);
  });

  // Emoji deleted
  client.on(Events.GuildEmojiDelete, async (emoji) => {
    const embed = baseEmbed("😢 Emoji Deleted", 0xed4245)
      .addFields(
        { name: "Name", value: emoji.name, inline: true },
        { name: "ID", value: emoji.id, inline: false }
      );

    await sendLog(emoji.guild, embed);
  });

  // Emoji updated
  client.on(Events.GuildEmojiUpdate, async (oldEmoji, newEmoji) => {
    if (oldEmoji.name === newEmoji.name) return;

    const embed = baseEmbed("😀 Emoji Updated", 0xfee75c)
      .addFields(
        { name: "Before", value: oldEmoji.name, inline: true },
        { name: "After", value: newEmoji.name, inline: true },
        { name: "Emoji", value: `${newEmoji}`, inline: false }
      );

    await sendLog(newEmoji.guild, embed);
  });

  // Invite created
  client.on(Events.InviteCreate, async (invite) => {
    const embed = baseEmbed("🔗 Invite Created", 0x57f287)
      .addFields(
        { name: "Code", value: invite.code, inline: true },
        { name: "Channel", value: `${invite.channel}`, inline: true },
        { name: "Created By", value: invite.inviter ? `${invite.inviter}` : "Unknown", inline: false }
      );

    await sendLog(invite.guild, embed);
  });

  // Invite deleted
  client.on(Events.InviteDelete, async (invite) => {
    const embed = baseEmbed("❌ Invite Deleted", 0xed4245)
      .addFields(
        { name: "Code", value: invite.code, inline: true },
        { name: "Channel", value: invite.channel ? `${invite.channel}` : "Unknown", inline: true }
      );

    await sendLog(invite.guild, embed);
  });
};