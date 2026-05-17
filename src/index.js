const { Client, GatewayIntentBits } = require("discord.js");
const config = require("./config");

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