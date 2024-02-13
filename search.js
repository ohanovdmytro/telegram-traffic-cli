const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const fs = require("fs");
const readline = require("readline");
require("dotenv").config();

const apiId = Number(process.env.API_ID);
const apiHash = `${process.env.API_HASH}`;
const phoneNumber = process.env.NUMBER;

async function search() {
  try {
    const client = new TelegramClient(new StringSession(""), apiId, apiHash, {
      connectionRetries: 5,
    });

    await client.start({
      phoneNumber: phoneNumber,
      password: async () => await askQuestion("Please enter your password: "),
      phoneCode: async () =>
        await askQuestion("Please enter the code you received: "),
      onError: (err) => console.log(err),
    });

    const keywords = fs
      .readFileSync("keywords.txt", "utf-8")
      .split("\n")
      .map((k) => k.trim());

    const writer = fs.createWriteStream("search_results.csv");
    writer.write("Username,Message,Date,Link,Keyword\n");

    const dialogs = await client.getDialogs();

    for (const dialog of dialogs) {
      try {
        if (
          dialog.entity._ == "channel" ||
          dialog.entity._ == "chat" ||
          dialog.entity._ == "user"
        ) {
          // Get all the messages in the chat
          const messages = await client.getMessages(dialog, { limit: 100 });

          // Iterate through the messages
          for (const message of messages) {
            // Check if any of the keywords are in the message text
            for (const keyword of keywords) {
              if (message.message && message.message.includes(keyword)) {
                // Write the username, message text, date, link and keyword to the CSV file
                writer.write(
                  `${message.fromId},${message.message},${message.date},https://t.me/${dialog.entity.username},${keyword}\n`
                );
              }
            }
          }
        }
      } catch (e) {
        console.error(`Error: ${e}`);
      }
    }

    await client.disconnect();
    console.log("Search completed. Results saved in search_results.csv.");
  } catch (err) {
    console.error(err);
  }
}

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

search();
