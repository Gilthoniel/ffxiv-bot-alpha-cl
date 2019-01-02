const { Permissions } = require('discord.js');
const logger = require('../logger');
const { db, TABLE_ROLE_EMOJI } = require('../db/db');

exports.addRole = async ({ role_id: roleId }, user, message) => {
  logger.info(`add role for user ${user.id}`);
  const { guild } = message;

  const member = guild.member(user);
  if (!member) {
    logger.error(`Cannot find the guild member with id ${user.id}`);
    return;
  }

  await member.addRole(roleId);
};

exports.removeRole = async ({ role_id: roleId }, user, reaction) => {
  logger.info(`remove role for user ${user.id}`);
  const { message, users } = reaction;
  const { guild } = message;

  const member = guild.member(user);
  if (!member) {
    logger.error(`Cannot find the guild member with id ${user.id}`);
    return;
  }

  if (member.hasPermission(Permissions.FLAGS.ADMINISTRATOR)) {
    // first remove the reaction from the message
    await Promise.all(users.map(u => reaction.remove(u)));
    // then remove the role binding
    await db(TABLE_ROLE_EMOJI).where({ message_id: message.id, role_id: roleId }).delete();
  } else {
    await member.removeRole(roleId);
  }
};
