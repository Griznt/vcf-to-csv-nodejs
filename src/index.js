require("dotenv").config();
const path = require("path");
const fs = require("fs");
const vCard = require("vcard-parser");
const Json2csvParser = require("json2csv").Parser;

const { VCARD_INCLUDED_FIELDS, PREFIX, POSTFIX } = require("./const");

const dir = path.join(__dirname, "..", process.env.DIR || "input");

loadAllFilesInDir(dir);

function loadAllFilesInDir(dir) {
  fs.readdir(dir, function(err, fileNames) {
    if (err) {
      console.log(err);
      return {};
    } else {
      let objects = [];
      fileNames.forEach(fileName => {
        const vcard = fs.readFileSync(path.join(dir, fileName), "utf-8");
        objects = objects.concat(objects, parseVCardToCsv(vcard));
      });
      const csv = saveToCSV(mergeResultObjects(objects));
      writeToFile({
        outputFileLocation: outputFileLocation(new Date().getTime()),
        file: csv
      });
    }
  });
}

function outputFileLocation(uniqIdentifier) {
  const outputFiles = path.join(__dirname, "..", "output");
  return `${outputFiles}/${uniqIdentifier || ""}.csv`;
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
              k = parseKey({ key, i: j, meta: null, value: innerItem });
              v = innerItem;
              resultObject[k] = v;
            });
          } else {
            k = parseKey({ key, i, meta, value });
            v = item.value;

            resultObject[k] = v;
          }
        });
      });
    result.push(resultObject);
  });

  return mergeResultObjects(result);

  // const csv = saveToCSV(mergeResultObjects(result));
  // writeToFile({
  //   outputFileLocation: outputFileLocation(new Date().getTime()),
  //   file: csv
  // });
}

function parseKey({ key, i, meta, value }) {
  let result = `${key}`;
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
  fs.writeFile(outputFileLocation, file, function(err) {
    if (err) {
      return console.log(err);
    }
    console.log(`The file was saved to ${outputFileLocation}!`);
  });
}

function mergeResultObjects(results) {
  try {
    const mergedObjects = [];
    const allHeaders = results
      .map(obj => Object.keys(obj))
      .map(obj => {
        return {
          length: obj.length,
          obj
        };
      })
      .sort((o1, o2) => o1.length < o2.length)[0].obj;

    results.forEach(result => {
      let object = {};
      allHeaders.forEach(header => {
        object[header] = result[header] || "";
      });
      mergedObjects.push(object);
    });

    return mergedObjects;
  } catch (error) {
    console.log({ error });
    return {};
  }
}
