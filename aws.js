const isInLambda = !!process.env.LAMBDA_TASK_ROOT;

if (!isInLambda) {
  require("dotenv").config();
  require("./src/index").start({});
}

module.exports.start = (event, context, callback) => {
  try {
    if (isInLambda) console.log("Runing under AWS lambda");
    require("./src/index").start({
      isInLambda,
      callback,
      aws_params: event
    });
  } catch (error) {
    callback("Process finished with error:", error);
  }
};
