const aws = require("aws-sdk");

exports.uploadFrom = ({ Bucket, Key }) => {
  const s3 = new aws.S3({
    apiVersion: "2006-03-01"
  });

  var params = { Bucket, Key };
  return new Promise((resolve, reject) => {
    s3.getObject(params, function (err, data) {
      if (err) {
        console.error(err);
        reject(err);
      }


      resolve(new Buffer(data.Body, 'base64').toString('base64'));
    });
  });
};

exports.uploadTo = ({ Bucket, Key, csv }) => {
  const s3 = new aws.S3({
    apiVersion: "2006-03-01"
  });

  return new Promise((resolve, reject) => {
    const fileBuffer = new Buffer(csv, 'base64');
    const fileName = `${Math.floor(new Date() / 1000)}.csv`;
    const params = {
      Body: fileBuffer,
      Key: fileName,
      Bucket,
      ContentEncoding: 'base64',
      ContentType: 'text/csv'
    };
    console.log({ params });
    s3.putObject(params, (err, data) => {
      if (err) reject(err);
      resolve('File successfully loaded to S3 Bucket!')
    });
  })





};
