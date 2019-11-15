var watch = require("recursive-watch");
var ab = require("./audiobook");

watch("audiobooks", function(filename) {
  console.log("something changed with", filename);
  if (filename.endsWith(".m4b")) {
    console.log("m4b found");
    ab.importFile(filename);
  }
});
