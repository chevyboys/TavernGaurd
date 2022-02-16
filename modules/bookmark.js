const Augur = require("augurbot"),
  u = require("../utils/utils");

// Message context menu for bookmarking a message.

const Module = new Augur.Module()
.addInteractionCommand({ name: "Bookmark",
  commandId: "893655552553533441",
  process: async (interaction) => {
    try {
      await interaction.deferReply?.({ ephemeral: true });
      const message = await interaction.channel.messages.fetch(interaction.targetId);
      if (message) {
        await interaction.editReply({ content: "I'm sending you a DM!", ephemeral: true });
        const embed = u.embed()
          .setAuthor(message.member?.displayName || message.author?.username, message.author?.displayAvatarURL({ size: 16 }), message.url)
          .setDescription(message.cleanContent)
          .setColor(message.member?.displayColor)
          .setTimestamp(message.createdAt);
        interaction.user.send({ embeds: [embed].concat(message.embeds), files: Array.from(message.attachments.values()) });
      } else {
        interaction.editReply({ content: "Against all odds, I couldn't find that message.", ephemeral: true });
      }
    } catch (error) {
      u.errorHandler(error, interaction);
    }
  }
});

module.exports = Module;
