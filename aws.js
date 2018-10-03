const isInLambda = process.env.LAMBDA_TASK_ROOT;

const start = new Date().getTime();
const onFinish = end => console.log(
  '\r\n_________________________\r\n\r\n',
  `execution Time is ${(end - start)}`,
  '\r\n\_________________________'
);

if (!isInLambda) {
  require("dotenv").config();
  require("./src/index").start({ onFinish });
}

module.exports.start = (event, context, callback) => {
  try {
    if (isInLambda) console.log("Runing under AWS lambda");
    require("./src/index").start({
      isInLambda,
      callback,
      aws_params: event,
      onFinish
    });
  } catch (error) {
    callback("Process finished with error:", error);
  }
};

