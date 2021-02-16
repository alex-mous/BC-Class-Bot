//Meeting and event reminders for users functions, such as add/change reminders

const sheets = require("simplegooglesheetsjs");
const googleAuth = require("../GOOGLE_AUTH.js");
const { JSDOM } = require("jsdom");
const axios = require("axios");


const BASE_URL = "https://www2.bellevuecollege.edu/classes/";
const ALERT_CHANNEL = "811008756866744450";

const reminders = new sheets(); //Set up the user reminders

reminders.authorizeServiceAccount(googleAuth.GOOGLE_AUTH_EMAIL, googleAuth.GOOGLE_AUTH_KEY);
reminders.setSpreadsheet(googleAuth.GOOGLE_SHEET_ID).then(() => reminders.setSheet("Reminders"));


/**
 * Print out a user's currently watched classes
 * 
 * @param {Object} msg Message object
 */
let getStatus = async (msg) => {
    let classes = await (reminders.getRows(2, await reminders.getLastRowIndex()));
    let watchedClasses = "```\t Quarter \t\tClass\t\tItem #\t\t# Seats\n-----------------------------------------------------------\n";
    classes.forEach((cn) => { //Iterate over each user
        if (cn["User IDs"].includes(msg.author.id)) { //Send out reminders to everyone with a higher level
            let noSeats = (cn["Previous Seats"] > 0) ? cn["Previous Seats"] : `${-1*cn["Previous Seats"]} waitlisted`;
            watchedClasses += `\t${cn["Quarter Name"].toUpperCase()}\t\t${cn["Class Name"].toUpperCase()}\t\t${cn["Class Number"]}\t\t${noSeats}\n`;
        }
    });
    watchedClasses += "```";
    msg.reply(`Your currently watched classes:\n${watchedClasses}`);
}


/**
 * Check class statuses and notify users
 * 
 * @param {Object} bot Discord bot object
 */
let checkStatus = async (bot) => {
    let classes = await (reminders.getRows(2, await reminders.getLastRowIndex()));
    classes = classes.filter((u) => u["User ID"] != "User ID"); //Remove headers (if any)
    let classNotifications = {}; //Store reminders to reduce web calls
    classes.forEach((cn, i) => { //Iterate over each user
        if (!classNotifications[cn["Quarter Name"]]) {
            classNotifications[cn["Quarter Name"]] = {};
        }
        if (!classNotifications[cn["Quarter Name"]][cn["Class Name"]]) {
            classNotifications[cn["Quarter Name"]][cn["Class Name"]] = {};
        }
        classNotifications[cn["Quarter Name"]][cn["Class Name"]][cn["Class Number"]] = {
            ids: cn["User IDs"].split(","), //Add user ids to class number
            previousSeats: cn["Previous Seats"],
            rowNum: i+2 //Store row number to set row values later on
        }
    });
    for (let quarter of Object.keys(classNotifications)) {
        for (let classN of Object.keys(classNotifications[quarter])) {
            let classNums = Object.keys(classNotifications[quarter][classN]);
            let seats = await getSeats(quarter, classN, classNums);
            for (let i=0; i<seats.length; i++) {
                let currData = classNotifications[quarter][classN][classNums[i]];
                if (seats[i] != currData.previousSeats) { //Different number of seats - send out notifictions
                    notifyUsers(bot, currData.ids, seats[i], currData.previousSeats, classN, classNums[i]);
                    reminders.setRow(currData.rowNum, { "Previous Seats": seats[i]});
                }
            }
        }
    }
}

/**
 * Notify users given by ids of a the number of seats left (seats)
 * 
 * @param {Object} bot Discord bot object
 * @param {Array<string>} ids User IDs
 * @param {number} noSeats Number of seats
 * @param {number} prevSeats Previous number of seats
 * @param {string} className Class name
 * @param {string} classNum Class number
 */
const notifyUsers = async (bot, ids, noSeats, prevSeats, className, classNum) => {
    let tagStr;
    if (ids.length == 1) {
        tagStr = `<@${ids[0]}>`
    } else if (ids.length > 1) {
        tagStr = ids.reduce((prev, curr, i) => {
            if (i==1) {
                return `<@${prev}> <@${curr}>`;
            } else {
                return `${prev} <@${curr}>`;
            }
        });
    } else {
        console.error("ERR: no users to notify", className, classNum);
        return;
    }
    let msgSeg; //Variable part of message
    if (noSeats == 0) {
        msgSeg = `is now full (no waitlist information), from ${prevSeats || "?"} seats previously!`;
    } else if (noSeats < 0) {
        msgSeg = `now has ${-1*noSeats} of 5 waitlist seats full, from ${prevSeats || "?"} seats previously!`; //Compensate for "negative" seats
    } else {
        msgSeg = `now has ${noSeats} seats left, from ${prevSeats || "?"} seats previously!`;
    }
    bot.channels.cache.get(ALERT_CHANNEL).send(`${tagStr} :warning: Class ${className.toUpperCase()}#${classNum} ${msgSeg}`);
}

/**
 * Add a status for a user
 * 
 * @param {Object} msg Message object
 */
let addStatus = async (msg, args) => {
    if (args.length != 3) {
        msg.reply("Oops, you need three parameters (quarter name, class name and class item number)");
        return;
    }
    let lastRow = await reminders.getLastRowIndex();
    let rows = await reminders.getRows(1, lastRow);
    for (let i=1; i<rows.length; i++) {
        if (rows[i]["Quarter Name"] == args[0] && rows[i]["Class Name"] == args[1] && rows[i]["Class Number"] == args[2]) { //Class exists, add user to list if not already in there
            if (rows[i]["User IDs"] && rows[i]["User IDs"].includes(msg.author.id)) {
                msg.reply(`You are already watching ${args[1].toUpperCase()}#${args[2]}`);
            } else {
                let newUids = rows[i]["User IDs"] ? rows[i]["User IDs"] + "," + msg.author.id : msg.author.id; //Prevent including "undefined" if there is no user ID to start
                reminders.setRow(i+1, {"User IDs": newUids}).then(() => {
                    console.log(`INFO: added ${msg.author.username} to existing class`);
                    let noWatchers = rows[i]["User IDs"] ? rows[i]["User IDs"].split(",").length : 0; //If not defined, then no other watchers
                    msg.reply(`Added class ${args[1].toUpperCase()}#${args[2]} to your watchlist. You are watching along with ${noWatchers} other watcher(s).`);
                });
            }
            return;
        }
    }
    reminders.setRow(lastRow+1, {
        "User IDs": msg.author.id, 
        "Quarter Name": args[0],
        "Class Name": args[1],
        "Class Number": args[2],
        "Previous Seats": (await getSeats(args[0], args[1], [args[2]]))[0]
    }).then(() => { //No user found - add a new row
        console.log(`INFO: added class for user ${msg.author.username}`);
        msg.reply(`Added class ${args[1].toUpperCase()}#${args[2]} and added you as it's sole watcher`);
    });
}

/**
 * Remove a status for a user
 * 
 * @param {Object} msg Message object
 */
let removeStatus = async (msg, args) => {
    if (args.length != 2) {
        msg.reply("Oops, you need two parameters (quarter name and class item number).");
        return;
    }
    let lastRow = await reminders.getLastRowIndex();
    let rows = await reminders.getRows(1, lastRow);
    for (let i=1; i<rows.length; i++) {
        if (rows[i]["Quarter Name"] == args[0] && rows[i]["Class Number"] == args[1]) { //Class exists, add user to list if not already in there
            if (rows[i]["User IDs"] && rows[i]["User IDs"].includes(msg.author.id)) {
                let newUids = rows[i]["User IDs"].replace("," + msg.author.id, "").replace(msg.author.id + ",", "").replace(msg.author.id, ""); //Catch all cases (ID at start, middle or end of list)
                reminders.setRow(i+1, {"User IDs": newUids}).then(() => {
                    console.log(`INFO: removed ${msg.author.username} from existing class`);
                    msg.reply(`Removed class #${args[1]} from your watchlist.`);
                });
                return;
            }
            break;
        }
    }
    msg.reply(`You were not currently watching class #${args[1]}. Check your current watchlist with "!status."`);
}

/**
 * Get an array of seats left matching classes in classNums
 * 
 * @param {*} quarterName Quarter name to check
 * @param {*} className Class name to check
 * @param {*} classNums Class numbers to check (only item numbers in the class name)
 * @returns {Array<number>} Seats left for classes in classNums
 */
const getSeats = async (quarterName, className, classNums) => {
    let seats = [];
    let resp;
    try {
        resp = await axios.get(`${BASE_URL}${quarterName}/${className}`);
    } catch (err) {
        console.log("No page found for this name and quarter combination", quarterName, className);
    }
    let dom = new JSDOM(resp.data);
    console.log(`Getting seats for class ${className}...`);
    for (let classNo of classNums) {
        console.log(`CHecking class number ${classNo}...`);
        let classList = dom.window.document.querySelectorAll(`td[id^='availability-${classNo}']`);
        if (classList.length > 0) {
            let numSeats = classList[0].textContent.toLowerCase();
            if (numSeats.includes("waitlist")) { //Waitlisted class
                noSeats = -1 * parseInt(numSeats.match(/\d/)[0]);
                seats.push(noSeats);
            } else if (numSeats.includes("waitlist")) { //Full class
                seats.push(0);
            } else { //Not full
                seats.push(parseInt(numSeats.match(/\d+/)[0])); //No more than 99 seats
            }
        } else {
            console.log("No classes found for this name and quarter and number combination", quarterName, className, classNo);
        }
    }
    return seats;
}

module.exports = {
    status: {
        run: getStatus
    },
    add: {
        run: addStatus
    },
    remove: {
        run: removeStatus
    },
    statusFns: {
        checkStatus
    }
}