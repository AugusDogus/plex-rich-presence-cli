const Discord = require("discord.js-selfbot-v13");
const client = new Discord.Client({
  readyStatus: false,
  checkUpdate: false,
});

client.on("ready", async () => {
  console.log(`${client.user.tag} has logged in`);
});

export const setDiscordPresence = async (
  presence: ReturnType<typeof Discord.RichPresence>
) => {
  client.user.setActivity(presence);
  client.user.setPresence({ status: "online" });
};

export const createDiscordPresence = async ({
  state,
  name,
}: {
  state: string;
  name: string;
}) => {
  const presence = new Discord.RichPresence()
    .setApplicationId("842429216981254165")
    .setType("WATCHING")
    .setState(state)
    .setName(name)
    .setDetails("Streaming on Plex")
    .setAssetsLargeImage(
      "https://cdn.discordapp.com/app-icons/842429216981254165/351ea06009d1f9b71c90474396e7329b.png?size=256"
    )
    .setAssetsLargeText(`Watching ${name} on Plex`);
  return presence;
};

export const checkDiscordPresence = async () => {
  return client.user.presence;
};

export const loginToDiscord = async (token: string) => {
  await client.login(token);
};
