const { TelegramClient } = require("telegram");
// const { StringSession } = require("telegram/sessions");
const { StoreSession } = require("telegram/sessions");
const input = require("input");
const fs = require("fs");
require("dotenv").config();

const apiId = Number(process.env.API_ID);
const apiHash = `${process.env.API_HASH}`;
const phoneNumber = process.env.NUMBER;

const session = new StoreSession("my_session");

(async () => {
  try {
    console.log("Loading interactive example...");
    const client = new TelegramClient(session, apiId, apiHash, {
      connectionRetries: 5,
    });

    await client.start({
      phoneNumber: phoneNumber,
      password: async () => await input.text("Please enter your password: "),
      phoneCode: async () =>
        await input.text("Please enter the code you received: "),
      onError: (err) => console.log(err),
    });

    client.setParseMode("html");

    console.log("You should now be connected.");

    const input_file = process.argv[2];

    const users = [];
    const rows = fs.readFileSync(input_file, { encoding: "UTF-8" }).split("\n");
    rows.shift();
    rows.forEach((row) => {
      const [username, id, access_hash, name] = row.split(",");
      users.push({
        username,
        id: parseInt(id),
        access_hash: parseInt(access_hash),
        name,
      });
    });

    console.log("[1] send sms by user ID\n[2] send sms by username ");
    const mode = parseInt(await input.text("Input: "));

    let messageCounter = 0; // Counter to keep track of messages sent

    for (const user of users) {
      let receiver;
      if (mode === 2) {
        if (!user.username) continue;
        receiver = await client.getInputEntity(user.username);
      } else if (mode === 1) {
        receiver = await client.getInputEntity(user.id);
      } else {
        console.log("Invalid Mode. Exiting.");
        await client.disconnect();
        process.exit(1);
      }

      const message =
        users.indexOf(user) % 2 === 0
          ? fs.readFileSync("message1.txt", "utf8")
          : fs.readFileSync("message2.txt", "utf8");

      try {
        console.log("[+] Sending Message to:", user.name);
        await client.sendMessage(receiver, {
          message: message.replace("{name}", user.name),
        });
        console.log("[+] Waiting 1.5 seconds");
        await new Promise((resolve) => setTimeout(resolve, 1500));
        messageCounter++;

        // Check if 10 messages have been sent, if so, wait for 480 seconds
        if (messageCounter % 7 === 0) {
          console.log("[+] Sent to 7 people. Waiting 480 seconds...");
          await new Promise((resolve) => setTimeout(resolve, 48000));
        }
      } catch (e) {
        console.log("[!] Error:", e);
        console.log("[!] Trying to continue...");
        continue;
      }
    }

    await client.disconnect();
    console.log("Done. Message sent to all users.");
  } catch (err) {
    console.error(err);
  }
})();
