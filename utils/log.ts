export default async function log(message: String, step: String = "DEBUGGER", level: String = "DEBUG") {
    let date = new Date();
    console.log(date.toUTCString() + "｜[" + level.toUpperCase() + "] [" + step + "] " + message)
}