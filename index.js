const Discord = require('discord.js');
const logger = require('./logger');
const auth = require('./auth.json');
const { db, TABLE_ROLE_MESSAGE, TABLE_ROLE_EMOJI } = require('./db/db');
const initRole = require('./commands/init-role');
const { addRole, removeRole } = require('./commands/update-user-role');

const bot = new Discord.Client();

bot.on('ready', () => {
  logger.info('Connected');
  logger.info(`Logged in as: ${bot.user.tag}`);
});

bot.on('message', async (message) => {
  if (message.content === '!alpha-roles') {
    const msg = await message.channel.send('Click on the emoji to subscribe to channels');

    try {
      await db(TABLE_ROLE_MESSAGE).insert({ id: msg.id });
    } catch (e) {
      logger.error(`Failed to save the message reference: ${e.message}`);
      logger.error(e.stack);
    }
  }
});

async function isRoleMessage(reaction) {
  const { message, emoji } = reaction;
  const item = await db(TABLE_ROLE_MESSAGE).where({ id: message.id }).first();

  if (!item) {
    // message not initialized with the bot
    return false;
  }

  return db(TABLE_ROLE_EMOJI)
    .where({ message_id: message.id, emoji_id: emoji.id })
    .first();
}

bot.on('messageReactionAdd', async (r, user) => {
  const { message } = r;
  try {
    const e = await isRoleMessage(r);

    if (!e) {
      await initRole(r, user, bot);
      return;
    }

    await addRole(e, user, message);
  } catch (e) {
    logger.error(`Error in messageReactionAdd: ${e.message}`);
    logger.error(e.stack);
  }
});

bot.on('messageReactionRemove', async (r, user) => {
  try {
    const e = await isRoleMessage(r);

    if (e) {
      await removeRole(e, user, r);
    }
  } catch (e) {
    logger.error(`error in messageReactionRemove: ${e.message}`);
    logger.error(e.stack);
  }
});

// trigger reaction events even for non-cached messages
bot.on('raw', async (packet) => {
  if (!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(packet.t)) {
    return;
  }

  const channel = bot.channels.get(packet.d.channel_id);

  if (channel.messages.has(packet.d.message_id)) {
    return;
  }

  channel.fetchMessage(packet.d.message_id).then((message) => {
    const emoji = packet.d.emoji.id ? `${packet.d.emoji.name}:${packet.d.emoji.id}` : packet.d.emoji.name;
    const reaction = message.reactions.get(emoji) || {
      message,
      emoji: { id: packet.d.emoji.id },
    };

    if (packet.t === 'MESSAGE_REACTION_ADD') {
      bot.emit('messageReactionAdd', reaction, bot.users.get(packet.d.user_id));
    }
    if (packet.t === 'MESSAGE_REACTION_REMOVE') {
      bot.emit('messageReactionRemove', reaction, bot.users.get(packet.d.user_id));
    }
  });
});

bot.on('error', e => logger.error(e.stack));

bot.login(auth.token);
