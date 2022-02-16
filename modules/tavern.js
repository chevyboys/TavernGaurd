const Augur = require("augurbot"),
    Module = new Augur.Module,
    { CharacterClass, Character } = require("../utils/character"),
    Registrar = require("../utils/Utils.CommandRegistrar"),
    snowflakes = require("../config/snowflakes.json"),
    { Message, MessageButton, MessageActionRow, WebhookClient } = require('discord.js');

//helper functions

function getPosition(string, subString, index) {
    return string.split(subString, index).join(subString).length;
}

/**
 * 
 * @param {Discord.interaction} interaction 
 * @param {Character} CharacterInstance 
 * @returns 
 */
let modLogsEmbedComponents = (CharacterInstance) => {
    return new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId("appr" + "--" + CharacterInstance.playerDiscordId + "--" + CharacterInstance.name.replace(/\W/gm, ""))
                .setLabel("Approve")
                .setStyle("SUCCESS"),
            new MessageButton()
                .setCustomId("deny" + "--" + CharacterInstance.playerDiscordId + "--" + CharacterInstance.name.replace(/\W/gm, ""))
                .setLabel("Deny")
                .setStyle("DANGER")
        )
}



//Register commands
let commands = [
    new Registrar.SlashCommandBuilder()
        .setName("tavern-apply")
        .setDescription("Applies to have a character added to the tavern.")
        .addStringOption(option =>
            option.setName("name")
                .setDescription("The name of your character.")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("race")
                .setDescription("The race you want to play. These are organized Alphabetically by Manual")
                .setRequired(true)
                .addChoice("Dragonborn", "Dragonborn")
                .addChoice("Dwarf", "Dwarf")
                .addChoice("Elf", "Elf")
                .addChoice("Gnome", "Gnome")
                .addChoice("Half-Elf", "Half-Elf")
                .addChoice("Halfling", "Halfling")
                .addChoice("Half-Orc", "Half-Orc")
                .addChoice("Human", "Human")
                .addChoice("Tiefling", "Tiefling")
                .addChoice("Arakocra", "Arakocra")
                .addChoice("Genasi", "Genasi")
                .addChoice("Goliath", "Goliath")
                .addChoice("Changeling", "Changeling")
                .addChoice("Kalashtar", "Kalashtar")
                .addChoice("Warforged", "Warforged")
                .addChoice("Aasimar", "Aasimar")
                .addChoice("Tabaxi", "Tabaxi")
        )
        .addStringOption(option =>
            option.setName("background")
                .setDescription("The background you want to play")
                .setRequired(true)
                .addChoice("Acolyte", "Acolyte")
                .addChoice("Charlatan", "Charlatan")
                .addChoice("Criminal", "Criminal")
                .addChoice("Entertainer", "Entertainer")
                .addChoice("Folk Hero", "Folk Hero")
                .addChoice("Gladiator", "Gladiator")
                .addChoice("Guild Artisan", "Guild Artisan")
                .addChoice("Guild Merchant", "Guild Merchant")
                .addChoice("Hermit", "Hermit")
                .addChoice("Knight", "Knight")
                .addChoice("Noble", "Noble")
                .addChoice("Outlander", "Outlander")
                //.addChoice("Pirate", "Pirate")
                .addChoice("Sage", "Sage")
                .addChoice("Sailor", "Sailor")
                .addChoice("Soldier", "Soldier")
                .addChoice("Spy", "Spy")
                .addChoice("Urchin", "Urchin")


        )
        .addStringOption(option =>
            option.setName("brief-description")
                .setDescription("A very breif description of your charcater.")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("primary-class")
                .setDescription("The primary class you will be playing")
                .setRequired(true)
                .addChoice("Artificer", "Artificer")
                .addChoice("Barbarian", "Barbarian")
                .addChoice("Bard", "Bard")
                .addChoice("Cleric", "Cleric")
                .addChoice("Druid", "Druid")
                .addChoice("Fighter", "Fighter")
                .addChoice("Monk", "Monk")
                .addChoice("Paladin", "Paladin")
                .addChoice("Revised Ranger", "Ranger")
                .addChoice("Rogue", "Rogue")
                .addChoice("Sorcerer", "Sorcerer")
                .addChoice("Warlock", "Warlock")
                .addChoice("Wizard", "Wizard")
        )
        .addStringOption(option =>
            option.setName("secondary-class")
                .setDescription("The optional secondary class you will be playing")
                .setRequired(false)
                .addChoice("Artificer", "Artificer")
                .addChoice("Barbarian", "Barbarian")
                .addChoice("Bard", "Bard")
                .addChoice("Cleric", "Cleric")
                .addChoice("Druid", "Druid")
                .addChoice("Fighter", "Fighter")
                .addChoice("Monk", "Monk")
                .addChoice("Paladin", "Paladin")
                .addChoice("Revised Ranger", "Ranger")
                .addChoice("Rogue", "Rogue")
                .addChoice("Sorcerer", "Sorcerer")
                .addChoice("Warlock", "Warlock")
                .addChoice("Wizard", "Wizard")
        )
        .addIntegerOption(option =>
            option.setName("secondary-levels")
                .setDescription("The number of levels your character will have in their secondary class.")
                .setRequired(false)
                .addChoice("1", 1)
                .addChoice("2", 2)
        )
]
Module.addEvent("ready", async () => {
    commandResponse = await Registrar.registerGuildCommands(Module, commands)
    Character.init(Module);
});

//Handle Commands
Module.addInteractionCommand({
    name: "tavern-apply",
    guildId: snowflakes.guilds.PrimaryServer,
    process: async (interaction) => {
        //create Character object
        //Determine classes and levels
        await interaction.deferReply({ ephemeral: true });
        let instanceClasses = []
        let primaryClassLevels = 3;
        let secondaryClass = false
        let primaryClass;
        if ((interaction.options.get("secondary-class")?.value && interaction.options.get("secondary-levels")?.value)) {
            primaryClassLevels = 3 - interaction.options.get("secondary-levels")?.value
            secondaryClass = new CharacterClass(interaction.options.get("secondary-class")?.value, interaction.options.get("secondary-levels")?.value)
            primaryClass = new CharacterClass(interaction.options.get("primary-class").value, primaryClassLevels)
            instanceClasses.push(primaryClass)
            instanceClasses.push(secondaryClass)
        } else {
            primaryClass = new CharacterClass(interaction.options.get("primary-class").value, primaryClassLevels)
            instanceClasses.push(primaryClass)
        }

        //Create the character
        let CharacterInstance = new Character({

            name: interaction.options.get("name").value,
            race: interaction.options.get("race").value,
            background: interaction.options.get("background").value,
            description: interaction.options.get("brief-description").value,
            classes: instanceClasses,
            playerDiscordId: interaction.member.id,
            approved: false,
            characterEntryMessage: null,

        });

        interaction.guild.channels.cache.get(snowflakes.channels.modlogs).send({ content: "Character Submission", embeds: [await CharacterInstance.embed(CharacterInstance)], components: [modLogsEmbedComponents(CharacterInstance)] });
        interaction.editReply({ content: "Your character has been submitted and is being reviewed.", ephemeral: true })

    }
}).addEvent("interactionCreate", async (interaction) => {
    if (interaction.type != 'MESSAGE_COMPONENT') {
        return
    }
    let partitionedCustomId = interaction.customId.split("--")
    if (!partitionedCustomId || partitionedCustomId.length != 3) {
        return;
    }
    let characters = Character.all()
    let approvalStatus = partitionedCustomId.shift().replace("--", "")
    let playerId = partitionedCustomId.shift().replace("--", "")
    let characterName = partitionedCustomId.shift().replace("--", "");
    let thisCharacter = characters.find(character => character.playerDiscordId == playerId && character.name.replace(/\W/gm, "") == characterName)

    if (!thisCharacter) {
        return;
    }
    let thisPlayer = await interaction.guild.members.fetch(thisCharacter.playerDiscordId);
    if (approvalStatus == "appr") {
        thisCharacter.approved = true;

        let embed = await thisCharacter.embed(thisCharacter)
        thisCharacter.characterEntryMessage = (await interaction.guild.channels.cache.get(snowflakes.channels.Tavern.characters).send({ embeds: [embed] })).id;
        await thisPlayer?.roles.add(snowflakes.roles.tavern)
        try {
            await thisPlayer?.send("Your character: " + thisCharacter.name + " has been approved, and you have been given access to the tavern!")
        }
        catch (err) {
            //don't do anything, the player is probably not accepting dm's
        }
        await thisCharacter.update(thisCharacter);
        interaction.update({ embeds: [embed], components: [] })
    } else if (approvalStatus == "deny") {
        thisCharacter.approved = false;
        Character.delete(thisCharacter);
        let embed = await thisCharacter.embed(thisCharacter)
        await thisPlayer?.roles.add(snowflakes.roles.tavern)
        interaction.update({ embeds: [embed], components: [] })
        try {
            await thisPlayer?.send({ content: "Your character: " + thisCharacter.name + " had some issues that need to be addressed before approval. Talk to " + interaction.member.displayName + " to see what needs to be adjusted. Character info:", embeds: [thisCharacter.embed(thisCharacter)] })
        }
        catch (err) {
            console.log(err);
        }

    }


}).addCommand({
    name: "say",
    syntax: "<stuff>",
    aliases: [], // optional
    hidden: true,
    process: async (msg, suffix) => {
        const avatarURL = "https://image.shutterstock.com/image-illustration/3d-rendering-medieval-tavern-interior-260nw-1989669266.jpg"
        //u.preCommand(msg);
        const tavernCharacter = new WebhookClient(Module.client.config.tavernWebhook);
        if (msg.deletable) msg.delete();
        let thread = (msg.channel.isThread() && msg.channel.parentId == snowflakes.channels.Tavern.main)? msg.channel.id : false 
        if (thread){
            return await tavernCharacter.send({content: suffix, avatarURL: avatarURL, threadId: thread});
        }
        else return await tavernCharacter.send({content: suffix, avatarURL: avatarURL});
        //u.postCommand(msg);
    },
    permissions: (msg) => msg.client.config.adminId.includes(msg.author.id) || msg.client.config.ownerId == msg.author.id || msg.member.roles.cache.has(snowflakes.roles.team) || msg.member.roles.cache.has(snowflakes.roles.management)|| msg.member.roles.cache.has(snowflakes.roles.barkeep),
});










module.exports = Module;