//Print out the help page for the bot

const help = (msg) => {
    msg.channel.send("**Available Commands**:\n\
            `add QUARTER_NAME CLASS_NAME CLASS_NUMBER`\t\t\t\t\Add a class to your watch list ()\n\
            `remove QUARTER_NAME CLASS_NUMBER`\t\t\t\t\tRemove a class (see above for standards formatting QUARTER_NAME and CLASS_NUMBER\n\
            `status`\t\t\t\t\tSee a list of your currently watched classes\n\
            `help`\t\t\t\t\t\tShow this help\n\n\
            **Command Syntax**:\n\
            `QUARTER_NAME` **must** be in the format [FALL/WINTER/SPRING/SUMMER][FULL_YEAR]\n\
            `CLASS_NAME` **must** be the 3-5 letter class code (e.g. ACCT)\n\
            `CLASS_NUMBER` **must** be the 3-4 digit class Item #\n");
}

module.exports.help = {
    run: help
}