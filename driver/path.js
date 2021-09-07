process.env["AWS_LAMBDA_FUNCTION_NAME"] = "Anise"
process.env["FUNCTION_NAME"] = "Anise"
process.env["FUNCTION_TARGET"] = "Anise"

const fs = require('fs')
const chromium = require('chrome-aws-lambda');

async function get() {
    var content = await chromium.executablePath
    fs.writeFile('./bin/path', content, err => {
        if (err) {
          console.error(err)
          return
        }
        //file written successfully
        console.log(content)
    })
}
get()