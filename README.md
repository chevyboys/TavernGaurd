## Tavern Gaurd - Custom Discord bot for the Dire Badger Guild of Snow College 

Icarus is built in Node.js for the LDS Gamers community. It runs on the [Augur framework](https://github.com/Gaiwecoor/augurbot), utilizing the [Discord.js library](https://discord.js.org/).

Pull requests from the community are welcome. Speak with Gaiwecoor on Discord prior to starting to ensure your features fit with the bot.

When submitting a PR, please include the following questions with the appropriate answers:
* Are any changes to config.json necessary? If so, are they reflected in config-example.json?
* Are all referenced snowflakes contained in the config/snowflake.json file, rather than in the code directly?
* Are any changes to Interaction fingerprints needed? If so, are they reflected in the appropriate file in /registry?
* Have I used JSdoc style comments (at least) to properly document all of my functions? 
* Are there any new dependencies that need to be installed? If so, are they reflected in package.json?
* Is every command file as fully self contained as possible (e.g., each module should also register commands as needed)