const app = require("./src/index");
module.exports.start = (event, context, callback) => {
  try {
    const isInLambda = !!process.env.LAMBDA_TASK_ROOT;
    if (isInLambda) {
      console.log({ event, context });
      console.log("You are into lambda!");
    }
    app.start({ isInLambda, callback, aws_params: event });
    callback(null, "Process successfully finished");
  } catch (error) {
    callback("Process finished with error:", error);
  }
};
