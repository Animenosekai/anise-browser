import chromium from 'chrome-aws-lambda';
import log from "../utils/log";
import fs from "fs"
import { v4 as uuidv4 } from 'uuid';
import randomUserAgent from '../utils/useragents';
import { Browser, Page } from 'puppeteer-core';

export class Size {
    width: number
    height: number
    constructor(width: number = null, height: number = null) {
        this.width = width
        this.height = height
    }
}

export class Chrome {
    _init: boolean = false
    _size: Size
    _tmpFolder = "/tmp/" + uuidv4()
    options = chromium.args
    driver: Browser;
    page: Page;
    async init(width: number = 1920, height: number = 1080) {
        /* Chrome constructor */
        if (this._init) {
            return
        }
        log("Initializing Chrome Object", "Driver")
        if (!width) {
            width = 1920
        }
        if (!height) {
            height = 1080
        }
        this._size = new Size(width = width, height = height)
        log("Creating temp folders", "Driver")
        for (var folder in ["", "/user-data", "/data-path", "/cache-dir"]) {
            if (!fs.existsSync(this._tmpFolder + folder)) {
                fs.mkdirSync(this._tmpFolder + folder)
            }
        }

        log("Defining the options", "Driver")
        this.options.concat([
            "--user-data-dir=" + this._tmpFolder + "/user-data",
            "--data-path=" + this._tmpFolder + "/data-path",
            "--disk-cache-dir=" + this._tmpFolder + "/cache-dir",
            "--homedir=" + this._tmpFolder,
            "--user-agent=" + randomUserAgent(),
            "--window-size=" + this._size.width.toString() + "," + this._size.height.toString()
        ])

        log("Running chromium", "Driver")
        this.driver = await chromium.puppeteer.launch({
            args: this.options,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            //executablePath: "/Applications/Google Chrome Dev.app/Contents/MacOS/Google Chrome Dev",
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });
        this.page = await this.driver.newPage()
        await this.setSize(this._size)
        this.page.setCookie({name: "CONSENT", value: "YES+cb", url: "https://google.com"})
        this._init = true
    }

    get size() {
        log("Getting the window size", "Driver")
        let _viewport = this.page.viewport()
        this._size = new Size(_viewport.width, _viewport.height)
        return this._size
    }
    async setSize(size: Size) {
        if (size) {
            log("Setting the window size", "Driver")
            if (!size.width) {
                size.width = this._size.width
            }
            if (!size.height) {
                size.height = this._size.height
            }
            await this.page.setViewport({ width: size.width, height: size.height })
            this._size = size
        }
    }
    set size(size: Size) {
        this.setSize(size)
    }

    async open(url: string = null) {
        if (url) {
            log("Opening a new URL", "Driver")
            await this.page.goto(url, {
                waitUntil: "networkidle0",
            });
        }
    }

    async close() {
        await this.driver.close();
    }

    async screenshot(url: string = null, base64: boolean = false, full: boolean = false) {
        await this.open(url)
        if (base64) {
            log("Screenshotting as base64", "Driver")
            return await this.page.screenshot({ fullPage: full, encoding: "base64" })
        } else {
            log("Screenshotting as PNG", "Driver")
            return await this.page.screenshot({ fullPage: full, encoding: "binary" })
        }
    }

    async source(url: string = null) {
        await this.open(url)
        log("Getting the page source code")
        return await this.page.content()
    }
}
