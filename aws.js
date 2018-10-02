const app = require("./src/index");
module.exports.start = (event, context, callback) => {
  try {
    const isInLambda = !!process.env.LAMBDA_TASK_ROOT;
    if (isInLambda) console.log("You are into lambda!");
    app.start(callback);
    callback(null, "Process successfully finished");
  } catch (error) {
    callback("Process finished with error:", error);
  }
};
