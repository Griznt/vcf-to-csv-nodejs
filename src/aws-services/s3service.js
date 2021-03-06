const aws = require("aws-sdk");

const s3 = new aws.S3({
  apiVersion: "2006-03-01"
});

exports.uploadFrom = ({ Bucket, maxKeys }) => {
  let results = [];

  return new Promise((resolve, reject) => {
    const params = { Bucket };
    if (maxKeys) params["maxKeys"] = maxKeys;
    s3.listObjectsV2(params, function(err, data) {
      if (err || !data) {
        reject(
          "There are problem with fetching Objects list from S3 bucket!" +
            err.toString()
        );
      } else {
        data.Contents.forEach(async (object, i) => {
          const Key = object.Key;
          if (!Key.includes(".vcf")) return;
          await uploadObjectFromBucket({ Bucket, Key })
            .then(result => {
              results = results.concat(result);
            })
            .catch(console.error);
          if (i === data.Contents.length - 1) {
            if (results.length > 0) resolve(results);
            else
              reject(
                `There are no .vcf files fetching from S3 Bucket! ${Bucket}`
              );
          }
        });
      }
    });
  });
};

function uploadObjectFromBucket({ Bucket, Key }) {
  return new Promise((resolve, reject) => {
    s3.getObject({ Bucket, Key }, function(err, data) {
      if (err) {
        reject(
          "There are problem with fetching data from S3 bucket! " +
            err.toString()
        );
      }
      if (data)
        resolve(new Buffer(data.Body, data.ContentType).toString("utf8"));
      else
        reject(`File with key ${Key} from Bucket ${Bucket} is not fetching!`);
    });
  });
}

exports.uploadTo = settings => {
  const { BucketUpload, Bucket, Key, csv } = settings;
  if (settings[BucketUpload]) delete settings.BucketUpload;
  delete settings.Bucket;
  delete settings.Key;
  delete settings.csv;

  return new Promise((resolve, reject) => {
    const fileBuffer = new Buffer(csv);
    const fileName = `${Math.floor(new Date() / 1000)}.csv`;

    const params = {
      ...settings,
      Body: fileBuffer,
      Key: fileName,
      Bucket: BucketUpload || Bucket,
      ContentType: "text/csv"
    };

    s3.upload(params, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(
        `File successfully loaded to S3 Bucket: ${BucketUpload || Bucket}! ` +
        data
          ? data.Location
          : ""
      );
    });
  });
};
