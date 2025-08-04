var express = require('express');
var router = express.Router();

const fs = require('fs');
let routes = fs.readdirSync(__dirname);

for (let route of routes) {
  if(route.includes(".js") && route !== 'index.js') {
    router.use("/" + route.replace('.js', ''), require('./' + route));
  }
}

try {
  console.log("✅ Routes loaded");
} catch (err) {
  console.error("❌ Routes failed:", err.message);
}


module.exports = router;