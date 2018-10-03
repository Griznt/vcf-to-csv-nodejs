require("dotenv").config();
const path = require("path");
const fs = require("fs");
const vCard = require("vcard-parser");
const Json2csvParser = require("json2csv").Parser;
const moment = require("moment");

require("isomorphic-fetch");

const {
  PREFIX,
  POSTFIX,
  VCARD_HEADLINES_MAPPING,
  HEADLINES_MAPPING_FILENAME_2,
  DATE_PARSE_REGEXP,
  DATE_FORMAT,
  ADDITIONAL_PARSING_RULES,
  ADDITIONAL_PARSING_CONDITIONS
} = require("./const");

const inputDir = path.join(__dirname, "..", process.env.INPUT_DIR || "input");

const outputDir = path.join(
  __dirname,
  "..",
  process.env.OUTPUT_DIR || "output"
);

const HEADLINES_MAPPING_FILENAME =
  process.env.HEADLINES_MAPPING_FILENAME || HEADLINES_MAPPING_FILENAME_2;

const headlinesMappingFilePath = path.join(
  __dirname,
  "/",
  HEADLINES_MAPPING_FILENAME
);

const HEADLINES_MAPPING = loadHeadlinesMappingFile();

const allHeaders = HEADLINES_MAPPING.map(item => Object.keys(item)[0]);

const UPLOAD_TO_DROPBOX = process.env.UPLOAD_TO_DROPBOX === "true";

const OUTPUT_FILENAME = `${process.env.OUTPUT_FILENAME ||
  Math.floor(new Date() / 1000)}.csv`;

function loadHeadlinesMappingFile() {
  if (!fs.existsSync(headlinesMappingFilePath)) {
    console.error(
      `There are no headlines mapping file "${headlinesMappingFilePath}"! Will used default mapping.`
    );

    return VCARD_HEADLINES_MAPPING;
  } else {
    try {
      const file = fs.readFileSync(
        path.join(headlinesMappingFilePath),
        "utf-8"
      );

      return JSON.parse(file);
    } catch (error) {
      console.error(error);
      return VCARD_HEADLINES_MAPPING;
    }
  }
}

function loadFiles(dir, params) {
  return new Promise((resolve, reject) => {
    const { isInLambda, aws_params } = params || {};

    if (isInLambda) {
      require("./aws-services/s3service")
        .uploadFrom(aws_params)
        .then(result => {
          resolve(parseVCardToCsv(result, params));
        })
        .catch(error => {
          lambdaCallback({ params, success: false, message: error });
          reject(error);
        });
    } else {
      let objects = [];
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
      fs.readdir(dir, function(err, fileNames) {
        if (err) {
          console.error(err);
          reject(error);
          return {};
        } else {
          if (!fileNames || fileNames.length === 0) {
            console.error(`There are no files in directory: "${dir}"!`);
            reject(error);
            return null;
          }
          fileNames.forEach(fileName => {
            if (fileName.includes(".vcf")) {
              const vcard = fs.readFileSync(path.join(dir, fileName), "utf-8");
              objects = objects.concat(objects, parseVCardToCsv(vcard));
            }
          });
          resolve(objects);
        }
      });
    }
  });
}

async function loadAllFilesInDir(dir, params) {
  const { isInLambda, callback, aws_params } = params || {};
  try {
    let objects = [];
    await loadFiles(dir, params)
      .then(_objects => {
        objects = _objects;
      })
      .catch(err => {
        console.error(err);
        lambdaCallback({ params, success: false, message: err });
      });

    if (objects.length != 0) {
      const csv = saveToCSV(mergeResultObjects(objects, true));

      if (UPLOAD_TO_DROPBOX) {
        uploadToDropbox({
          name: OUTPUT_FILENAME,
          content: new Buffer(csv)
        });
        const message = `File ${OUTPUT_FILENAME} uploaded to DropBox`;
        console.log(message);
        if (isInLambda)
          lambdaCallback({
            params,
            success: true,
            message
          });
      } else if (!isInLambda) {
        const path = outputFileLocation(OUTPUT_FILENAME);
        writeToFile({
          outputFileLocation: path,
          file: csv
        });
        console.log(`Results successfully written in the file ${path}`);
      } else {
        if (isInLambda) {
          require("./aws-services/s3service")
            .uploadTo({ ...aws_params, csv })
            .then(result =>
              lambdaCallback({
                params,
                success: true,
                message: "Parsing finished successfull" + result.toString()
              })
            )
            .catch(error =>
              lambdaCallback({
                params,
                success: false,
                message: error
              })
            );
        }
      }
      return csv;
    } else {
      const message = "There are no .vcf files!";
      console.error(message);
      lambdaCallback({ params, success: false, message });
      return null;
    }
  } catch (error) {
    console.error(error);
    lambdaCallback({ params, success: false, message: error });
    return null;
  }
}

function outputFileLocation(filename) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  return path.join(outputDir, filename);
}

function parseVCardToCsv(vcard, params = {}) {
  const vcardsArray = vcard
    .split(new RegExp(POSTFIX, "g"))
    .filter(item => item.includes(PREFIX))
    .map(item => (item += `\r\n${POSTFIX}`));

  const result = [];

  vcardsArray.map(item => {
    const card = vCard.parse(item);
    let resultObject = {};

    Object.keys(card).map(key => {
      const value = card[key];
      value.forEach((item, i) => {
        const meta = parseMeta(item.meta);
        let k, v;
        if (item.value instanceof Array) {
          item.value.forEach((innerItem, j) => {
            k = parseKey({
              key,
              i: j,
              meta: null,
              value: innerItem
            });
            v = parseData(innerItem);
            resultObject[k] = v;
          });
        } else {
          k = parseKey({ key, i, meta, value });
          v = parseData(item.value.toString());
          if (!resultObject[k]) resultObject[k] = v;
        }
      });
    });

    try {
      ADDITIONAL_PARSING_CONDITIONS.forEach(rule => {
        switch (getObjectkey(rule)) {
          case ADDITIONAL_PARSING_RULES.CONCAT:
            rule[ADDITIONAL_PARSING_RULES.CONCAT].forEach(concatRule => {
              const key = getObjectkey(concatRule);
              const value = concatRule[key];
              value.filter(v => !!resultObject[v]).forEach(v => {
                resultObject[key] += `\r\n${resultObject[v]}`;
                delete resultObject[v];
              });
            });
            break;
          default:
            break;
        }
      });
    } catch (error) {
      const message = "There additional parsing error" + error.toString();
      console.error(message);
      lambdaCallback({ params, success: false, message });
      return resultObject;
    }
    result.push(resultObject);
  });
  return mergeResultObjects(result);
}

function getObjectkey(object) {
  try {
    return Object.keys(object)[0];
  } catch (error) {
    console.error("Error in get object key function", error);
    return object;
  }
}

function parseKey({ key, i, meta, value }) {
  let result = `${key.toUpperCase()}`;
  if (meta && meta.length > 0) {
    result += meta;
  } else if (value.length > 1) {
    result += `:${i + 1}`;
  }
  return result;
}

function parseMeta(meta = {}) {
  return Object.keys(meta)
    .map(k => `;${k.toUpperCase()}=${meta[k][0]}`)
    .toString();
}

function parseData(string) {
  try {
    const dateFormat = process.env.DATE_FORMAT || DATE_FORMAT;
    if (string.match(DATE_PARSE_REGEXP)) {
      return moment(string).format(dateFormat);
    }
    return string;
  } catch (error) {
    console.error("Date parsing error: ", error);
    return string;
  }
}

function saveToCSV(arrayofObjects) {
  try {
    const fields = Object.keys(arrayofObjects[0]);
    const parser = new Json2csvParser({ fields });
    const csvFile = parser.parse(arrayofObjects);

    return csvFile;
  } catch (err) {
    console.error(err);
    return null;
  }
}

function writeToFile({ outputFileLocation, file }) {
  fs.writeFileSync(outputFileLocation, file, function(err) {
    if (err) {
      return console.error(err);
    }
    console.log(`The file was saved to ${outputFileLocation}!`);
  });
}

function mergeResultObjects(results, isFinal = false) {
  try {
    const mergedObjects = [];
    results.forEach(result => {
      let object = {};
      allHeaders.forEach(header => {
        const key = isFinal ? mapVcardColumnToHeadline(header) : header;
        object[key] = result[header] || "";
      });
      mergedObjects.push(object);
    });
    return mergedObjects;
  } catch (error) {
    console.error(error);
    return {};
  }
}

function mapVcardColumnToHeadline(header) {
  try {
    return HEADLINES_MAPPING.filter(item => !!item[header])[0][header];
  } catch (error) {
    console.error("Columns mapping error:", error);
    return header;
  }
}

function uploadToDropbox(file) {
  const Dropbox = require("dropbox").Dropbox;
  const DBX_ACCESS_TOKEN = process.env.DBX_ACCESS_TOKEN;
  const DBX_UPLOAD_SUB_FOLDER = process.env.DBX_UPLOAD_SUB_FOLDER;

  const uploadingPath = `/${
    DBX_UPLOAD_SUB_FOLDER ? `${DBX_UPLOAD_SUB_FOLDER}/` : ""
  }${file.name}`;

  const dbx = new Dropbox({ accessToken: DBX_ACCESS_TOKEN });

  dbx
    .filesUpload({
      path: uploadingPath,
      contents: file.content
    })
    .then(function(response) {
      console.log(
        `File "${uploadingPath}" is successfully uploaded to DropBox!`,
        { response }
      );
    })
    .catch(function(err) {
      console.log(`File "${uploadingPath}" upload to DropBox error:`, err);
    });
}

function lambdaCallback({ params, success, message }) {
  const { isInLambda, callback } = params;
  if (isInLambda) {
    if (success) callback(null, message);
    else callback(message);
  }
}

exports.start = async function({ isInLambda, callback, aws_params }) {
  const result = await loadAllFilesInDir(inputDir, {
    isInLambda,
    callback,
    aws_params
  });
  return !!result;
};
