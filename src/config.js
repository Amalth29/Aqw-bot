require("dotenv").config();

module.exports = {
  TOKEN: process.env.TOKEN,

  VERIFY_CHANNEL_ID: process.env.VERIFY_CHANNEL_ID,
  LOG_CHANNEL_ID: process.env.LOG_CHANNEL_ID,

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