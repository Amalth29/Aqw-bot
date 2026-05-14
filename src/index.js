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
  console.log(`Logged in as ${client.user.tag}`);

  await client.application.commands.create({
    name: "ping",
    description: "Test command"
  });

  await client.application.commands.create({
    name: "calendar",
    description: "Shows the AQW boost calendar for May 2026"
  });

  console.log("Slash commands registered");
});

client.login(config.TOKEN);

console.log("TOKEN:", process.env.TOKEN);