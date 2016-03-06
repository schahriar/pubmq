var fs = require('fs');
var path = require('path');

// Make sure we don't run tests in production (will flush database)
if (process.env.NODE_ENV === "production") {
  throw new Error("You shouldn't run these tests in a production environment.");
}

// Set Test Globals
global.PubMQ = require("../pubmq.js");
global.server = new PubMQ.Server();
global.expect = require("chai").expect;
global.debug = false;
global.SAMPLES = [];
global.log = function() {
  var args = [];
  for (var i = 0; i < arguments.length; i++) {
    args.push(arguments[i]);
  }
  // Unshift Mocha Space + Delim
  args.unshift("    - ");
  setImmediate(function() {
    console.log.apply(console, args);
  });
};

// Test Cache
var TestCache = [];

// Cache All Tests
fs.readdirSync(__dirname).forEach(function(file) {
  if (file === 'runner.js') return;
  if (path.extname(file) === '.js') {
    // Read Order & Push to Cache (improve to read first line instead of whole file)
    var testPath = path.resolve(__dirname, file);
    var buff = fs.readFileSync(testPath, 'utf8');
    var pos = 4;
    var orderStr = "";
    while ((buff[pos] !== " ") && (buff[pos] !== "\n") && (pos < 10)) {
      orderStr += buff[pos];
      pos++;
    }
    var order = parseInt(orderStr, 10);
    TestCache.push({
      path: testPath,
      order: order
    });
  }
});

// Sort Tests based on first comment line 
TestCache.sort(function(a, b) {
  return a.order - b.order;
});

// Launch Tests
TestCache.forEach(function(test) {
  require(test.path);
});