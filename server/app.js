const WebSocket = require('ws')
const TMI = require('tmi.js')

tmiOptions = require('./options.js');
const tmiClient = new TMI.client(tmiOptions.options);
tmiClient.connect();

const wss = new WebSocket.Server({ port: 8989 })

const broadcast = (data, ws = null) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client !== ws) {
      client.send(JSON.stringify(data))
    }
  })
}

//const users = [];
const users = new Array();
const users2 = new Set();
const addUser = (name) => {
    let index = users.length;
    if (users2.has(name)) {
      return index;
    }
    users.push({ name: name, id: index + 1 });
    users2.add(name);
    //ws.send(JSON.stringify({
    //  type: 'USERS_LIST',
    //  users
    //}));
    broadcast({
      type: 'USERS_LIST',
      users
    });
    return index;
};

wss.on('connection', (ws) => {
  let index;
  let name;
  ws.on('message', (message) => {
    const data = JSON.parse(message)
    console.log(message)
    switch (data.type) {
      case 'ADD_USER': {
        name = data.name;
        index = addUser(data.name);
        break
      }
      case 'ADD_MESSAGE':
        broadcast({
          type: 'ADD_MESSAGE',
          message: data.message,
          author: data.author
        }, ws)
        break
      default:
        break
    }
  })

  ws.on('close', () => {
    users.splice(index, 1)
    users2.delete(name);
    broadcast({
      type: 'USERS_LIST',
      users
    }, ws)
  })
})


tmiClient.on('chat', (channel, userstate, message, self) => {
  console.log(message);
  addUser(userstate['display-name']);
  broadcast({
    type: 'ADD_MESSAGE',
    message: message,
    author: userstate['display-name']
  });
});
