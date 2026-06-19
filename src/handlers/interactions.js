const {
  Events,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextInputStyle,
  ActionRowBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");
const { v2: cloudinary } = require("cloudinary");

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "../data");
const memoriesPath = path.join(DATA_DIR, "memories.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const guildRosterPath = path.join(DATA_DIR, "guildRoster.json");
const calendarDataPath = path.join(DATA_DIR, "artix_calendar.json");

const config = require("../config");
const embeds = require("../utils/embeds");
const { verifyUser } = require("./verification");
function log(message) {
  const timestamp = new Date().toLocaleString();

  console.log(`[${timestamp}] ${message}`);
}

// ---------------------------------------------------------------------
// AQW boost calendar helpers
// ---------------------------------------------------------------------

// Order matters: more specific patterns should come before generic ones.
// "ALL" is now a real category — it matches the literal "Double ALL Boost"
// event, not a synthetic merge of multiple boosts on the same day.
const BOOST_CATEGORY_RULES = [
  { code: "ALL", pattern: /\ball\b/i },
  { code: "MW", pattern: /mid-?week/i },
  { code: "Keys", pattern: /keys/i },
  { code: "Ess", pattern: /essence|totem/i },
  { code: "CP", pattern: /class\s*points?|\bcp\b/i },
  { code: "Gold", pattern: /gold/i },
  { code: "EXP", pattern: /\bexp\b|experience|\bxp\b/i },
  { code: "Rep", pattern: /\brep\b|reputation/i },
  // Catch-all for boosts Artix hasn't revealed yet, e.g.
  // "Unidentified 34 & 35 Boost" — abbreviates the long title.
  { code: "Unk", pattern: /unidentified/i },
];

// Emoji + display label for each code, used to render the legend.
const CATEGORY_INFO = {
  ALL: { emoji: "🟣", label: "ALL" },
  Keys: { emoji: "🔑", label: "Keys" },
  Ess: { emoji: "✨", label: "Essence+Totem" },
  CP: { emoji: "🔵", label: "Class Points" },
  Gold: { emoji: "🟡", label: "Gold" },
  EXP: { emoji: "⚡", label: "EXP" },
  Rep: { emoji: "🟢", label: "Reputation" },
  MW: { emoji: "🛠️", label: "Mid-Week" },
  Unk: { emoji: "❓", label: "Unk – Uni 34+35" },
};

function categorizeTitle(title) {
  for (const rule of BOOST_CATEGORY_RULES) {
    if (rule.pattern.test(title)) return rule.code;
  }
  return null;
}

// Returns the display code for a day's events. Each distinct boost
// category found that day is kept and joined together (e.g. "Keys + EXP")
// instead of being collapsed into a synthetic "ALL" the moment a day has
// more than one boost.
function categorizeDay(events) {
  const codes = [];

  for (const ev of events) {
    const code = categorizeTitle(ev.title || "") || "Unk";
    if (!codes.includes(code)) codes.push(code);
  }

  if (codes.length === 0) return "?";
  return codes.join(" + ");
}

// Builds the legend from whatever categories actually appear in dayMap
// for the month being displayed — nothing hardcoded.
function calendarLegendText(dayMap) {
  const used = new Set();

  for (const info of Object.values(dayMap)) {
    for (const code of info.code.split(" + ")) {
      if (CATEGORY_INFO[code]) used.add(code);
    }
  }

  const orderedCodes = BOOST_CATEGORY_RULES
    .map(rule => rule.code)
    .filter(code => used.has(code));

  if (orderedCodes.length === 0) return "No boost data for this month.";

  return orderedCodes
    .map(code => `${CATEGORY_INFO[code].emoji} **${CATEGORY_INFO[code].label}**`)
    .join(" • ");
}

// Buckets the days of a month into Sunday→Saturday weeks. Only days
// present in dayMap (i.e. days that actually have a boost) get included.
function groupDaysIntoWeeks(year, month, dayMap) {
  const totalDays = new Date(year, month, 0).getDate();
  const weeks = [];
  let current = [];

  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(year, month - 1, day);
    if (dayMap[day]) {
      current.push({ day, ...dayMap[day] });
    }
    const isSaturday = date.getDay() === 6;
    const isLastDayOfMonth = day === totalDays;
    if (isSaturday || isLastDayOfMonth) {
      if (current.length > 0) weeks.push(current);
      current = [];
    }
  }

  return weeks;
}

// Reads artix_calendar.json and returns { [day]: { events: [...] } } for
// the requested month/year.
function getEventsForMonth(year, month) {
  if (!fs.existsSync(calendarDataPath)) return {};

  let all;
  try {
    all = JSON.parse(fs.readFileSync(calendarDataPath, "utf8"));
  } catch (err) {
    console.error("[calendar] Failed to parse artix_calendar.json:", err);
    return {};
  }

  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  const dayMap = {};

  for (const entry of all) {
    if (!entry.date || !entry.date.startsWith(prefix)) continue;
    if (!entry.events || entry.events.length === 0) continue;
    const day = parseInt(entry.date.split("-")[2], 10);
    if (Number.isNaN(day)) continue;
    dayMap[day] = { events: entry.events };
  }

  return dayMap;
}

// Builds the embed + Prev/Next button row for a given month/year.
// Returns { embed: null, row: null, monthName } if there's no data,
// so callers can decide how to message that (reply vs ephemeral follow-up).
function buildCalendarPayload(year, month) {
  const monthName = new Date(year, month - 1, 1).toLocaleString("en-US", { month: "long" });

  const rawDayMap = getEventsForMonth(year, month);

  const dayMap = {};
  for (const [day, data] of Object.entries(rawDayMap)) {
    dayMap[day] = { code: categorizeDay(data.events) };
  }

  const weeks = groupDaysIntoWeeks(year, month, dayMap);

  if (weeks.length === 0) {
    return { embed: null, row: null, monthName };
  }

  const formatWeek = (items) =>
    "```text\n" +
    items.map(i => `${String(i.day).padEnd(2)}  ${i.code}`).join("\n") +
    "\n```";

  const embed = new EmbedBuilder()
    .setTitle(`📅 AQW Boost Calendar — ${monthName} ${year}`)
    .setColor(0x3b82f6)
    .setDescription("Monthly AQW boost schedule.")
    .addFields(
      ...weeks.map((week, i) => ({
        name: `Week ${i + 1}`,
        value: formatWeek(week),
        inline: true,
      })),
      {
        name: "Legend",
        value: calendarLegendText(dayMap),
        inline: false,
      }
    )
    .setFooter({ text: "AQW Calendar" })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`calendar_prev_${year}_${month}`)
      .setLabel("◀ Prev")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId(`calendar_next_${year}_${month}`)
      .setLabel("Next ▶")
      .setStyle(ButtonStyle.Primary)
  );

  return { embed, row, monthName };
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
if (interaction.commandName === "addmemory") {
  const allowedRole = "1448328583020941423";

  const isAdmin = interaction.member.permissions.has("Administrator");
  const hasRole = interaction.member.roles.cache.has(allowedRole);

  if (!isAdmin && !hasRole) {
    return interaction.reply({
      content: "❌ No permission.",
      ephemeral: true
    });
  }

  await interaction.deferReply({ ephemeral: true });

  const image = interaction.options.getAttachment("image");
  const title = interaction.options.getString("title") || "Stormforged Memory";
  const category = interaction.options.getString("category");
  const pinned = interaction.options.getBoolean("pinned") ?? false;
  const description = interaction.options.getString("description") || "";
  if (!image.contentType?.startsWith("image/")) {
    return interaction.editReply("❌ Please upload an image file.");
  }

  const uploaded = await cloudinary.uploader.upload(image.url, {
    folder: "stormforged-memories"
  });

  const memories = fs.existsSync(memoriesPath)
    ? JSON.parse(fs.readFileSync(memoriesPath, "utf8"))
    : [];

  memories.unshift({
  id: Date.now().toString(),
  title,
  description,
  imageUrl: uploaded.secure_url,
  publicId: uploaded.public_id,
  category,
  pinned,
  uploadedBy: interaction.user.tag,
  uploadedAt: new Date().toISOString()
});

  fs.writeFileSync(memoriesPath, JSON.stringify(memories, null, 2));

  return interaction.editReply("✅ Memory added to website gallery.");
}

if (interaction.commandName === "deletememory") {
  const allowedRole = "1448328583020941423";

  const isAdmin = interaction.member.permissions.has("Administrator");
  const hasRole = interaction.member.roles.cache.has(allowedRole);

  if (!isAdmin && !hasRole) {
    return interaction.reply({
      content: "❌ No permission.",
      ephemeral: true
    });
  }

  await interaction.deferReply({ ephemeral: true });

  const memoryId = interaction.options.getString("id");

  if (!fs.existsSync(memoriesPath)) {
    return interaction.editReply("❌ No memories found.");
  }

  const memories = JSON.parse(fs.readFileSync(memoriesPath, "utf8"));

  const memory = memories.find(m => m.id === memoryId);

  if (!memory) {
    return interaction.editReply("❌ Memory not found with that ID.");
  }

  const updatedMemories = memories.filter(m => m.id !== memoryId);

  fs.writeFileSync(memoriesPath, JSON.stringify(updatedMemories, null, 2));

  if (memory.publicId) {
    await cloudinary.uploader.destroy(memory.publicId).catch(() => {});
  }

  return interaction.editReply(`✅ Deleted memory: **${memory.title || memory.id}**`);
}

if (interaction.commandName === "listmemories") {
  const allowedRole = "1448328583020941423";

  const isAdmin = interaction.member.permissions.has("Administrator");
  const hasRole = interaction.member.roles.cache.has(allowedRole);

  if (!isAdmin && !hasRole) {
    return interaction.reply({
      content: "❌ No permission.",
      ephemeral: true
    });
  }

  if (!fs.existsSync(memoriesPath)) {
    return interaction.reply({
      content: "❌ No memories found.",
      ephemeral: true
    });
  }

  const memories = JSON.parse(fs.readFileSync(memoriesPath, "utf8"));

  if (!memories.length) {
    return interaction.reply({
      content: "❌ No memories found.",
      ephemeral: true
    });
  }

  const list = memories
    .slice(0, 20)
    .map((m, index) => {
      return (
        `**${index + 1}. ${m.title || "Untitled"}**\n` +
        `ID: \`${m.id}\`\n` +
        `By: ${m.uploadedBy || "Unknown"}`
      );
    })
    .join("\n\n");

  return interaction.reply({
    content: `📸 **Website Memories**\n\n${list}`,
    ephemeral: true
  });
}

if (interaction.isChatInputCommand()) {
  if (interaction.commandName === "exportrole") {
  const fs = require("fs");
  const path = require("path");
  const { AttachmentBuilder } = require("discord.js");

  const allowedRole = "1448328583020941423";

  const isAdmin = interaction.member.permissions.has("Administrator");
  const hasRole = interaction.member.roles.cache.has(allowedRole);

  if (!isAdmin && !hasRole) {
    return interaction.reply({
      content: "❌ No permission.",
      ephemeral: true
    });
  }

  await interaction.deferReply({ ephemeral: true });

  const role = interaction.options.getRole("role");

  await interaction.guild.members.fetch();

  const members = role.members
    .map(member => {
      return {
        discordName: member.user.tag,
        nickname: member.nickname || "No Nickname",
        id: member.id
      };
    })
    .sort((a, b) => a.nickname.localeCompare(b.nickname));

  let content = "";
  content += `Role Export: ${role.name}\n`;
  content += `Total Members: ${members.length}\n`;
  content += `========================================\n\n`;

  for (const member of members) {
    content += `Nickname: ${member.nickname}\n`;
    content += `Discord: ${member.discordName}\n`;
    content += `ID: ${member.id}\n`;
    content += `----------------------------------------\n`;
  }

  const exportDir = path.join(DATA_DIR, "exports");

  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir);
  }

  const filePath = path.join(exportDir, `role_export_${Date.now()}.txt`);

  fs.writeFileSync(filePath, content);

  const attachment = new AttachmentBuilder(filePath);

  return interaction.editReply({
    content: `✅ Exported ${members.length} users from ${role}.`,
    files: [attachment]
  });
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
  const now = new Date();
  const month = interaction.options.getInteger("month") ?? now.getMonth() + 1;
  const year = interaction.options.getInteger("year") ?? now.getFullYear();

  const { embed, row, monthName } = buildCalendarPayload(year, month);

  if (!embed) {
    return interaction.reply({
      content:
        `❌ No boost data found for ${monthName} ${year}. ` +
        `Has the calendar data been uploaded yet? Use \`/calendarupdate\`.`,
      ephemeral: true
    });
  }

  return interaction.reply({ embeds: [embed], components: [row] });
}

if (interaction.commandName === "calendarupdate") {
  const allowedRole = "1448328583020941423";

  const isAdmin = interaction.member.permissions.has("Administrator");
  const hasRole = interaction.member.roles.cache.has(allowedRole);

  if (!isAdmin && !hasRole) {
    return interaction.reply({
      content: "❌ No permission.",
      ephemeral: true
    });
  }

  const attachment = interaction.options.getAttachment("file");

  if (!attachment.name.toLowerCase().endsWith(".json")) {
    return interaction.reply({
      content: "❌ Please upload the `artix_calendar.json` file.",
      ephemeral: true
    });
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const response = await fetch(attachment.url);
    const text = await response.text();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      return interaction.editReply("❌ That file isn't valid JSON.");
    }

    if (!Array.isArray(parsed)) {
      return interaction.editReply("❌ Expected a JSON array of {date, events}.");
    }

    fs.writeFileSync(calendarDataPath, JSON.stringify(parsed, null, 2));

    const totalEvents = parsed.reduce((sum, d) => sum + (d.events?.length || 0), 0);

    return interaction.editReply(
      `✅ Calendar data updated: ${parsed.length} days, ${totalEvents} events loaded.`
    );
  } catch (err) {
    console.error("[calendarupdate]", err);
    return interaction.editReply(`❌ Failed to update calendar data: ${err.message}`);
  }
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
if (interaction.commandName === "guildroster") {
  const fs = require("fs");
  const path = require("path");
  const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");


  if (!fs.existsSync(guildRosterPath)) {
    return interaction.reply({
      content: "❌ No roster saved yet. Use `/guildsync` first.",
      ephemeral: true
    });
  }

  const data = JSON.parse(fs.readFileSync(guildRosterPath, "utf8"));
  const members = data.members || [];

  const page = 0;
  const totalPages = Math.ceil(members.length / 15);

  const embed = new EmbedBuilder()
    .setTitle("📋 Stormforged Guild Roster")
    .setColor(0x5865F2)
    .addFields(
      { name: "👥 Total Members", value: `${members.length}`, inline: true },
      {
        name: `📖 Full Roster — Page ${page + 1}/${totalPages}`,
        value: formatMemberTable(members, page),
        inline: false
      }
    )
    .setFooter({ text: "Stormforged Guild Monitor" })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`guild_roster_prev_${page}`)
      .setLabel("Previous")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),

    new ButtonBuilder()
      .setCustomId(`guild_roster_next_${page}`)
      .setLabel("Next")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(totalPages <= 1)
  );

  return interaction.reply({
    embeds: [embed],
    components: [row]
  });
}
function getInactiveMembers(members, days = 15) {
  const now = new Date();
  const inactive = [];

  for (const member of members) {
    const status = member.status;

    // Ignore online server names like Artix/Safiria/Yorumi
    if (!/^\d{4}-\d{2}-\d{2}$/.test(status)) continue;

    const lastOnline = new Date(status);
    const diffDays = Math.floor((now - lastOnline) / (1000 * 60 * 60 * 24));

    if (diffDays >= days) {
      inactive.push({
        ...member,
        inactiveDays: diffDays
      });
    }
  }

  return inactive.sort((a, b) => b.inactiveDays - a.inactiveDays);
}
if (interaction.commandName === "guildsync") {
  const fs = require("fs");
  const path = require("path");
  const { EmbedBuilder } = require("discord.js");

  const allowedRole = "1448328583020941423";

  const isAdmin = interaction.member.permissions.has("Administrator");
  const hasRole = interaction.member.roles.cache.has(allowedRole);

  if (!isAdmin && !hasRole) {
    return interaction.reply({
      content: "❌ No permission.",
      ephemeral: true
    });
  }

  const attachment = interaction.options.getAttachment("file");

  if (!attachment.name.endsWith(".txt")) {
    return interaction.reply({
      content: "❌ Please upload a `.txt` file.",
      ephemeral: true
    });
  }

  await interaction.deferReply();

  const response = await fetch(attachment.url);
  const text = await response.text();

  

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
  }

  function parseGuildFile(text) {
    const lines = text.split(/\r?\n/);

    const members = [];

    for (const line of lines) {
      const trimmed = line.trim();

      if (
        !trimmed ||
        trimmed.startsWith("Guild Members") ||
        trimmed.startsWith("-") ||
        trimmed.startsWith("Name") ||
        trimmed.startsWith("Total Members")
      ) {
        continue;
      }

      const match = trimmed.match(/^(.+?)\s+(Leader|Officer|Member)\s+(\d+)\s+(.+)$/i);

      if (!match) continue;

      members.push({
        name: match[1].trim(),
        rank: match[2].trim(),
        level: Number(match[3]),
        status: match[4].trim()
      });
    }

    return members;
  }

  function keyName(name) {
    return name.toLowerCase().trim();
  }

  const newMembers = parseGuildFile(text);
  const inactiveMembers = getInactiveMembers(newMembers, 15);

const inactiveChannel = interaction.guild.channels.cache.get(
  config.INACTIVE_LOG_CHANNEL_ID
);

if (inactiveChannel && inactiveMembers.length > 0) {
  const list = inactiveMembers
    .slice(0, 30)
    .map(m => `• **${m.name}** — Lv ${m.level} — ${m.inactiveDays} days inactive`)
    .join("\n");

  const embed = new EmbedBuilder()
    .setTitle("🕒 Inactive Guild Members")
    .setColor(0xED4245)
    .setDescription(list)
    .setFooter({
      text: `Showing ${Math.min(inactiveMembers.length, 30)} of ${inactiveMembers.length} inactive members`
    })
    .setTimestamp();

  await inactiveChannel.send({ embeds: [embed] });
}

  const oldData = fs.existsSync(guildRosterPath)
    ? JSON.parse(fs.readFileSync(guildRosterPath, "utf8"))
    : { members: [] };

  const oldMembers = oldData.members || [];

  const oldMap = new Map(oldMembers.map(m => [keyName(m.name), m]));
  const newMap = new Map(newMembers.map(m => [keyName(m.name), m]));

  const joined = [];
  const removed = [];
  const rankChanged = [];
  const levelChanged = [];
  const statusChanged = [];

  for (const member of newMembers) {
    const old = oldMap.get(keyName(member.name));

    if (!old) {
      joined.push(member);
      continue;
    }

    if (old.rank !== member.rank) {
      rankChanged.push({ old, current: member });
    }

    if (old.level !== member.level) {
      levelChanged.push({ old, current: member });
    }

    if (old.status !== member.status) {
      statusChanged.push({ old, current: member });
    }
  }

  for (const member of oldMembers) {
    if (!newMap.has(keyName(member.name))) {
      removed.push(member);
    }
  }

  const savedData = {
    syncedAt: new Date().toISOString(),
    totalMembers: newMembers.length,
    members: newMembers
  };

  fs.writeFileSync(guildRosterPath, JSON.stringify(savedData, null, 2));

  function listNames(arr, limit = 10) {
    if (arr.length === 0) return "None";

    return arr
      .slice(0, limit)
      .map(m => `• ${m.name} — ${m.rank}, Lv ${m.level}, ${m.status}`)
      .join("\n") + (arr.length > limit ? `\n…and ${arr.length - limit} more` : "");
  }

  const page = 0;
const totalPages = Math.ceil(newMembers.length / 15);

const embed = new EmbedBuilder()
  .setTitle("✅ Guild Roster Synced")
  .setColor(0x57F287)
  .addFields(
    { name: "👥 Total Members", value: `${newMembers.length}`, inline: true },
    { name: "🆕 New Members", value: `${joined.length}`, inline: true },
    { name: "🚪 Removed Members", value: `${removed.length}`, inline: true }
  )
  .setFooter({ text: "Use /guildroster to view the full roster" })
  .setTimestamp();

return interaction.editReply({
  embeds: [embed],
  components: []
});
}
function formatMemberTable(members, page = 0, perPage = 15) {
  if (!members.length) return "No members found.";

  const start = page * perPage;
  const pageMembers = members.slice(start, start + perPage);

const rows = pageMembers.map(m => {
  const name =
    m.name.length > 18
      ? m.name.slice(0, 17) + "…"
      : m.name;

  return (
    name.padEnd(20, " ") +
    m.rank.padEnd(10, " ") +
    String(m.level)
  );
});

return (
  "```text\n" +
  "Name                Rank      Lv\n" +
  "--------------------------------------\n" +
  rows.join("\n") +
  "\n```"
);
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
      if (
        interaction.customId.startsWith("calendar_prev_") ||
        interaction.customId.startsWith("calendar_next_")
      ) {
        // customId shape: calendar_<prev|next>_<year>_<month>
        const parts = interaction.customId.split("_");
        const direction = parts[1];
        const year = Number(parts[2]);
        const month = Number(parts[3]);

        let newYear = year;
        let newMonth = direction === "next" ? month + 1 : month - 1;

        if (newMonth > 12) {
          newMonth = 1;
          newYear += 1;
        } else if (newMonth < 1) {
          newMonth = 12;
          newYear -= 1;
        }

        const { embed, row, monthName } = buildCalendarPayload(newYear, newMonth);

        if (!embed) {
          return interaction.reply({
            content: `❌ No boost data found for ${monthName} ${newYear}.`,
            ephemeral: true
          });
        }

        return interaction.update({
          embeds: [embed],
          components: [row]
        });
      }

      if (
  interaction.customId.startsWith("guild_roster_next_") ||
  interaction.customId.startsWith("guild_roster_prev_")
) {
  const fs = require("fs");
  const path = require("path");
  const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

  
  const data = JSON.parse(fs.readFileSync(guildRosterPath, "utf8"));

  const members = data.members || [];
  const totalPages = Math.ceil(members.length / 15);

  const parts = interaction.customId.split("_");
  const direction = parts[2];
  const currentPage = Number(parts[3]);

  let newPage = direction === "next" ? currentPage + 1 : currentPage - 1;

  if (newPage < 0) newPage = 0;
  if (newPage >= totalPages) newPage = totalPages - 1;

  const embed = new EmbedBuilder()
    .setTitle("📋 Stormforged Guild Roster")
    .setColor(0x5865F2)
    .addFields(
      { name: "👥 Total Members", value: `${members.length}`, inline: true },
      {
        name: `📖 Full Roster — Page ${newPage + 1}/${totalPages}`,
        value: formatMemberTable(members, newPage),
        inline: false
      }
    )
    .setFooter({ text: "Stormforged Guild Monitor" })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`guild_roster_prev_${newPage}`)
      .setLabel("Previous")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(newPage === 0),

    new ButtonBuilder()
      .setCustomId(`guild_roster_next_${newPage}`)
      .setLabel("Next")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(newPage >= totalPages - 1)
  );

  return interaction.update({
    embeds: [embed],
    components: [row]
  });
}
      
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
