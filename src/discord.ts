const Discord = require("discord.js-selfbot-v13");
const client = new Discord.Client({
  readyStatus: false,
  checkUpdate: false,
});

client.on("ready", async () => {
  console.clear();
  console.log(`${client.user.tag} - rich presence started!`);

  const r = new Discord.RichPresence()
    .setApplicationId("842429216981254165")
    .setType("WATCHING")
    .setState("Season 2 • Episode 3")
    .setName("The Boys")
    .setDetails("Streaming on Plex")
    .setAssetsLargeImage(
      "https://cdn.discordapp.com/attachments/567067249354211357/1254514850336342116/plex-icon-2048x2048-kdgfrhh9.png?ex=6679c580&is=66787400&hm=18e5a3827a79ad0145519a6e48734330a30545b9aba596e82dbdc494e637e3ce&"
    )
    .setAssetsLargeText("Watching The Boys on Plex")
    .addButton("Watch on Plex", "https://www.plex.tv/")
    .addButton("More about The Boys", "https://www.imdb.com/title/tt1190634/");

  client.user.setActivity(r);
  client.user.setPresence({ status: "online" });
});

client.login(Bun.env.DISCORD_TOKEN);
