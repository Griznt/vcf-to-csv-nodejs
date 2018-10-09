## parsing vcf files to one csv file

Console app for parsing all vcard (.vcf) files from provided directory / AWS S3 Bucket
and saving the results to local folder / DropBox / AWS S3 Bucket as single .csv file;

### settings

You may specify following settings:

- source file location
- mapping file location
- additional parsing settings fiel location
- date parsing format
- output file location to save
- upload to DropBox
- upload to AWS S3 Bucket
- specify AWS S3 Bucket with source files
- specify AWS S3 Bucket for uploaded results

### installation

`npm i`

### starting

`npm start`

### .env

- `UPLOAD_TO_DROPBOX=` If true, output file will be uploaded to DropBox
- `DBX_UPLOAD_SUB_FOLDER=` You can specify the subfolder in our dropbox for uploading file or `/` be used by default
- `DBX_ACCESS_TOKEN=` Your DropBox Access Token (You can create it here: https://www.dropbox.com/developers)
- `OUTPUT_FILENAME=` You can specify the output filename or timestamp will be used by default
- `HEADLINES_MAPPING_FILENAME=` You can specify mapping file name
- `ADDITIONAL_PARSING_SETTINGS_FILENAME=` You can specify additional-parsing-settings file name
- `DATE_FORMAT=` You can specify the shown date format or `MM/DD/YYYY` will be used by default
- For uploading to or downloading from Amason AWS S3 Bucket you need to specify:
- `AWS_ACCESS_KEY_ID=` ACCESS key id
- `AWS_SECRET_ACCESS_KEY=` SECRET ACCESS key

only for local running in terminal:

- `INPUT_DIR=` You can specify the input folder with source `.vcf` files or `/input` will be used by default

### output

If `UPLOAD_TO_DROPBOX` is true the output file will be uploaded to your DropBox account.
In another case the `.csv` file will be saved in `/output` directory

### run in AWS lambda

App can work in lambda function. Entry point is `aws.js`. Also provided `aws.yml`.

#### input vcard file

source file uploads from AWS S3 Bucket.
You need to specify AWS S3 Bucket in event:

```
    //All .vcf files from this Bucket will be uploaded and parsed
    Bucket: 'Your Bucket name',
    //Option value. If specified, output file will be saved to BucketUpload,
    //if no, the output will be uploaded to Bucket.
    BucketUpload: 'Your other Bucket',
    //Also, you may specify other params, for example:
    ACL: "public-read"
```

#### output csv file

- if `UPLOAD_TO_DROPBOX=true`, output will be uploaded to DropBox
- else output will be uploaded to AWS S3 Bucket.
  **It's required to add ACCESS key in Enviroment Variables (env)**

### Additional parsing settings

You can specify the additional parsing settings for more more flexible output settings:
concatenate existed fields, or create new and fill from different fields!

Add ADDITIONAL_PARSING_CONDITIONS in the const.js
for example:

```
{ CONCAT: [{ "ADR:3": ["ADR:2", "ADR:1"] }], replaceSource: true },
{
CONCAT: [
{
FULLNAME: ["N:2", "N:3", "N:4", "N:5", "N:6", "N:7", "NOT_EXISTED"]
}
],
replaceSource: false,
newField: true,
mergeWith: '\n'
}
```

there is:

- `CONCAT` - the type of rule. There is only one type is exists now.
- `ADDR:3` or `FULLNAME` - the MAIN field name in souce csv file. On this main field the TYPE of RULE wil lbe applying.
- `["N:1", "N:2"... "SOME_NOT_EXISTED_FIELD"]` - the array of SLAVE fields names in SOURCE vcf file, that will be concatinated with MAIN field. If some notExistedFieldName will be represented - it will be ignored.
- `replaceSource` - If true, the SLAVE fields names will be removed, If false SLAVE fields will be shown as separately fields and as concatenated string in the MAIN field
- `newField` - select true if this field does not existed in the list of source fields names in the vcf file. If false or not specified - this value is already existed in the fields list.
- `mergeWith` - You can specify how you want to concatenate the strings from fields.

  If you have add the newField don't forget to add them in the headlines-mapping.json.
  For example:

```
{ "FULLNAME": "NEW FIELD FULLNAME" }
```
