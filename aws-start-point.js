const app = require("./src/index");
module.exports.start = (event, context, callback) => {
  try {
    app.start();
    callback(null, "Process successfully finished");
  } catch (error) {
    callback("Process finished with error:", error);
  }
};
