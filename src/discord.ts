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
      "https://cdn.discordapp.com/attachments/567067249354211357/1254514850336342116/plex-icon-2048x2048-kdgfrhh9.png?ex=6679c580&is=66787400&hm=18e5a3827a79ad0145519a6e48734330a30545b9aba596e82dbdc494e637e3ce&"
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
