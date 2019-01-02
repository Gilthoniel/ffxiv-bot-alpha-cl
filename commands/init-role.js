const { Permissions } = require('discord.js');
const { db, TABLE_ROLE_EMOJI } = require('../db/db');

const LISTENER_TIMEOUT = 5 * 60 * 1000; // 5min

module.exports = async (reaction, user, bot) => {
  const { id, guild } = reaction.message;
  const member = guild.member(user);

  if (!member || !member.hasPermission(Permissions.FLAGS.ADMINISTRATOR)) {
    await reaction.remove(user);
    return;
  }

  let timer;

  const listener = async (message) => {
    const { channel, author } = message;
    if (channel.type !== 'dm' || author.id !== user.id) {
      // ignore messages that are not the answer from the admin
      return;
    }

    const role = guild.roles.find(r => r.name === message.content);
    if (!role) {
      message.channel.send('Role unknown');
      return;
    }

    bot.off('message', listener);
    clearTimeout(timer);

    // add the emoji as a reference for the role
    await db(TABLE_ROLE_EMOJI).insert({
      message_id: id,
      role_id: role.id,
      emoji_id: reaction.emoji.id,
    });

    await member.send('Role assigné');
  };

  // sent before we start listening to avoid emitting the message
  await member.send(reaction.emoji.name);

  bot.on('message', listener);

  // just in case the admin doesn't answer, we clean the reaction
  timer = setTimeout(async () => {
    bot.off('message', listener);
    await reaction.remove(user);
  }, LISTENER_TIMEOUT);
};
