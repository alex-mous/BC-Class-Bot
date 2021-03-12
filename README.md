# BC ClassWatchBot
## Bellevue College Class Watch Bot

### Introduction

BC ClassWatchBot is a Discord bot designed to monitor Bellevue College classes to get on waitlists and monitor if seats become available. This project is in no way sponsored or endorsed by Bellevue College.

### Installation

Before running, you will need to run `npm install` to install the required dependencies. You will also need a Google Service Account set up, with your keys saved to a file called `GOOGLE_AUTH.json` in the root directory of the project. Also, you will need to edit the `CONFIG_TEMPLATE.json` template file to be called `CONFIG.json` and fill in the required fields with your Bot's login token, the ID of the Google Sheet to save and monitor data in (must have a sheet called "Reminders" with the first row in the sheet set to "Quarter Name", "Class Name", "Class Number", "Previous Seats", and "User IDs") and the numeric channel ID to send alerts to. Also, add the email associated with your Google Service Account as a collaborator (with Editor privileges) for this code to work.

* * *

### Usage

To start the bot, run the file `run.bat` on Windows or via the command line with `npm start`. From any channel in a bot-enabled server, run `!help` to access the command help. Three other commands are available to users - `!status`, `!add` and `!remove` to show your current classes and add and remove them.

* * *

### License

Copyright 2020 Alex Mous

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
