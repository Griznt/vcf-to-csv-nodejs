## parsing vcf files to one csv file

### installation

`npm i`

### starting

`npm start`

### .env

- `INPUT_DIR=` You can specify the input folder with source `.vcf` files or `/input` will be used by default
- `UPLOAD_TO_DROPBOX=` If true, output file will be uploaded to DropBox
- `DBX_UPLOAD_SUB_FOLDER=` You can specify the subfolder in our dropbox for uploading file or `/` be used by default
- `DBX_ACCESS_TOKEN=` Your DropBox Access Token (You can create it here: https://www.dropbox.com/developers)
- `OUTPUT_FILENAME=` You can specify the output filename or timestamp will be used by default
- `HEADLINES_MAPPING_FILENAME=` You can specify mapping file name

### output

If `UPLOAD_TO_DROPBOX` is true the output file will be uploaded to your DropBox account.
In another case the `.csv` file will be saved in `/output` directory

### run in AWS lambda

App can work in lambda function. Entry point is `aws-start-point.js`. Also provided `aws-start-point.yml`.
