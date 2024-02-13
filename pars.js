const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const fs = require("fs");
const readline = require("readline");
require("dotenv").config();

const apiId = Number(process.env.API_ID);
const apiHash = `${process.env.API_HASH}`;
const phoneNumber = process.env.NUMBER;

const stringSession = new StringSession("");

const pars = async () => {
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: phoneNumber,
    password: async () => await askQuestion("Please enter your password: "),
    phoneCode: async () =>
      await askQuestion("Please enter the code you received: "),
    onError: (err) => console.log(err),
  });

  console.log("You should now be connected.");

  const chats = await client.getDialogs();
  const groups = chats.filter((chat) => chat.isGroup);

  console.log("[+] Choose a group to scrape members :");
  groups.forEach((group, index) => {
    console.log(`[${index}] - ${group.title}`);
  });

  console.log("");
  const gIndex = await askQuestion("[+] Enter a Number : ");
  const targetGroup = groups[parseInt(gIndex)];

  console.log("[+] Fetching Members...");
  setTimeout(async () => {
    const allParticipants = await client.getParticipants(targetGroup.id);

    console.log("[+] Saving In file...");

    const csvData = allParticipants.map((user) => {
      const username = user.username || "";
      const name = (user.firstName || "") + " " + (user.lastName || "");
      return [username, user.id, "", name, targetGroup.title, targetGroup.id];
    });

    const csvHeader = [
      "username",
      "user id",
      "access hash",
      "name",
      "group",
      "group id",
    ];
    const csvRows = [csvHeader, ...csvData];
    const csvContent = csvRows.map((row) => row.join(",")).join("\n");

    fs.writeFileSync("members.csv", csvContent, { encoding: "UTF-8" });

    console.log("[+] Members scraped successfully.");
  }, 1000);
};

async function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

pars();
