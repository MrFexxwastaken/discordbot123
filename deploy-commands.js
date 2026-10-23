
require('dotenv').config();

const {
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
} = require('discord.js');

const commands = [
  // GENERAL
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show all Zyntra commands'),

  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot latency'),

  new SlashCommandBuilder()
    .setName('botinfo')
    .setDescription('Show information about Zyntra'),

  new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Show information about this server'),

  new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Show information about a user')
    .addUserOption(o =>
      o.setName('user')
        .setDescription('User to inspect')
        .setRequired(false)),

  // MODERATION
  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(o =>
      o.setName('user').setDescription('Member to ban').setRequired(true))
    .addStringOption(o =>
      o.setName('reason').setDescription('Reason for the ban')),

  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(o =>
      o.setName('user').setDescription('Member to kick').setRequired(true))
    .addStringOption(o =>
      o.setName('reason').setDescription('Reason for the kick')),

  new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o =>
      o.setName('user').setDescription('Member to timeout').setRequired(true))
    .addIntegerOption(o =>
      o.setName('minutes')
        .setDescription('Duration in minutes')
        .setMinValue(1)
        .setMaxValue(40320)
        .setRequired(true))
    .addStringOption(o =>
      o.setName('reason').setDescription('Reason')),

  new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('Remove a member timeout')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o =>
      o.setName('user').setDescription('Member to untimeout').setRequired(true)),

  new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o =>
      o.setName('user').setDescription('Member to warn').setRequired(true))
    .addStringOption(o =>
      o.setName('reason').setDescription('Reason').setRequired(true)),

  new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete recent messages')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(o =>
      o.setName('amount')
        .setDescription('Number of messages')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('lockdown')
    .setDescription('Lock the current channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Unlock the current channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Set channel slowmode')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addIntegerOption(o =>
      o.setName('seconds')
        .setDescription('Delay between messages')
        .setMinValue(0)
        .setMaxValue(21600)
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('clearwarns')
    .setDescription('Clear a member warning records')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o =>
      o.setName('user').setDescription('Member').setRequired(true)),

  // SECURITY
  new SlashCommandBuilder()
    .setName('antispam')
    .setDescription('Configure anti-spam protection')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addBooleanOption(o =>
      o.setName('enabled')
        .setDescription('Enable or disable anti-spam')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('antilink')
    .setDescription('Configure link protection')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addBooleanOption(o =>
      o.setName('enabled')
        .setDescription('Enable or disable link protection')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('setmodlog')
    .setDescription('Set the moderation log channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(o =>
      o.setName('channel')
        .setDescription('Log channel')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)),

  // TICKETS
  new SlashCommandBuilder()
    .setName('ticketpanel')
    .setDescription('Create a support ticket panel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption(o =>
      o.setName('channel')
        .setDescription('Panel channel')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('ticketclose')
    .setDescription('Close the current ticket'),

  new SlashCommandBuilder()
    .setName('ticketclaim')
    .setDescription('Claim the current ticket')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder()
    .setName('ticketadd')
    .setDescription('Add a member to the current ticket')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addUserOption(o =>
      o.setName('user').setDescription('Member to add').setRequired(true)),

  new SlashCommandBuilder()
    .setName('ticketremove')
    .setDescription('Remove a member from the current ticket')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addUserOption(o =>
      o.setName('user').setDescription('Member to remove').setRequired(true)),

  new SlashCommandBuilder()
    .setName('ticketsetup')
    .setDescription('Configure ticket categories and staff roles')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  // LEVELS
  new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Show your level and XP')
    .addUserOption(o =>
      o.setName('user').setDescription('Member to check')),

  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show the server XP leaderboard'),

  new SlashCommandBuilder()
    .setName('levelsettings')
    .setDescription('Configure the leveling system')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addBooleanOption(o =>
      o.setName('enabled')
        .setDescription('Enable or disable leveling')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('setlevelrole')
    .setDescription('Set a reward role for a level')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addIntegerOption(o =>
      o.setName('level')
        .setDescription('Required level')
        .setMinValue(1)
        .setMaxValue(1000)
        .setRequired(true))
    .addRoleOption(o =>
      o.setName('role').setDescription('Reward role').setRequired(true)),

  // CONFIGURATION
  new SlashCommandBuilder()
    .setName('setwelcome')
    .setDescription('Configure the welcome channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption(o =>
      o.setName('channel')
        .setDescription('Welcome channel')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('setautorole')
    .setDescription('Configure the role given to new members')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addRoleOption(o =>
      o.setName('role').setDescription('Role for new members')
        .setRequired(true)),
].map(command => command.toJSON());

async function main() {
  const { DISCORD_TOKEN, CLIENT_ID } = process.env;

  if (!DISCORD_TOKEN || !CLIENT_ID) {
    throw new Error(
      'DISCORD_TOKEN and CLIENT_ID must be set in the .env file.'
    );
  }

  const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

  await rest.put(
    Routes.applicationCommands(CLIENT_ID),
    { body: commands }
  );

  console.log(
    `Zyntra: successfully registered ${commands.length} global slash commands.`
  );
}

main().catch(error => {
  console.error('Failed to register Zyntra commands:', error);
  process.exitCode = 1;
});
