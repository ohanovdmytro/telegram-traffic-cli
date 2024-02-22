// sets the mode to HTML 
; await client.sendMessage("me",{message:"This is an underline text"}); 
// disable formatting 
client.setParseMode(undefined); 
await client.sendMessage("me",{message:" this will be sent as it is ** with no formatting **});
