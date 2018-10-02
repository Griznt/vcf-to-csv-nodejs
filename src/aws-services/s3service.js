const aws = require("aws-sdk");
exports.upload = ({ Bucket, Key }) => {
  // Construct the AWS S3 Object -
  // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#constructor-property
  const s3 = new aws.S3({
    apiVersion: "2006-03-01"
  });

  var params = { Bucket, Key };
  return new Promise((resolve, reject) => {
    s3.getObject(params, function(err, data) {
      if (err) {
        console.error(err.code, "-", err.message);
        //   return callback(err);
        reject(err);
      }
      console.log({ data });
      resolve(data);
    });
  });
};
