const isInLambda = !!process.env.LAMBDA_TASK_ROOT;

if (!isInLambda) {
  require("dotenv").config();
  require("./src/index").start({});
}

// const callback2 = console.log;
// require("./src/index").start({
//   isInLambda,
//   callback: callback2,
//   aws_params: {
//     Bucket: "griznt-test",
//     Key: "john-doe.vcf",
//     ACL: "public-read"
//   } /*event*/
// });

module.exports.start = (event, context, callback) => {
  try {
    if (isInLambda) console.log("Runing under AWS lambda");
    require("./src/index").start({
      isInLambda,
      callback,
      aws_params: event
    });
    callback(null, "Process successfully finished");
  } catch (error) {
    callback("Process finished with error:", error);
  }
};
