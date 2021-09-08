export default function toBool(value: any) {
    if (["true", "1", "yes"].includes(String(value).toLowerCase().replace("0", ""))) { // by removing "0", "0001" will be catched
        return true
    }
    return false
}