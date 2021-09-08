import { VercelResponse } from "@vercel/node"
import log from "../utils/log";

export class Response {
    success: boolean
    error: string
    data: object
    status: number
    headers: object = {"X-ANISE-CACHE": "MISS", "Server": "Anise", "Content-Type": "application/json"}
    constructor(data: object = null, message: string = null, error: string = null, status: number = 200) {
        log("Creating a new Response instance", "Response")
        if (data) {
            this.data = data
        } else if (message) {
            this.data = {"message": message}
        }
        if (error) {
            log("It is an error", "Response")
            this.error = error
            this.success = false
            this.status = 500
        } else {
            this.error = null
            this.success = true
            this.status = 200
        }
        if (status) {
            this.status = status
        }
    }
}


export function sendResponse(vercelRes: VercelResponse, response: Response) {
    log("Setting the headers", "Response")
    for (var header in response.headers) {
        vercelRes.setHeader(header, response.headers[header])
    }
    log("Sending the Response", "Response")
    vercelRes.status(response.status).send({
        "success": response.success,
        "error": response.error,
        "data": response.data
    })
}