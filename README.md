# RevCordBridge
RevCordBridge is a bridge between Discord and Revolt, designed to sync messages and attachments between both platforms. It allows you to forward messages, images, and attachments between Discord and Revolt, keeping both platforms connected in real-time.

## Features

- Sends messages and images from Discord to Revolt.
- Sends messages and images from Revolt to Discord.
- Handles attachments in Discord and sends them to Revolt as image links.
- Custom Discord status on client start.
- Configurable activity text in Discord.

## Requirements

- Node.js v16 or higher.
- [discord.js](https://discord.js.org/) v14.19.3 or higher.
- [revolt.js](https://github.com/revoltchat/revolt.js) v6.0.19 (due to compatibility reasons).
- Axios for HTTP requests (`npm install axios`).
- [uuid](https://www.npmjs.com/package/uuid) for unique ID generation (`npm install uuid`).

## Setup

1. Clone this repository:

    ```bash
    git clone https://github.com/Lockyz-Media/RevCordBridge.git
    cd RevCordBridge
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Rename `config.example.json` to `config.json`.
- Replace `YOUR_DISCORD_BOT_TOKEN` with your Discord bot token.
- Replace `YOUR_REVOLT_BOT_TOKEN` with your Revolt bot token.
- Replace `REVOLT_CHANNEL` with the revolt channel you'd like to use.
- Configure Revolt channel and Discord webhook settings under the revolt and discord objects.

## Usage
1) Run the bot: `node index.js`
2) When the bot starts up, it will log in to both Discord and Revolt, and set a custom status on Discord.
3) The bot will sync messages from Discord to Revolt and vice versa:
  - Messages sent on Discord will appear in the configured Revolt channel.
  - Images from Discord will be sent as links in Revolt.
  - Messages sent on Revolt will appear in the configured Discord channel.
  - Image links will be sent separately in Revolt under the heading **Attachments:**.
