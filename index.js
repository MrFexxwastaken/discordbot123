
require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');
const {
  Client,
  GatewayIntentBits,
  Events,
  PermissionFlagsBits,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const DATA_FILE = path.join(__dirname, 'zyntra-data.json');

function loadData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return {};
  }
}

const data = loadData();

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function guildData(guildId) {
  data[guildId] ??= {
    warnings: {},
    settings: {
      antispam: false,
      antilink: false,
      leveling: true,
    },
    xp: {},
    levelRoles: {},
  };
  return data[guildId];
}

function isAdmin(interaction) {
  return interaction.memberPermissions?.has(
    PermissionFlagsBits.Administrator
  );
}

function can(interaction, permission) {
  return interaction.memberPermissions?.has(permission);
}

function replyError(interaction, content) {
  return interaction.reply({ content, ephemeral: true });
}

function levelForXp(xp) {
  return Math.floor(Math.sqrt(xp / 100));
}

function xpForNextLevel(level) {
  return (level + 1) ** 2 * 100;
}

client.once(Events.ClientReady, (bot) => {
  console.log(`✅ ${bot.user.tag} ist online!`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    const db = interaction.guild
      ? guildData(interaction.guild.id)
      : null;

    // Ticketpanel-Button
    if (interaction.isButton()) {
      if (interaction.customId === 'zyntra_ticket_create') {
        const guild = interaction.guild;
        const existing = guild.channels.cache.find(
          c => c.topic === `ticket-owner:${interaction.user.id}`
        );

        if (existing) {
          return interaction.reply({
            content: `Du hast bereits ein Ticket: ${existing}`,
            ephemeral: true,
          });
        }

        const channel = await guild.channels.create({
          name: `ticket-${interaction.user.username}`
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '')
            .slice(0, 80),
          type: ChannelType.GuildText,
          topic: `ticket-owner:${interaction.user.id}`,
          permissionOverwrites: [
            { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: interaction.user.id, allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
            ] },
            { id: client.user.id, allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ManageChannels,
              PermissionFlagsBits.ReadMessageHistory,
            ] },
          ],
        });

        return interaction.reply({
          content: `🎫 Dein Ticket wurde erstellt: ${channel}`,
          ephemeral: true,
        });
      }

      if (interaction.customId === 'zyntra_ticket_close') {
        if (!interaction.channel.name.startsWith('ticket-')) {
          return replyError(interaction, 'Das ist kein Ticketkanal.');
        }

        await interaction.reply('🔒 Ticket wird in 5 Sekunden geschlossen.');
        setTimeout(() => {
          interaction.channel.delete('Ticket geschlossen').catch(console.error);
        }, 5000);
        return;
      }
    }

    if (!interaction.isChatInputCommand()) return;

    const command = interaction.commandName;

    // Allgemeine Commands
    if (command === 'ping') {
      return interaction.reply(`🏓 Pong! ${client.ws.ping} ms`);
    }

    if (command === 'help') {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('🤖 Zyntra – Commands')
            .setDescription(
              '**Allgemein:** `/help` `/ping` `/botinfo` `/serverinfo` `/userinfo`\n' +
              '**Moderation:** `/ban` `/kick` `/timeout` `/untimeout` `/warn` `/purge` `/lockdown` `/unlock` `/slowmode` `/clearwarns`\n' +
              '**Security:** `/antispam` `/antilink` `/setmodlog`\n' +
              '**Tickets:** `/ticketpanel` `/ticketclose` `/ticketclaim` `/ticketadd` `/ticketremove` `/ticketsetup`\n' +
              '**Level:** `/rank` `/leaderboard` `/levelsettings` `/setlevelrole`\n' +
              '**Setup:** `/setwelcome` `/setautorole`'
            ),
        ],
        ephemeral: true,
      });
    }

    if (command === 'botinfo') {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('Zyntra')
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
              { name: 'Server', value: String(client.guilds.cache.size), inline: true },
              { name: 'Ping', value: `${client.ws.ping} ms`, inline: true },
              { name: 'Library', value: 'discord.js', inline: true },
            ),
        ],
        ephemeral: true,
      });
    }

    if (command === 'serverinfo') {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(interaction.guild.name)
            .setThumbnail(interaction.guild.iconURL())
            .addFields(
              { name: 'Mitglieder', value: String(interaction.guild.memberCount), inline: true },
              { name: 'Kanäle', value: String(interaction.guild.channels.cache.size), inline: true },
              { name: 'Erstellt', value: `<t:${Math.floor(interaction.guild.createdTimestamp / 1000)}:D>` },
            ),
        ],
        ephemeral: true,
      });
    }

    if (command === 'userinfo') {
      const user = interaction.options.getUser('user') ?? interaction.user;
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(`Benutzer: ${user.tag}`)
            .setThumbnail(user.displayAvatarURL())
            .addFields(
              { name: 'ID', value: user.id },
              { name: 'Account erstellt', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:D>` },
            ),
        ],
        ephemeral: true,
      });
    }

    if (!interaction.inGuild()) {
      return replyError(interaction, 'Dieser Befehl funktioniert nur auf einem Server.');
    }

    const guild = interaction.guild;
    const user = interaction.options.getUser('user');
    const member = user
      ? await guild.members.fetch(user.id).catch(() => null)
      : null;
    const reason = interaction.options.getString('reason') || 'Kein Grund angegeben';

    // Moderation
    if (command === 'ban') {
      if (!can(interaction, PermissionFlagsBits.BanMembers))
        return replyError(interaction, 'Dir fehlt die Berechtigung zum Bannen.');
      if (!user) return replyError(interaction, 'Nutzer nicht gefunden.');
      if (member && !member.bannable)
        return replyError(interaction, 'Ich kann diesen Nutzer nicht bannen. Prüfe meine Rollenposition.');
      await guild.members.ban(user.id, { reason });
      return interaction.reply(`🔨 **${user.tag}** wurde gebannt. Grund: ${reason}`);
    }

    if (command === 'kick') {
      if (!can(interaction, PermissionFlagsBits.KickMembers))
        return replyError(interaction, 'Dir fehlt die Berechtigung zum Kicken.');
      if (!member || !member.kickable)
        return replyError(interaction, 'Ich kann diesen Nutzer nicht kicken.');
      await member.kick(reason);
      return interaction.reply(`👢 **${user.tag}** wurde gekickt. Grund: ${reason}`);
    }

    if (command === 'timeout') {
      if (!can(interaction, PermissionFlagsBits.ModerateMembers))
        return replyError(interaction, 'Dir fehlt die Berechtigung zum Timeout.');
      if (!member || !member.moderatable)
        return replyError(interaction, 'Ich kann diesen Nutzer nicht in den Timeout setzen.');
      const minutes = interaction.options.getInteger('minutes');
      await member.timeout(minutes * 60000, reason);
      return interaction.reply(`🔇 **${user.tag}** erhielt ${minutes} Minuten Timeout.`);
    }

    if (command === 'untimeout') {
      if (!can(interaction, PermissionFlagsBits.ModerateMembers))
        return replyError(interaction, 'Dir fehlt die Berechtigung zum Timeout-Entfernen.');
      if (!member || !member.moderatable)
        return replyError(interaction, 'Ich kann den Timeout nicht entfernen.');
      await member.timeout(null, reason);
      return interaction.reply(`🔊 Timeout von **${user.tag}** entfernt.`);
    }

    if (command === 'warn') {
      if (!can(interaction, PermissionFlagsBits.ModerateMembers))
        return replyError(interaction, 'Dir fehlt die Berechtigung zum Verwarnen.');
      if (!user || user.bot || user.id === interaction.user.id)
        return replyError(interaction, 'Dieser Nutzer kann nicht verwarnt werden.');
      db.warnings[user.id] ??= [];
      db.warnings[user.id].push({
        reason,
        moderator: interaction.user.id,
        date: new Date().toISOString(),
      });
      saveData();
      return interaction.reply(`⚠️ **${user.tag}** wurde verwarnt. Verwarnungen: ${db.warnings[user.id].length}. Grund: ${reason}`);
    }

    if (command === 'clearwarns') {
      if (!can(interaction, PermissionFlagsBits.ModerateMembers))
        return replyError(interaction, 'Dir fehlt die Berechtigung.');
      if (!user) return replyError(interaction, 'Nutzer fehlt.');
      const count = db.warnings[user.id]?.length ?? 0;
      delete db.warnings[user.id];
      saveData();
      return interaction.reply(`🧹 ${count} Verwarnungen von **${user.tag}** gelöscht.`);
    }

    if (command === 'purge') {
      if (!can(interaction, PermissionFlagsBits.ManageMessages))
        return replyError(interaction, 'Dir fehlt die Berechtigung zum Löschen von Nachrichten.');
      await interaction.deferReply({ ephemeral: true });
      const amount = interaction.options.getInteger('amount');
      const deleted = await interaction.channel.bulkDelete(amount, true);
      return interaction.editReply(`🧹 ${deleted.size} Nachrichten gelöscht.`);
    }

    if (command === 'lockdown' || command === 'unlock') {
      if (!can(interaction, PermissionFlagsBits.ManageChannels))
        return replyError(interaction, 'Dir fehlt die Berechtigung zum Verwalten von Kanälen.');
      await interaction.channel.permissionOverwrites.edit(
        guild.roles.everyone,
        { SendMessages: command === 'lockdown' ? false : null }
      );
      return interaction.reply(command === 'lockdown'
        ? '🔒 Kanal gesperrt.'
        : '🔓 Kanalsperre aufgehoben.');
    }

    if (command === 'slowmode') {
      if (!can(interaction, PermissionFlagsBits.ManageChannels))
        return replyError(interaction, 'Dir fehlt die Berechtigung.');
      const seconds = interaction.options.getInteger('seconds');
      await interaction.channel.setRateLimitPerUser(seconds);
      return interaction.reply(seconds === 0
        ? '⏱️ Slowmode deaktiviert.'
        : `⏱️ Slowmode auf ${seconds} Sekunden gesetzt.`);
    }

    // Security-Konfiguration
    if (command === 'antispam' || command === 'antilink') {
      if (!isAdmin(interaction)) return replyError(interaction, 'Nur Administratoren können das einstellen.');
      const key = command === 'antispam' ? 'antispam' : 'antilink';
      db.settings[key] = interaction.options.getBoolean('enabled');
      saveData();
      return interaction.reply(`🛡️ ${key} ist jetzt ${db.settings[key] ? 'aktiviert' : 'deaktiviert'}.`);
    }

    if (command === 'setmodlog') {
      if (!isAdmin(interaction)) return replyError(interaction, 'Nur Administratoren können das einstellen.');
      db.settings.modlog = interaction.options.getChannel('channel').id;
      saveData();
      return interaction.reply('📝 Moderations-Log-Kanal gespeichert.');
    }

    // Tickets
    if (command === 'ticketpanel') {
      if (!can(interaction, PermissionFlagsBits.ManageGuild))
        return replyError(interaction, 'Dir fehlt die Berechtigung Server verwalten.');
      const channel = interaction.options.getChannel('channel');
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('zyntra_ticket_create')
          .setLabel('Ticket erstellen')
          .setEmoji('🎫')
          .setStyle(ButtonStyle.Primary)
      );
      await channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('🎫 Support')
            .setDescription('Klicke auf den Button, um ein privates Support-Ticket zu erstellen.'),
        ],
        components: [row],
      });
      return interaction.reply({ content: `Ticketpanel in ${channel} erstellt.`, ephemeral: true });
    }

    if (command === 'ticketclose') {
      if (!interaction.channel.name.startsWith('ticket-'))
        return replyError(interaction, 'Du bist nicht in einem Ticketkanal.');
      await interaction.reply('🔒 Ticket wird in 5 Sekunden geschlossen.');
      setTimeout(() => interaction.channel.delete().catch(console.error), 5000);
      return;
    }

    if (command === 'ticketclaim') {
      if (!can(interaction, PermissionFlagsBits.ManageChannels))
        return replyError(interaction, 'Dir fehlt die Berechtigung.');
      if (!interaction.channel.name.startsWith('ticket-'))
        return replyError(interaction, 'Das ist kein Ticketkanal.');
      await interaction.channel.setTopic(`${interaction.channel.topic || ''} | claimed:${interaction.user.id}`);
      return interaction.reply(`✅ Ticket übernommen von ${interaction.user}.`);
    }

    if (command === 'ticketadd' || command === 'ticketremove') {
      if (!can(interaction, PermissionFlagsBits.ManageChannels))
        return replyError(interaction, 'Dir fehlt die Berechtigung.');
      if (!interaction.channel.name.startsWith('ticket-'))
        return replyError(interaction, 'Das ist kein Ticketkanal.');
      const target = interaction.options.getUser('user');
      if (command === 'ticketadd') {
        await interaction.channel.permissionOverwrites.edit(target.id, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true,
        });
        return interaction.reply(`➕ ${target} wurde zum Ticket hinzugefügt.`);
      }
      await interaction.channel.permissionOverwrites.delete(target.id);
      return interaction.reply(`➖ ${target} wurde aus dem Ticket entfernt.`);
    }

    if (command === 'ticketsetup') {
      if (!isAdmin(interaction)) return replyError(interaction, 'Nur Administratoren können das einstellen.');
      db.settings.ticketSetup = true;
      saveData();
      return interaction.reply('🎫 Ticket-Grundsetup aktiviert. Nutze `/ticketpanel`, um ein Panel zu posten.');
    }

    // Levelsystem
    if (command === 'levelsettings') {
      if (!isAdmin(interaction)) return replyError(interaction, 'Nur Administratoren können das einstellen.');
      db.settings.leveling = interaction.options.getBoolean('enabled');
      saveData();
      return interaction.reply(`📈 Levelsystem ${db.settings.leveling ? 'aktiviert' : 'deaktiviert'}.`);
    }

    if (command === 'setlevelrole') {
      if (!can(interaction, PermissionFlagsBits.ManageRoles))
        return replyError(interaction, 'Dir fehlt die Berechtigung Rollen zu verwalten.');
      const level = interaction.options.getInteger('level');
      const role = interaction.options.getRole('role');
      db.levelRoles[level] = role.id;
      saveData();
      return interaction.reply(`🏆 ${role} als Belohnung für Level ${level} gespeichert.`);
    }

    if (command === 'rank' || command === 'leaderboard') {
      const target = interaction.options.getUser('user') ?? interaction.user;
      if (command === 'rank') {
        const xp = db.xp[target.id]?.xp ?? 0;
        const level = levelForXp(xp);
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0x5865F2)
              .setTitle(`📈 Rang von ${target.username}`)
              .setDescription(`**Level:** ${level}\n**XP:** ${xp}\n**Nächstes Level:** ${xpForNextLevel(level)} XP`),
          ],
          ephemeral: true,
        });
      }

      const rows = Object.entries(db.xp)
        .sort((a, b) => b[1].xp - a[1].xp)
        .slice(0, 10);

      const description = rows.length
        ? rows.map(([id, info], i) => `**${i + 1}.** <@${id}> — Level ${levelForXp(info.xp)}, ${info.xp} XP`).join('\n')
        : 'Noch keine XP gesammelt.';

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('🏆 XP-Leaderboard')
            .setDescription(description),
        ],
      });
    }

    // Serverkonfiguration
    if (command === 'setwelcome') {
      if (!can(interaction, PermissionFlagsBits.ManageGuild))
        return replyError(interaction, 'Dir fehlt die Berechtigung Server verwalten.');
      db.settings.welcomeChannel = interaction.options.getChannel('channel').id;
      saveData();
      return interaction.reply('👋 Willkommenskanal gespeichert.');
    }

    if (command === 'setautorole') {
      if (!can(interaction, PermissionFlagsBits.ManageRoles))
        return replyError(interaction, 'Dir fehlt die Berechtigung Rollen zu verwalten.');
      const role = interaction.options.getRole('role');
      if (role.managed || role.position >= interaction.guild.members.me.roles.highest.position)
        return replyError(interaction, 'Ich kann diese Rolle nicht vergeben. Verschiebe meine Bot-Rolle über die Zielrolle.');
      db.settings.autoRole = role.id;
      saveData();
      return interaction.reply(`👥 Auto-Rolle ${role} gespeichert.`);
    }

    return replyError(interaction, `Der Befehl /${command} ist noch nicht implementiert.`);
  } catch (error) {
    console.error(`Fehler bei /${interaction.commandName}:`, error);

    const response = {
      content: '❌ Beim Ausführen ist ein Fehler aufgetreten. Sieh im Terminal nach.',
      ephemeral: true,
    };

    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(response).catch(console.error);
    } else {
      await interaction.reply(response).catch(console.error);
    }
  }
});

// XP, Anti-Spam, Anti-Link, Willkommensnachricht und Auto-Rolle
const recentMessages = new Map();

client.on(Events.MessageCreate, async (message) => {
  if (!message.guild || message.author.bot) return;

  const db = guildData(message.guild.id);
  const member = message.member;

  if (db.settings.autoRole && member) {
    // Auto-Rolle wird beim Join vergeben, nicht bei jeder Nachricht.
  }

  if (db.settings.antilink && /(https?:\/\/|discord\.gg\/)/i.test(message.content)) {
    if (!member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      await message.delete().catch(() => {});
      const notice = await message.channel.send(`${message.author}, Links sind hier nicht erlaubt.`);
      setTimeout(() => notice.delete().catch(() => {}), 5000);
      return;
    }
  }

  if (db.settings.antispam) {
    const key = `${message.guild.id}:${message.author.id}`;
    const now = Date.now();
    const times = (recentMessages.get(key) ?? []).filter(t => now - t < 5000);
    times.push(now);
    recentMessages.set(key, times);

    if (times.length >= 6 && member && !member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      await message.delete().catch(() => {});
      await member.timeout(60_000, 'Zyntra Anti-Spam').catch(() => {});
      return;
    }
  }

  if (db.settings.leveling) {
    db.xp[message.author.id] ??= { xp: 0, lastMessage: 0 };
    const profile = db.xp[message.author.id];

    if (Date.now() - profile.lastMessage >= 60000) {
      const oldLevel = levelForXp(profile.xp);
      profile.xp += Math.floor(Math.random() * 11) + 15;
      profile.lastMessage = Date.now();
      const newLevel = levelForXp(profile.xp);

      if (newLevel > oldLevel) {
        await message.channel.send(`🎉 ${message.author}, du bist jetzt Level **${newLevel}**!`);
        const roleId = db.levelRoles[newLevel];
        const role = roleId ? message.guild.roles.cache.get(roleId) : null;

        if (role && member.manageable) {
          await member.roles.add(role).catch(console.error);
        }
      }

      saveData();
    }
  }
});

client.on(Events.GuildMemberAdd, async (member) => {
  const db = guildData(member.guild.id);

  if (db.settings.autoRole) {
    const role = member.guild.roles.cache.get(db.settings.autoRole);
    if (role) await member.roles.add(role).catch(console.error);
  }

  if (db.settings.welcomeChannel) {
    const channel = member.guild.channels.cache.get(db.settings.welcomeChannel);
    if (channel?.isTextBased()) {
      await channel.send(`👋 Willkommen ${member} auf **${member.guild.name}**!`);
    }
  }

  saveData();
});

if (!process.env.DISCORD_TOKEN) {
  console.error('❌ DISCORD_TOKEN fehlt in deiner .env-Datei.');
  process.exit(1);
}

client.login(process.env.DISCORD_TOKEN).catch(error => {
  console.error('❌ Login fehlgeschlagen:', error);
});
