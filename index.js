/**
 * A command from a user
 * @typedef {Object} Command
 * @param {string} command Command name
 * @param {Array<string>} params Command parameters
 */

const Discord = require("discord.js");
const bot = new Discord.Client();
require("log-timestamp"); //Add log timestamps


let commands;
require("./commands.js").loadCommands((cmds) => {
    commands = cmds;
}); //Load the commands

const TOKEN = process.env.TOKEN || require("./CONFIG.json").token; //Bot login token

/**
 * Event handler for startup of Bot
 */
bot.on('ready', () => {
    setInterval(() => { //Run class status check
        commands.statusFns.checkStatus(bot);
    }, 60*1000); //1 minute in ms

    bot.user.setUsername(process.env.BOT_USERNAME || "ClassWatchBot");
    bot.user.setPresence({
        status: "online",
        activity: {
            name: process.env.BOT_STATUS || "⌚ing...",
            type: process.env.BOT_STATUS_TYPE || "PLAYING"
        }
    });
    console.log("INFO: bot ready");
});

/**
 * Welcome handler for new users, and assigns Member role
 */
bot.on("guildMemberAdd", (member) => {
    let name = member.guild.members.cache.get(member.user.id).nickname; //Select nickname
    if (!name) name = member.user.username; //Default to username if no nickname
    member.guild.channels.cache.find((ch) => {
        return ch.name == "welcome"
    }).send(`Welcome to the server, ${name}!`);
    //Send welcome message
    member.user.send("**Welcome to the BC Class Watch, " + name + "!**\n\
Our purpose it to enable BC students to monitor classes for waitlist slot drops\
**Rules**\n\
-  Be respectful to the other members!\n\
-  No swearing in the server\n\
-  Don't use the server or channels for the purpose of harm to others\n\
-  Repeated violation of these rules will result in a suspension or ban at the Mods digression.\n\
\n\
**Bot Commands**\n\
-  You can run commands either in this chat or in the server's channels\n\
-  Use \"!help\" to view the available commands");
    console.log("INFO: new user added!");
});

/**
 * Event handler for any new message
 */
bot.on("message", (msg) => {
    let msgContentList = msg.content.toLowerCase().split(" ");
    let cmd = getCommand(msgContentList);
    if (cmd) {
        runCommand(cmd, msg);
    }
});


//Log all messages
bot.on("error", (e) => console.error(e));
bot.on("warn", (e) => console.warn(e));
//bot.on("debug", (e) => console.log(e));



bot.login(TOKEN);



/**
 * Get a command from the message (if any)
 *
 * @param {Object} msgContentList List of words in message
 * @returns {Command} Returns a Command
 */
const getCommand = (msgContentList) => {
    let command = {command: null, params: []};
    msgContentList.forEach((word) => {
        if (word.startsWith("!")) {
            if (!command.command) {
                command.command = word.substring(1);
            } else {
                msg.reply(":warning: Only the first command will be used")
            }
        } else if (command.command) { //Parse words after the command as parameters
            command.params.push(word);
        }
    });
    return command.command ? command : null; //Only return Command if there is a command
}

/**
 * Run a command
 *
 * @param {Command} cmd Command object
 * @param {Object} msg Message object
 */
let runCommand = async (cmd, msg) => {
    console.log(`INFO: attempting to run command ${cmd.command}`);
    let cmdFn = commands[cmd.command];
    if (!cmdFn) {
        console.warn("WARN: command not found");
        msg.reply(":grey_question: That's not implemented yet! Please contact the server moderators");
        return;
    }
    if (cmdFn.serverOnly && msg.guild == null) { //Server only and running in DM
        console.warn("WARN: trying to run server only command in DM")
        msg.reply("Sorry, you can't run that command in a DM");
        return;
    }
    if (cmdFn.requiresAdmin) {
        try {
            await checkPermissions(msg, "Mods");
        } catch {
            msg.reply(`:no_entry: Only admins can do that`);
            console.warn("WARN: insufficient permissions to run command");
            return;
        }
    }

    if (cmd.command == "vote") { //Change the mode if entering voting mode
        botMode = "vote";
    }

    cmdFn.run(msg, cmd.params); //Run the command if all checks passed
}

/**
 * Check the permission of the user sending the message
 *
 * @function checkPermission
 * @param {Object} msg Message object
 * @param {String} requiredRole Required role to delete
 * @returns {Promise} Resolve/reject the permission
 */
let checkPermissions = (msg, requiredRole) => {
    return new Promise((resolve, reject) => {
        const permissions = msg.member.roles.cache.some((r) => { return requiredRole == r.name });
        if (permissions)
            resolve();
        else
            reject();
    });
}
