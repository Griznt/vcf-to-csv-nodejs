require("dotenv").config();
const path = require("path");
const fs = require("fs");
const vCard = require("vcard-parser");
const Json2csvParser = require("json2csv").Parser;
const { VCARD_INCLUDED_FIELDS, PREFIX, POSTFIX } = require("./const");

const inputFiles = path.join(__dirname, "..", "input", "Example.vcf");
const outputFiles = path.join(__dirname, "..", "output");

const vcard = fs.readFileSync(inputFiles, "utf-8");

const vcardsArray = vcard
  .split(new RegExp(POSTFIX, "g"))
  .filter(item => item.includes(PREFIX))
  .map(item => (item += `\r\n${POSTFIX}`));

const objects = [];

const outputFileLocation = uniqIdentifier =>
  `${outputFiles}/${uniqIdentifier || ""}.csv`;

const result = [];

vcardsArray.map(item => {
  const card = vCard.parse(item);
  const resultObject = {};

  Object.keys(card).map(key => {
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

  saveToCSV({
    file: resultObject,
    outputFileLocation: outputFileLocation(new Date().getTime())
  });
});

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

function saveToCSV({ file, outputFileLocation }) {
  try {
    const fields = Object.keys(file);
    const parser = new Json2csvParser({ fields });
    const csvFile = parser.parse(file);
    writeToFile({ outputFileLocation, file: csvFile });
  } catch (err) {
    console.error(err);
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
function mergeResultObjects(result) {
	const maxKeysCount = Math.max(Object.keys())
}

function getCardItemsCount(vcard) {
  console.log(vcard);
  return vcard.split(new RegExp(PREFIX, "g")).length - 1;
  // vcard instanceof String
  // ?
  // vcard.split(new RegExp(PREFIX, g)).length - 1;
  // : undefined;
}
