require("dotenv").config();

const { v2: cloudinary } = require("cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
module.exports = {
  TOKEN: process.env.TOKEN,

  VERIFY_CHANNEL_ID: process.env.VERIFY_CHANNEL_ID,
  LOG_CHANNEL_ID: process.env.LOG_CHANNEL_ID,
  WELCOME_LOG_CHANNEL_ID: process.env.WELCOME_LOG_CHANNEL_ID,
  MAIN_CHAT_CHANNEL_ID: process.env.MAIN_CHAT_CHANNEL_ID,
  INACTIVE_LOG_CHANNEL_ID: process.env.INACTIVE_LOG_CHANNEL_ID,

  ROLES: {
    VERIFIED: "THUNDERSTORM⛈️",
    UNVERIFIED: "RAW STEEL"
  },

  COLORS: {
    MAIN: 0x5865F2,
    SUCCESS: 0x57F287,
    ERROR: 0xED4245
  }
};