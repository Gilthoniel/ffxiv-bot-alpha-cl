const https = require('https');
const { Permissions } = require('discord.js');
const logger = require('../logger');
const { db, TABLE_TREASURE_HUNT } = require('../db/db');

function match(message) {
  const { channel, author, client } = message;

  if (channel.type !== 'dm' || author.id === client.user.id) {
    return false;
  }

  return true;
}

function readDistantFile(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      let content = '';
      response.on('data', (chunk) => {
        content += chunk.toString();
      });
      response.on('end', () => resolve(content));
      response.on('error', reject);
    });
  });
}

function findMember(message) {
  const { client, author } = message;

  const key = client.guilds.findKey(g => g.members.has(author.id));
  if (!key) {
    return undefined;
  }

  return client.guilds.get(key).members.get(author.id);
}

exports.startTreasureHunt = async (message) => {
  const { attachments } = message;

  if (!match(message)) {
    // ignore everything not a direct message to the bot.
    return Promise.resolve();
  }

  const member = findMember(message);
  if (!member) {
    logger.error('no guild in common with the user');
    return Promise.resolve();
  }

  if (!member.hasPermission(Permissions.FLAGS.ADMINISTRATOR)) {
    logger.error('user is not an administrator');
  }

  const ma = attachments.first();
  if (!ma) {
    return Promise.resolve();
  }

  if (ma.filesize > 1024 * 1024 * 1024) {
    logger.error('file is too big');
    return Promise.resolve();
  }

  // TODO: stream
  const content = await readDistantFile(ma.url);
  await db.transaction(async (tx) => {
    await tx(TABLE_TREASURE_HUNT)
      .where('guild_id', member.guild.id)
      .delete();

    const promises = content.split(/\r?\n/).map((line) => {
      const [key, value] = line.split(/=>/);
      if (!key || !value) {
        return Promise.resolve();
      }

      return tx(TABLE_TREASURE_HUNT).insert({
        guild_id: member.guild.id,
        key: key.trim(),
        value: value.trim(),
      });
    });

    await Promise.all(promises);
  });

  await message.reply('A new treasure hunt has started !');

  return Promise.resolve();
};

exports.askTreasureHunt = async (message) => {
  if (!match(message)) {
    // ignore everything not a direct message to the bot.
    return Promise.resolve();
  }

  const member = findMember(message);
  if (!member) {
    return Promise.resolve();
  }

  const line = await db(TABLE_TREASURE_HUNT)
    .select()
    .where({ guild_id: member.guild.id, key: message.content })
    .first();

  if (line) {
    message.reply(line.value);
  }

  return Promise.resolve();
};
