## parsing vcf files to one csv file

Console app for parsing all vcard (.vcf) files from provided directory / AWS S3 Bucket
and saving the results to local folder / DropBox / AWS S3 Bucket as single .csv file;

### settings

You may specify following settings:

- source file location
- mapping file location
- date parsing format
- output file location to save
- upload to DropBox
- upload to AWS S3 Bucket
- load source file from AWS S3 Bucket

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
- `DATE_FORMAT=` You can specify the shown date format or `MM/DD/YYYY` will be used by default

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
    //Also, you may specify other params, for example:
    ACL: "public-read"
```

#### output csv file

- if `UPLOAD_TO_DROPBOX=true`, output will be uploaded to DropBox
- else output will be uploaded to AWS S3 Bucket.
  **It's required to add ACCESS key in Enviroment Variables (env)**
