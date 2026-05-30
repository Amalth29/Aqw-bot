const { Client, GatewayIntentBits, SlashCommandBuilder } = require("discord.js");
const config = require("./config");
const cors = require("cors");
// pinging the bot to keep it alive
const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const guildRosterPath = path.join(DATA_DIR, "guildRoster.json");
const memoriesPath = path.join(DATA_DIR, "memories.json");

app.get("/memories", (req, res) => {
  if (!fs.existsSync(memoriesPath)) {
    return res.json([]);
  }

  const memories = JSON.parse(fs.readFileSync(memoriesPath, "utf8"));

  res.json(memories);
});

app.get("/", (req, res) => {
  res.send("Stormforged bot API is running.");
});

app.get("/guild-roster", (req, res) => {
  if (!fs.existsSync(guildRosterPath)) {
    return res.status(404).json({
      error: "No guild roster found. Run /guildsync first."
    });
  }

  const data = JSON.parse(fs.readFileSync(guildRosterPath, "utf8"));

  res.json(data);
});



app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});

app.get("/", (req, res) => res.send("OK"));
app.get("/ping", (req, res) => res.send("OK"));


app.listen(PORT, "0.0.0.0", () => {
  console.log(`Keep-alive server running on port ${PORT}`);
});
//
const client = new Client({

  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildEmojisAndStickers
  ]
});
function log(message) {
  const timestamp = new Date().toLocaleString();
  console.log(`[${timestamp}] ${message}`);
}
client.on("error", (err) => {
  console.error("Client error:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled promise rejection:", err);
});

require("./handlers/commands")(client);
require("./handlers/interactions")(client);
require("./handlers/logging")(client);
require("./handlers/automod")(client);

client.once("ready", async () => {
  log(`Logged in as ${client.user.tag}`);

await client.application.commands.create({
  name: "announce",
  description: "Send an announcement embed",
  options: [
    {
      name: "channel",
      description: "Channel to send announcement",
      type: 7,
      required: true
    },
  ]
});

await client.application.commands.create({
  name: "editannounce",
  description: "Edit an existing announcement embed",
  options: [
    {
      name: "channel",
      description: "Channel where announcement is",
      type: 7,
      required: true
    },
    {
      name: "message_id",
      description: "Message ID of the announcement",
      type: 3,
      required: true
    },
  ]
});
await client.application.commands.create({
  name: "guildroster",
  description: "Display the saved guild roster"
});
await client.application.commands.create({
  name: "guildsync",
  description: "Upload and sync AQW guild member list",
  options: [
    {
      name: "file",
      description: "Upload guild_members.txt",
      type: 11,
      required: true
    }
  ]
});
await client.application.commands.create({
  name: "addmemory",
  description: "Add a guild memory image to the website gallery",
  options: [
    {
      name: "image",
      description: "The image to add",
      type: 11, // Attachment
      required: true
    },
    {
      name: "title",
      description: "Memory title",
      type: 3, // String
      required: false
    }
  ]
});
console.log(`✅ Registered command: ${cmd.name}`);
await client.application.commands.create({
  name: "exportrole",
  description: "Export all users with a specific role",
  options: [
    {
      name: "role",
      description: "Role to export",
      type: 8,
      required: true
    }
  ]
});
await client.application.commands.create({
  name: "say",
  description: "Send a message as the bot to a selected channel",
  options: [
    {
      name: "channel",
      description: "Channel to send the message in",
      type: 7,
      required: true
    },
    {
      name: "message",
      description: "Message content",
      type: 3,
      required: true
    }
  ]
});

  await client.application.commands.create({
  name: "reply",
  description: "Reply to a message as the bot",
  options: [
    {
      name: "message_link",
      description: "Discord message link",
      type: 3,
      required: true
    },
    {
      name: "content",
      description: "Reply content",
      type: 3,
      required: true
    }
  ]
});
  await client.application.commands.create({
    name: "ping",
    description: "Test command"
  });

  await client.application.commands.create({
    name: "calendar",
    description: "Shows the AQW boost calendar for May 2026"
  });

  
});

client.login(config.TOKEN);

console.log("TOKEN:", process.env.TOKEN);