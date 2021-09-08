import { VercelRequest, VercelResponse } from '@vercel/node';
import { Chrome, Size } from '../driver/chrome';
import { Response, sendResponse } from "../utils/response";
import { v4 as uuidv4 } from 'uuid';
import toBool from '../utils/boolean';
import log from "../utils/log";

let CHROME: Chrome = null;
let PID: string = null;

export default (request: VercelRequest, vercelResponse: VercelResponse) => {
    let width: number = null
    if (request.query.width) {
        width = Number(request.query.width)
    }
    let height: number = null
    if (request.query.height) {
        height = Number(request.query.height)
    }
    if (request.query.loaded && toBool(request.query.loaded)) {
        log("Requesting for the current loaded Chromium instance metadata", "/screenshot endpoint")
        if (CHROME) {
            log("Chromium IS loaded", "/screenshot endpoint")
            var response = new Response({
                "pid": PID,
                "width": CHROME.size.width,
                "height": CHROME.size.height
            })
        } else {
            log("Chromium is NOT loaded", "/screenshot endpoint")
            var response = new Response({
                "pid": null,
                "width": null,
                "height": null
            })
        }
        sendResponse(vercelResponse, response)
    } else if (request.query.preload && toBool(request.query.preload)) {
        log("Requesting to preload Chromium", "/screenshot endpoint")
        if (CHROME) {
            log("Closing existing Chromium instance", "/screenshot endpoint")
            CHROME.close()
        }
        CHROME = new Chrome()
        CHROME.init(width, height).then(() => {
            PID = uuidv4()
            let response = new Response({
                "pid": PID,
                "width": CHROME.size.width,
                "height": CHROME.size.height
            })
            sendResponse(vercelResponse, response)
        })
    } else {
        if (!CHROME) {
            CHROME = new Chrome();
            PID = uuidv4();
        }
        CHROME.init(width, height).then(() => {
            let url: string = null;
            if (request.query.url) {
                url = request.query.url.toString()
            }
            let base64: boolean = false;
            if (request.query.base64) {
                base64 = toBool(request.query.url)
            }
            let full: boolean = false;
            if (request.query.url) {
                full = toBool(request.query.full)
            }
            CHROME.screenshot(url, base64, full).then((result) => {
                if (base64) {
                    let response = new Response({
                        "pid": PID,
                        "width": CHROME.size.width,
                        "height": CHROME.size.height,
                        "result": result
                    })
                    sendResponse(vercelResponse, response)
                } else {
                    vercelResponse.setHeader("X-ANISE-CACHE", "MISS")
                    vercelResponse.setHeader("Server", "Anise")
                    vercelResponse.setHeader("Content-Type", "image/png")
                    vercelResponse.status(200).send(result)
                }
            })
        })
    }
};