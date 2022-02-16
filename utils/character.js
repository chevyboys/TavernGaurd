const u = require("./utils")
const fs = require("fs")
const snowflakes = require("../config/snowflakes.json")

let Module;

/**
 * Updates the info stored and if applicable, in messages for the selected character
 * @param {CharacterClass} characterObject 
 * @returns 
 */
let CharacterUpdate = async (characterObject) => {
    if (!characterObject || !characterObject.playerDiscordId || !characterObject.name) {
        throw new SyntaxError("Invalid D&D character object: " + JSON.stringify(characterObject, 0, 2));
    }
    else {//Create the JSON file for the character. The file should be named "[PlayerDiscordSnowflake]-[characterName].character.json
        fs.writeFileSync(__dirname + `/../data/${characterObject.playerDiscordId}-${characterObject.name.replace(/\W/gm, "")}.character.json`, JSON.stringify(characterObject, null, 4));
        if(characterObject.characterEntryMessage && characterObject.characterEntryMessage.length > 1){
            let guild = await Module.client.guilds.fetch(snowflakes.guilds.PrimaryServer)
            let channel = guild.channels.cache.get(snowflakes.channels.Tavern.characters);
            try {
                let msg = await channel.messages.fetch(characterObject.characterEntryMessage);
                msg.edit({embeds: [Character.embed(characterObject)]});
            } catch (error) {
                
            }
            
        }
        return characterObject;
    }
}


/**
     * Generates an embed for the character.
     * @param {Discord.Interaction} interaction
     * @param {Character} CharacterObj 
     */
let CharacterEmbed = async (CharacterObj) => {
    let classString = "";
    let classAndLevelString = ""
    for (const c of CharacterObj.classes) {
        classString = classString.concat(`${c.className} `);
        classAndLevelString = classAndLevelString.concat(`Level ${c.classLevels} ${c.className}\n`);
    }
    let guild = await Module.client.guilds.fetch(snowflakes.guilds.PrimaryServer);
    let authorMember = await guild.members.fetch(CharacterObj.playerDiscordId);
    let embed = u.embed()
        .setColor(CharacterObj.approved ? "00FF00" : "FF0000")
        .setAuthor("Info for " + authorMember.displayName + "'s Character: " + CharacterObj.name, authorMember.avatarURL() || authorMember.user.avatarURL() || "https://i.imgflip.com/4/3m54tv.jpg")
        .setDescription(`${CharacterObj.name},  ${CharacterObj.background} ${classString}${CharacterObj.race}`)
        .addField("Description:", "```" + CharacterObj.description + "```")
        .addField("Class Levels:", "```" + classAndLevelString + "```")
    return embed;
}

class CharacterClass {
    /**
     * a simple character class storage object
     * @param {string} name 
     * @param {number} levels 
     */
    constructor(name, levels) {
        this.className = name
        this.classLevels = levels
    }
}

class Character {

    /**
     * Looks thorugh /data to find the correct character, and returns the file.
     * @param {string} characterObject a character object to update
     * @returns {Character}
     */



    /**
     * Initializes from an object
     * @param {Object} characterObject 
     * @param {string} characterObject.name The character name
     * @param {string} characterObject.race 
     * @param {string} characterObject.background
     * @param {string} characterObject.description
     * @param {CharacterClass[]} characterObject.classes
     * @param {Discord.Snowflake} characterObject.playerDiscordId the discord id of the player
     * @param {boolean} [characterObject.approved = false] If this is character is approved or not
     * @param {Discord.Snowflake} characterObject.characterEntryMessage
     * @param {number} characterObject.meetingsAttened
     */
    constructor(characterObject) {
        this.name = characterObject.name
        this.race = characterObject.race
        this.background = characterObject.background
        this.description = characterObject.description
        this.classes = Array.isArray(characterObject.classes) ? characterObject.classes : [characterObject.classes]
        this.playerDiscordId = characterObject.playerDiscordId
        this.approved = characterObject.approved || false
        this.characterEntryMessage = characterObject.characterEntryMessage
        this.meetingsAttened = characterObject.meetingsAttened || 0;
        this.update()

        return
    }


    //Methods ----------------------------


    /**
     * Looks thorugh /data to find the correct character, and returns the file.
     * @param {Discord.Snowflake} discordId The discord snowflake ID of the player of the character, or the id of the message containing the character info
     * @param {string} [characterName] The name of the character to get.
     * @returns {Character}
     */
    static get = (discordId, characterName) => {
        if (discordId instanceof Character || discordId.characterEntryMessage || (discordId.playerDiscordId && discordId.characterName)) {
            discordId = discordId.characterEntryMessage || discordId.playerDiscordId
            characterName = discordId.characterName
        }
        return (Character.all()).find((c) =>
            c.characterEntryMessage == discordId ||
            (c.discordId == c.playerDiscordId && characterName ? characterName == c.characterName : true)
        )

    };
    /**
     * Looks thorugh /data to find all character files, parses them, then returns them in an array
     * @returns {Character[]}
     */
    static all = () => {
        let files = fs.readdirSync(__dirname + `/../data/`).filter(x => x.endsWith(`.character.json`));
        let rawData = [];
        for (let i = 0; i < files.length; i++) {
            let data = JSON.parse(fs.readFileSync(__dirname + `/../data/${files[i]}`));
            let characterObj = new Character(data)
            characterObj.file = files[i];
            rawData.push(
                characterObj
            );
        }
        return rawData;
    };


    /**
     * Looks thorugh /data to find the correct character, and removes both that file and the message for them
     * @param {Discord.Snowflake|Character|Character[]|Discord.Snowflake} characterResolvable The discord snowflake ID of the player of the character, or the id of the message containing the character info
     */
    static delete = async (characterResolvable) => {
        let raw = Array.isArray(characterResolvable) ? characterResolvable : [characterResolvable]
        let accepted = raw.map(data => Character.get(data));
        let c = await Module.client.guilds.cache.get(snowflakes.guilds.PrimaryServer).channels.fetch(snowflakes.channels.Tavern.characters);
        for (let i = 0; i < accepted.length; i++) {
            fs.unlinkSync(__dirname + `/../data/${accepted[i].file}`);
            let m;
            try {
                m = await c.messages.fetch(accepted[i].fetch.message);
            } catch (error) {
                if (error.toString().indexOf("Unknown Message") > -1) {
                    u.errorLog("That question has been deleted")
                }
            }

            if (m) m.delete().catch(err => u.errorLog(`ERR: Insufficient permissions to delete messages.`));
        }
    };

    embed = (characterObj = this) => CharacterEmbed(characterObj)


    update = async () => await CharacterUpdate(this)

    static init(BaseModule) {
        Module = BaseModule;
    }
}




module.exports = { CharacterClass, Character }