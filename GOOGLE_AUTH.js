//Provide the AUTH tokens for the Google Sheets access

const GOOGLE_AUTH_EMAIL = process.env.GOOGLE_AUTH_EMAIL || require("./GOOGLE_AUTH.json").client_email; //Google Service Account credentials
const GOOGLE_AUTH_KEY = (process.env.GOOGLE_AUTH_KEY && process.env.GOOGLE_AUTH_KEY.replace(/\\n/gm, '\n')) || require("./GOOGLE_AUTH.json").private_key;
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID || require("./CONFIG.json").id; //Google Sheet ID

module.exports = {
    GOOGLE_AUTH_EMAIL, GOOGLE_AUTH_KEY, GOOGLE_SHEET_ID
}