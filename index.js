require("dotenv").config();
const { Client, GatewayIntentBits, Partials, AttachmentBuilder, EmbedBuilder } = require("discord.js");
const { createCanvas, loadImage } = require("@napi-rs/canvas");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

// Bot hazır
client.once("ready", () => {
  console.log(`✅ ${client.user.tag} olarak giriş yapıldı.`);
});

// Yeni üye katıldığında: Kayıtsız rolü + hoşgeldin mesajı + görsel
client.on("guildMemberAdd", async member => {
  const hosgeldinKanal = member.guild.channels.cache.find(c => c.name === "👋・hoşgeldin");
  const kayitsizKanal = member.guild.channels.cache.find(c => c.name === "💬・kayıtsız-sohbet");
  const kayitsizRol = member.guild.roles.cache.find(r => r.name === "Kayıtsız");

  if (kayitsizRol) await member.roles.add(kayitsizRol);

  // Canvas ile BROWN temalı hoşgeldin görseli
  const canvas = createCanvas(800, 300);
  const ctx = canvas.getContext("2d");

  const background = await loadImage("https://copilot.microsoft.com/th/id/BCO.1fe08b7d-091e-40b1-ad82-8eef2f76d5f9.png");
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#8B4513";
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, canvas.width, canvas.height);

  const avatar = await loadImage(member.user.displayAvatarURL({ extension: "png", size: 256 }));
  ctx.save();
  ctx.beginPath();
  ctx.arc(150, 150, 100, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar, 50, 50, 200, 200);
  ctx.restore();

  ctx.font = "bold 40px Sans";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("BROWN Sunucusuna Hoş Geldin!", 300, 130);
  ctx.font = "28px Sans";
  ctx.fillStyle = "#8B4513";
  ctx.fillText(`${member.user.username}`, 300, 180);

  const attachment = new AttachmentBuilder(canvas.toBuffer("image/png"), { name: "brown-banner.png" });

  const embed = new EmbedBuilder()
    .setColor("#8B4513")
    .setTitle("👋 Yeni Üye Geldi!")
    .setDescription(`> ${member} sunucumuza katıldı!\n💬 Kayıtsız-sohbet kanalına geçip kayıt işlemini tamamlayın.`)
    .setImage("attachment://brown-banner.png")
    .setFooter({ text: `${member.guild.name} ailesine hoş geldin 🤎`, iconURL: member.guild.iconURL() })
    .setTimestamp();

  if (hosgeldinKanal) hosgeldinKanal.send({ embeds: [embed], files: [attachment] });
  if (kayitsizKanal) kayitsizKanal.send(`📥 ${member} sunucuya katıldı! Lütfen kaydınızı tamamlayın.`);
});

// Kayıt komutu (sadece yetkililer)
client.on("messageCreate", async message => {
  if (message.author.bot) return;
  if (!message.content.toLowerCase().startsWith("!kayıt")) return;

  const yetkiliRoller = ["BOSS", "yönetici", "moderatör"];
  if (!message.member.roles.cache.some(r => yetkiliRoller.includes(r.name))) {
    return message.reply("❌ Bu komutu kullanmak için yetkin yok!");
  }

  const hedef = message.mentions.members.first();
  if (!hedef) return message.reply("❌ Lütfen kayıt edilecek kullanıcıyı etiketle.");

  const kayitsizRol = message.guild.roles.cache.find(r => r.name === "Kayıtsız");
  const uyeRol = message.guild.roles.cache.find(r => r.name === "üye");

  if (!uyeRol) return message.reply("❌ Üye rolü bulunamadı!");

  if (kayitsizRol && hedef.roles.cache.has(kayitsizRol.id)) {
    await hedef.roles.remove(kayitsizRol);
  }
  await hedef.roles.add(uyeRol);

  const embed = new EmbedBuilder()
    .setColor("#8B4513")
    .setDescription(`✅ ${hedef} başarıyla kayıt edildi! Artık tam bir BROWN üyesi.`);

  message.channel.send({ embeds: [embed] });
});

client.login(process.env.TOKEN);

