module.exports = {
  "LOG_LEVEL": process.env.LOG_LEVEL || "debug",
  "CONNECTION_STRING": process.env.CONNECTION_STRING || "mongodb://localhost:27017/user-management",
  "PORT": process.env.PORT || 3000,
  "JWT":{
    "SECRET": process.env.JWT_SECRET || "1234567890abcdef",
    "EXPIRATION_TIME": !isNaN(parseInt(process.env.EXPIRATION_TIME)) ? parseInt(process.env.EXPIRATION_TIME) : 86400
  },
  "DEFAULT_LANGUAGE": process.env.DEFAULT_LANGUAGE || "EN",
};
