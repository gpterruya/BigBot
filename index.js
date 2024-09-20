require('dotenv').config();
const { Client, GatewayIntentBits, Events } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, getVoiceConnection } = require('@discordjs/voice');
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

// Função para buscar arquivos de música na pasta 'music'
function findMusicFile(term) {
    const musicFolder = path.join(__dirname, 'music');
    const files = fs.readdirSync(musicFolder);
    // Filtrar arquivos que contêm o termo no nome
    const matchedFiles = files.filter(file => file.toLowerCase().includes(term.toLowerCase()));
    return matchedFiles.length > 0 ? matchedFiles[0] : null;
}

// Comandos de música
client.on(Events.MessageCreate, async (message) => {
    if (!message.guild || message.author.bot) return;

    const args = message.content.split(' ');
    const command = args.shift().toLowerCase();

    if (command === '!play') {
        const searchTerm = args.join(' ');  // Termo de pesquisa

        // Verificar se o termo de pesquisa foi fornecido
        if (!searchTerm) return message.reply('Você precisa fornecer um termo de pesquisa!');

        // Buscar o arquivo de música
        const songName = findMusicFile(searchTerm);
        if (!songName) return message.reply('Nenhuma música encontrada com esse termo!');

        // Construir o caminho para o arquivo de música
        const filePath = path.join(__dirname, 'music', songName);

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

    if (message.content === '!list') {
        // Caminho da pasta onde estão as músicas
        const musicFolder = path.join(__dirname, 'music');
        
        // Lê os arquivos da pasta de músicas
        fs.readdir(musicFolder, (err, files) => {
            if (err) {
                console.error(err);
                return message.channel.send('Ocorreu um erro ao tentar acessar a pasta de músicas.');
            }

            // Filtra apenas os arquivos com extensão de áudio (ex: .mp3, .wav)
            const musicFiles = files.filter(file => file.endsWith('.mp3') || file.endsWith('.wav'));

            if (musicFiles.length === 0) {
                return message.channel.send('Não há músicas disponíveis na pasta.');
            }

            // Envia a lista de músicas
            message.channel.send(`Músicas disponíveis:\n${musicFiles.join('\n')}`);
        });
    }
});

// Login do bot
client.login(process.env.DISCORD_TOKEN);
