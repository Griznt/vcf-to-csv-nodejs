const aws = require("aws-sdk");

exports.uploadFrom = ({ Bucket, Key }) => {
  const s3 = new aws.S3({
    apiVersion: "2006-03-01"
  });

  var params = { Bucket, Key };
  return new Promise((resolve, reject) => {
    s3.getObject(params, function(err, data) {
      if (err || !data) {
        console.error(err);
        reject(
          "There are problem with fetching data from S3 bucket!" +
            err.toString()
        );
      }

      if (data)
        resolve(new Buffer(data.Body, data.ContentType).toString("utf8"));
      else
        reject("There are problem with fetching data from S3 bucket!" + data);
    });
  });
};

exports.uploadTo = settings => {
  const { Bucket, Key, csv } = settings;
  delete settings.Bucket;
  delete settings.Key;
  delete settings.csv;
  const s3 = new aws.S3({
    apiVersion: "2006-03-01"
  });

  return new Promise((resolve, reject) => {
    const fileBuffer = new Buffer(csv);
    const fileName = `${Math.floor(new Date() / 1000)}.csv`;

    const params = {
      ...settings,
      Body: fileBuffer,
      Key: fileName,
      Bucket,
      ContentType: "text/csv"
    };

    s3.upload(params, (err, data) => {
      if (err) reject(err);
      resolve("File successfully loaded to S3 Bucket! " + data.Location);
    });
  });
};
