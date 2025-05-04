const { Client: DiscordClient, GatewayIntentBits, AttachmentBuilder, Events: DiscordEvents, WebhookClient, ActivityType, ChannelType } = require("discord.js");
const { Client: RevoltClient } = require("revolt.js");
const axios = require('axios');
const config = require("./config.json");
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // npm install uuid

let revoltClient = new RevoltClient();
let discordClient = new DiscordClient({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages,
    ],
});

revoltClient.on("ready", async () => {
    console.info(`Revolt: Logged in as ${revoltClient.user.username}`);
});

discordClient.once(DiscordEvents.ClientReady, readyClient => {
    discordClient.user.setPresence({
        activities: [{
            type: ActivityType.Custom,
            name: "custom",
            state: config.activity.text
        }]
    })
    console.info(`Discord: Logged in as ${readyClient.user.tag}`);
});

const fetchRevoltImage = async (att) => {
    try {
        const encodedFilename = encodeURIComponent(att.filename);
        const url = `https://autumn.revolt.chat/attachments/${att._id}/${encodedFilename}`;

        const res = await axios.get(url, { responseType: 'arraybuffer' });

        if (res.headers['content-type'].startsWith('image/')) {
            const buffer = Buffer.from(res.data);

            if (buffer.length > 0) {
                return new AttachmentBuilder(buffer, { name: att.filename });
            } else {
                console.error('Revolt: Error: Image buffer is empty.');
                return null;
            }
        } else {
            console.warn('Revolt: Content is not an image:', res.headers['content-type']);
            return null;
        }
    } catch (error) {
        console.error('Revolt: Error fetching image from Revolt:', error.message || error);
        return null;
    }
};

revoltClient.on("message", async (message) => {
    if (config.revolt[message.channel_id]) {
        const channel_config = config.revolt[message.channel_id];

        if (channel_config.webhook) {
            if (channel_config.webhook.id && channel_config.webhook.token) {
                if (message.author.bot) return;
                const webhookClient = new WebhookClient({
                    id: channel_config.webhook.id,
                    token: channel_config.webhook.token,
                });

                const messageAuthor = message.author;
                const content = message.content || 'No Message Provided';
                if(message.attachments) {
                    // Handle attachments: loop through each attachment and process
                    const attachments = await Promise.all(
                        message.attachments.map(async (att) => {
                            return await fetchRevoltImage(att);
                        })
                    );

                    // Filter out any null values in the attachments array
                    const validAttachments = attachments.filter((att) => att !== null);

                    if (validAttachments.length > 0) {
                        try {
                            var username
                            if(channel_config.announcement === true) {
                                username = `Announcement from Revolt - ${messageAuthor.username}`
                            } else {
                                username = `Revolt - ${messageAuthor.username}`
                            }

                            if(message.content) {
                                await webhookClient.send({
                                    content: content,
                                    username: username,
                                    avatarURL: messageAuthor.avatarURL,
                                    files: validAttachments
                                });
                            } else {
                                await webhookClient.send({
                                    username: username,
                                    avatarURL: messageAuthor.avatarURL,
                                    files: validAttachments
                                });
                            }
                        } catch (sendError) {
                            console.error('Error sending image to Discord:', sendError.message || sendError);
                        }
                    } else {
                        try {
                            if(message.content) {
                                await webhookClient.send({
                                    content: content,
                                    username: `Revolt - ${messageAuthor.username}`,
                                    avatarURL: messageAuthor.avatarURL,
                                });
                            } else {
                                console.error(`Revolt: Message being sent without content!`)
                            }
                        } catch (sendError) {
                            console.error('Error sending message to Discord:', sendError.message || sendError);
                        }
                    }
                } else {
                    var username
                    if(channel_config.announcement === true) {
                        username = `Announcement from Revolt - ${messageAuthor.username}`
                    } else {
                        username = `Revolt - ${messageAuthor.username}`
                    }
                    if(message.content) {
                        await webhookClient.send({
                            content: content,
                            username: username,
                            avatarURL: messageAuthor.avatarURL
                        });
                    } else {
                        console.error(`Revolt: Message being sent without content!`)
                    }
                }
            }
        }
    }
});

discordClient.on(DiscordEvents.MessageCreate, async message => {
    if (config.discord[message.channel.id]) {
        const channel_config = config.discord[message.channel.id];
        if (channel_config.revolt_channel_id && !message.author.bot) {
            const revoltChannel = revoltClient.channels.get(channel_config.revolt_channel_id);
            if (!revoltChannel) return console.error("Revolt channel not found.");

            // Collect image URLs (or any attachment URLs)
            const imageLinks = [...message.attachments.values()]
                .filter(att => att.contentType && att.contentType.startsWith('image/'))  // Only filter out images
                .map(att => att.url);

            // Prepare username and message content
            const authorUsername = message.author.username;
            const content = message.cleanContent || 'No message content.';
            var revoltMessage

            if(channel_config.announcement === true) {
                // Prepare the content to send to Revolt
                revoltMessage = `${content}`;
            } else {
                // Prepare the content to send to Revolt
                revoltMessage = `**Discord: ${authorUsername}**\n` +
                                `${content}`;
            }

            let sentMessage;
            try {
                sentMessage = await revoltChannel.sendMessage({ content: revoltMessage });
            } catch (err) {
                console.error("Discord: Failed to send message to Revolt:", err.message || err);
            }

            // If there are image links, send them in a separate message with "Attachments" heading
            if (imageLinks.length) {
                const attachmentsMessage = `**Attachments:**\n${imageLinks.join("\n")}`;
                try {
                    await revoltChannel.sendMessage({
                        content: attachmentsMessage
                    });
                } catch (err) {
                    console.error("Discord: Failed to send image links:", err.message || err);
                }
            }
        }
    }
});

revoltClient.loginBot(config.tokens.revolt);
discordClient.login(config.tokens.discord);