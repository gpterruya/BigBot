require('dotenv').config();
const { Client, GatewayIntentBits, Events } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, AudioPlayer } = require('@discordjs/voice');
const path = require('path');
const fs = require('fs');

// Criar cliente do Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Quando o bot estiver pronto
client.once(Events.ClientReady, () => {
    console.log(`${client.user.tag} está online!`);
});

// Comandos de música
client.on(Events.MessageCreate, async (message) => {
    if (!message.guild || message.author.bot) return;

    const args = message.content.split(' ');
    const command = args.shift().toLowerCase();

    if (command === '!play') {
        const songName = args.join(' ');  // Nome do arquivo de música

        // Verificar se o nome do arquivo foi fornecido
        if (!songName) return message.reply('Você precisa fornecer o nome do arquivo de música!');

        // Construir o caminho para o arquivo de música
        const filePath = path.join(__dirname, 'music', songName);

        // Verificar se o arquivo existe
        if (!fs.existsSync(filePath)) return message.reply('Arquivo de música não encontrado!');

        // Conectar ao canal de voz
        const channel = message.member.voice.channel;
        if (!channel) return message.reply('Você precisa estar em um canal de voz!');

        // Criar o recurso de áudio
        const resource = createAudioResource(filePath);

        // Criar o player de áudio
        const player = createAudioPlayer();
        player.play(resource);

        // Conectar ao canal de voz e tocar a música
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: message.guild.id,
            adapterCreator: message.guild.voiceAdapterCreator
        });

        connection.on('stateChange', (oldState, newState) => {
            if (newState.status === AudioPlayerStatus.Idle) {
                connection.destroy();
            }
        });

        connection.subscribe(player);
        message.reply(`🎶 | Tocando **${songName}**`);
    }

    if (command === '!stop') {
        const connection = getVoiceConnection(message.guild.id);
        if (!connection) return message.reply('Nenhuma música está tocando!');

        connection.destroy();
        message.reply('Música parada!');
    }
});

// Login do bot
client.login(process.env.DISCORD_TOKEN);
