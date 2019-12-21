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

// Look for all the guilds that the author of the message and the bot share. It
// then returns the member object for each guild matching.
function findMutualGuilds(message) {
  const { client, author } = message;

  const members = client.guilds.reduce((acc, guild) => {
    const member = guild.members.find(m => m.id === author.id);
    if (member) {
      return [...acc, member];
    }

    return acc;
  }, []);

  return members.filter(m => m.hasPermission(Permissions.FLAGS.ADMINISTRATOR));
}

exports.startTreasureHunt = async (message) => {
  const { attachments } = message;

  if (!match(message)) {
    // ignore everything not a direct message to the bot.
    return Promise.resolve();
  }

  const members = findMutualGuilds(message);
  if (members.length === 0) {
    logger.error('no guild in common with the user');
    return Promise.resolve();
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
    const ids = members.map(m => m.guild.id);

    await tx(TABLE_TREASURE_HUNT)
      .whereIn('guild_id', ids)
      .delete();

    const promises = content.split(/\r?\n/).map((line) => {
      const [key, value] = line.split(/=>/);
      if (!key || !value) {
        return Promise.resolve();
      }

      return tx(TABLE_TREASURE_HUNT).insert(members.map(m => ({
        guild_id: m.guild.id,
        key: key.trim(),
        value: value.trim(),
      })));
    });

    await Promise.all(promises);
  });

  const guilds = members.map(m => m.guild.name).join(', ');
  await message.reply(`A new treasure hunt has started for guilds: ${guilds}`);

  return Promise.resolve();
};

exports.askTreasureHunt = async (message) => {
  if (!match(message) || message.content === '') {
    // ignore everything not a direct message to the bot.
    return Promise.resolve();
  }

  const members = findMutualGuilds(message);
  if (members.length === 0) {
    return Promise.resolve();
  }

  const line = await db(TABLE_TREASURE_HUNT)
    .select()
    .whereIn('guild_id', members.map(m => m.guild.id))
    .where({ key: message.content })
    .first();

  if (line) {
    message.reply(line.value);
  } else {
    message.reply('Essayez encore!');
  }

  return Promise.resolve();
};
