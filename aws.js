const isInLambda = true;//!!process.env.LAMBDA_TASK_ROOT;

// if (!isInLambda)
// require("./src/index").start({});

const callback2 = console.log;
require("./src/index").start({ isInLambda, callback: callback2, aws_params: { Bucket: "griznt-test", Key: "Example (1).vcf" }/*event*/ });

// module.exports.start = (event, context, callback) => {
//   try {


//     console.log(2222);
//     if (isInLambda)
//       console.log('Runing under AWS lambda');
//     require("./src/index").start({ isInLambda, callback2, aws_params: { Bucket: "griznt-test", Key: "Example (1).vcf" }/*event*/ });
//     callback(null, "Process successfully finished");
//   } catch (error) {
//     callback("Process finished with error:", error);
//   }
// };
