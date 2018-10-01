require("dotenv").config();
const path = require("path");
const fs = require("fs");
const vCard = require("vcard-parser");
const Json2csvParser = require("json2csv").Parser;
const moment = require("moment");

require("isomorphic-fetch");

/**
 * TODO:
 * 1. to add compabiliaty with AWS lambda function
 * 2. to add creation a deployment package for AWS
 *
 */

const {
  VCARD_INCLUDED_FIELDS,
  PREFIX,
  POSTFIX,
  VCARD_HEADLINES_MAPPING_2,
  HEADLINES_MAPPING_FILENAME_2
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
  new Date().getTime()}.csv`;

loadAllFilesInDir(inputDir);

function loadHeadlinesMappingFile() {
  if (!fs.existsSync(headlinesMappingFilePath)) {
    console.error(
      `There are no headlines mapping file "${headlinesMappingFilePath}"! Will used default mapping.`
    );

    return VCARD_HEADLINES_MAPPING_2;
  } else {
    try {
      const file = fs.readFileSync(
        path.join(headlinesMappingFilePath),
        "utf-8"
      );

      return JSON.parse(file);
    } catch (error) {
      console.error(error);
      return VCARD_HEADLINES_MAPPING_2;
    }
  }
}

function loadAllFilesInDir(dir) {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    fs.readdir(dir, function(err, fileNames) {
      if (err) {
        console.error(err);
        return {};
      } else {
        let objects = [];
        if (!fileNames || fileNames.length === 0) {
          console.error("There are no files in directory!");
          return null;
        }
        fileNames.forEach(fileName => {
          if (fileName.includes(".vcf")) {
            const vcard = fs.readFileSync(path.join(dir, fileName), "utf-8");
            objects = objects.concat(objects, parseVCardToCsv(vcard));
          }
        });
        if (objects.length != 0) {
          const csv = saveToCSV(mergeResultObjects(objects, true));

          if (UPLOAD_TO_DROPBOX) {
            uploadToDropbox({
              name: OUTPUT_FILENAME,
              content: new Buffer(csv)
            });
          } else
            writeToFile({
              outputFileLocation: outputFileLocation(OUTPUT_FILENAME),
              file: csv
            });
        } else {
          console.error("There are no .vcf files!");
          return null;
        }
      }
    });
  } catch (error) {
    console.error(error);
    return null;
  }
}

function outputFileLocation(filename) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  return path.join(outputDir, filename);
}

function parseVCardToCsv(vcard) {
  const vcardsArray = vcard
    .split(new RegExp(POSTFIX, "g"))
    .filter(item => item.includes(PREFIX))
    .map(item => (item += `\r\n${POSTFIX}`));

  const allPossibleHeaders = [];

  const result = [];

  vcardsArray.map(item => {
    const card = vCard.parse(item);
    const resultObject = {};

    Object.keys(card)
      .filter(key => VCARD_INCLUDED_FIELDS.includes(key.toUpperCase()))
      .map(key => {
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
    result.push(resultObject);
  });
  return mergeResultObjects(result);
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
    if (string.match(/([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/)) {
      return moment(string).format("DD/MM/YYYY");
    }
    return string;
  } catch (error) {
    console.error("Date parsing error: ", error);
    return date;
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
      console.log(`File "${uploadingPath}" is successfully uploaded!`);
    })
    .catch(function(err) {
      console.log(`File "${uploadingPath}"uploading exception:`, err);
    });
}
