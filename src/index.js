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

require("./handlers/commands")(client);
require("./handlers/interactions")(client);
require("./handlers/logging")(client);

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  try {
    await client.application.commands.create({
      name: "ping",
      description: "Test command"
    });

    console.log("✅ Slash command registered");
  } catch (err) {
    console.error("❌ Failed to register slash command:", err);
  }
});

client.login(config.TOKEN);

console.log("TOKEN:", process.env.TOKEN);