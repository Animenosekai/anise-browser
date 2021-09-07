const chromium = require('chrome-aws-lambda');
async function get() {
    console.log(await chromium.executablePath)
}
get()