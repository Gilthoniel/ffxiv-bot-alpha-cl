const knex = require('knex');
const knexfile = require('../knexfile');

const TABLE_ROLE_MESSAGE = 'role_message';
const TABLE_ROLE_EMOJI = 'role_emoji';
const TABLE_TREASURE_HUNT = 'treasure_hunt';

module.exports = {
  db: knex(knexfile),

  TABLE_ROLE_MESSAGE,
  TABLE_ROLE_EMOJI,
  TABLE_TREASURE_HUNT,
};
