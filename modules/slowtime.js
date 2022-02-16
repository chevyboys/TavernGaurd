const Augur = require("augurbot"),
    moment = require("moment");
const u = require('../utils/utils');
const config = require('../config/config.json');
const Module = new Augur.Module();
const fs = require('fs');
const CronJob = require('cron').CronJob;
const { Permissions } = require('discord.js');
const snowflakes = require("../config/snowflakes.json");

let slowable = (chan) => (chan.isText() || chan.isThread()) && (chan.parentId ? ![Module.config.channels.categoryLeadership, Module.config.channels.categoryInformation, Module.config.channels.categoryDiscipline].includes(chan.parentId) : true);

let getSlowTimeEnabled = () => {
    let runtimeVariables = require('../storage/runtimeVariables.json');
    return runtimeVariables.slowTimeEnabled;
}
async function setSlowTimeEnabled(newSlowTime) {
    let runtimeVariables = require('../storage/runtimeVariables.json');
    runtimeVariables.slowTimeEnabled = newSlowTime;
    const data = await JSON.stringify(runtimeVariables, null, 4);
    await fs.writeFileSync(__dirname + '/../storage/runtimeVariables.json', data);
}

async function slowtime(slowModeSeconds = 30, override, msg) {
    if (!getSlowTimeEnabled()) return "Slowtime is disabled";
    const guild = msg ? msg.guild : await Module.client.guilds.cache.get(Module.config.ldsg);
    let previousSlowTimes = [];
    await guild.channels.cache.map((chan) => {
        //if the channel is a text channel who's parentId isn't in our ignored categories, set slowmode.
        if (slowable(chan)) {
            let originalRateLimit = chan.rateLimitPerUser;
            if (originalRateLimit == null) return;
            if (originalRateLimit < slowModeSeconds || override) {
                previousSlowTimes.push([chan.id, originalRateLimit]);
                try {
                    chan.setRateLimitPerUser(slowModeSeconds);
                } catch (error) {
                    console.log("error on:" + chan.name);
                }
            }
        }
    });
    const data = await JSON.stringify(previousSlowTimes, null, 4);
    fs.writeFileSync(__dirname + '/../storage/channelSlowtimes.json', data);
    return `Slowtime set on primary channels for ${slowModeSeconds} seconds`
}

async function slowtimeRevert(msg) {
    const guild = msg ? msg.guild : await Module.client.guilds.cache.get(Module.config.ldsg);
    let slowModeSeconds = 59;
    await guild.channels.cache.map((chan) => {
        //if the channel is a text channel who's parentId isn't in our ignored categories, set slowmode.
        if (slowable(chan)) {
            if (chan.rateLimitPerUser == slowModeSeconds) {
                try {
                    chan.setRateLimitPerUser(0);
                } catch (error) {
                    console.log("error on:" + chan.name);
                }
            }
        }
    });
    return;
}

async function midnightHush() {
    let guild = await Module.client.guilds.cache.get(Module.config.ldsg);
    let perms = guild.roles.everyone.permissions.toArray().filter(p => p != "SEND_MESSAGES" && p != "SEND_MESSAGES_IN_THREADS");
    
    await guild.roles.everyone.setPermissions(perms);
}
async function midnightHushRevert() {
    let guild = await Module.client.guilds.cache.get(Module.config.ldsg);
    let perms = guild.roles.everyone.permissions.add("SEND_MESSAGES");
    perms = perms.add(Permissions.FLAGS.SEND_MESSAGES_IN_THREADS);
    await guild.roles.everyone.setPermissions(perms);

}

async function tavernHush() {
    let guild = await Module.client.guilds.cache.get(Module.config.ldsg);
    let tavernChannel = guild.channels.cache.get(snowflakes.channels.Tavern.main);
    await tavernChannel.permissionOverwrites.edit(snowflakes.roles.tavern, {SEND_MESSAGES: false, SEND_MESSAGES_IN_THREADS: false})
}

async function revertTavernHush() {
    let guild = await Module.client.guilds.cache.get(Module.config.ldsg);
    let tavernChannel = guild.channels.cache.get(snowflakes.channels.Tavern.main);
    await tavernChannel.permissionOverwrites.edit(snowflakes.roles.tavern, {SEND_MESSAGES: true, SEND_MESSAGES_IN_THREADS: true})
}

async function guildLockInteractionHandler(interaction) {
    let guild = await Module.client.guilds.cache.get(Module.config.ldsg);
    let perms = guild.roles.everyone.permissions.has("SEND_MESSAGES");
    if (perms) {
        await midnightHush();
        interaction.reply({ content: "🔇 The Guild has been silenced", ephemeral: true });
    } else {
        await midnightHushRevert();
        interaction.reply({ content: "🔊 Guild members can now talk again.", ephemeral: true });
    }
}
async function guildSlowInteractionHandler(interaction) {
    let enable = interaction.options.getBoolean("slowmode");
    if (enable) {
        await slowtime(59);
        interaction.reply({ content: "set slowmode to 59 seconds", ephemeral: true });
    }
    else {
        let previousSlowTimes = require('../storage/channelSlowtimes.json');
        if (previousSlowTimes.length == 0) {
            let slowable = (chan) => (chan.isText() || chan.isThread()) && (chan.parentId ? ![Module.config.channels.categoryLeadership, Module.config.channels.categoryInformation, Module.config.channels.categoryDiscipline].includes(chan.parentId) : true);

            async function forceslowtime(slowModeSeconds = 0, override = true, msg) {
                const guild = msg ? msg.guild : await Module.client.guilds.cache.get(Module.config.ldsg);
                await guild.channels.cache.map((chan) => {
                    //if the channel is a text channel who's parentId isn't in our ignored categories, set slowmode.
                    if (slowable(chan)) {
                        let originalRateLimit = chan.rateLimitPerUser;
                        if (originalRateLimit == null) return;
                        if (originalRateLimit < slowModeSeconds || originalRateLimit == 59) {
                            try {
                                chan.setRateLimitPerUser(slowModeSeconds);
                            } catch (error) {
                                console.log("error on:" + chan.name);
                            }
                        }
                    }
                });
                return `Slowtime set on primary channels for ${slowModeSeconds} seconds`
            }

            interaction.reply({ content: await forceslowtime(), ephemeral: true });
        } else {
            await slowtimeRevert();
            interaction.reply({ content: "reverted slow time", ephemeral: true });
        }
    }
}


const isToday = (someDate) => {
    const today = new Date()
    return someDate.getDate() == today.getDate() &&
        someDate.getMonth() == today.getMonth();
}


Module.addEvent("ready", () => {

    const nearlyBedTimeJob = new CronJob('0 23 * * *', async () => {
        let guild = await Module.client.guilds.cache.get(Module.config.ldsg);
        let chan = guild.channels.cache.get(Module.config.channels.modlogs);
        let slowTestResult = await slowtime(59);
        //chan.send(slowTestResult);

    }, null, true, 'America/Denver');
    nearlyBedTimeJob.start();

    const shushItsMidnightJob = new CronJob('0 0 * * *', async () => {

        let guild = await Module.client.guilds.cache.get(Module.config.ldsg);
        let chan = guild.channels.cache.get(Module.config.channels.modlogs);
        let slowTestResult = await slowtimeRevert();
        //don't shut down on new years
        var newYears = new Date();
        newYears.setMonth(1, 1);
        if(isToday(newYears)) return
        //chan.send(slowTestResult);
        midnightHush()
    }, null, true, 'America/Denver');
    shushItsMidnightJob.start();

    const shushTheTavern = new CronJob('0 22 * * *', async () => {
        var newYears = new Date();
        newYears.setMonth(1, 1);
        if(isToday(newYears)) return
        tavernHush()
    }, null, true, 'America/Denver');
    shushTheTavern.start();

    const shushItsMidnightRevertJob = new CronJob('30 6 * * *', async () => {
        midnightHushRevert()
        revertTavernHush();
    }, null, true, 'America/Denver');
    shushItsMidnightRevertJob.start();
}).addCommand({
    name: "slow", // required
    syntax: "", // optional
    description: "slow", // recommended
    info: "", // recommended
    hidden: true, // optional
    category: "Bot Admin", // optional
    enabled: true, // optional
    permissions: (msg) => config.adminId.includes(msg.author.id) || config.ownerId == msg.author.id, // optional
    process: async (msg, suffix) => {
        let time = parseInt(suffix.trim());
        if (time != 0 && !time) time = 30;
        let slowTestResult = await slowtime(time);
        msg.react("⏳");
        //u.postCommand(msg)
    } // required
}).addCommand({
    name: "slowrevert", // required
    syntax: "", // optional
    description: "tests slowtime revert", // recommended
    info: "", // recommended
    hidden: true, // optional
    category: "Bot Admin", // optional
    enabled: true, // optional
    permissions: (msg) => config.adminId.includes(msg.author.id) || config.ownerId == msg.author.id, // optional
    process: async (msg) => {
        let slowTestResult = await slowtimeRevert();
        msg.react("⏳");
        //u.postCommand(msg)
    } // required
}).addCommand({
    name: "tavernlock", // required
    syntax: "", // optional
    description: "slow", // recommended
    info: "", // recommended
    hidden: true, // optional
    category: "Bot Admin", // optional
    enabled: true, // optional
    permissions: (msg) => config.adminId.includes(msg.author.id) || config.ownerId == msg.author.id, // optional
    process: async (msg, suffix) => {
        let slowTestResult = await tavernHush();
        msg.react("🔒");
    } // required
}).addCommand({
    name: "tavernunlock", // required
    syntax: "", // optional
    description: "tests slowtime revert", // recommended
    info: "", // recommended
    hidden: true, // optional
    category: "Bot Admin", // optional
    enabled: true, // optional
    permissions: (msg) => config.adminId.includes(msg.author.id) || config.ownerId == msg.author.id, // optional
    process: async (msg) => {
        let slowTestResult = await revertTavernHush();
        msg.react("🔓");
    } // required
}).addCommand({
    name: "guildlock", // required
    syntax: "", // optional
    description: "tests slowtime revert", // recommended
    info: "", // recommended
    hidden: true, // optional
    category: "Bot Admin", // optional
    enabled: true, // optional
    permissions: (msg) => msg.member.roles.cache.has(Module.config.roles.management) || config.ownerId == msg.author.id, // optional
    process: async (msg) => {
        let guild = await Module.client.guilds.cache.get(Module.config.ldsg);
        let perms = guild.roles.everyone.permissions.has("SEND_MESSAGES");
        if (perms) {
            await midnightHush();
            msg.react("🔇");
        } else {
            await midnightHushRevert();
            msg.react("🔊");
        }
    } // required
}).addInteractionCommand({
    name: "guild",
    guildId: config.ldsg,
    process: async (interaction) => {
        if (!interaction.member.roles.cache.has(Module.config.roles.management)) {
            interaction.reply({ content: "You can't do that", ephemeral: true });
            return;
        }
        switch (interaction.options.getSubcommand(true)) {
            case "lock":
                await guildLockInteractionHandler(interaction);
                break;
            case "slow":
                await guildSlowInteractionHandler(interaction);
                break;
        }
    }
});
module.exports = Module;