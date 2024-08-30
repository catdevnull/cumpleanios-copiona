import {
  zClientMessage,
  zCoso,
  type Coso,
  type ServerMessage,
  type State,
} from "shared";

import { Database } from "bun:sqlite";

const db = new Database(process.env.DATABASE_PATH ?? "cosos.db");

db.exec(`
CREATE TABLE IF NOT EXISTS cosos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  json TEXT NOT NULL
);
`);

const cososQuery = db.query<{ json: string }, {}>("SELECT json FROM cosos");
function getState(): State {
  const rows = cososQuery.all({});
  const cosos = rows.map((row) => {
    const json = JSON.parse(row.json);
    return zCoso.parse(json);
  });
  return { cosos };
}
const newCosoQuery = db.query<{ id: number }, string>(
  "INSERT INTO cosos (json) VALUES (?1)",
);
function addCoso(coso: Coso) {
  newCosoQuery.run(JSON.stringify(coso));
}

const server = Bun.serve<{ authToken: string }>({
  hostname: "0.0.0.0",
  fetch(req, server) {
    const success = server.upgrade(req);
    if (success) {
      // Bun automatically returns a 101 Switching Protocols
      // if the upgrade succeeds
      return undefined;
    }

    // handle HTTP request normally
    return new Response("Hello world!");
  },
  websocket: {
    async open(ws) {
      const msg: ServerMessage = {
        type: "baseState",
        state: getState(),
      };
      ws.send(JSON.stringify(msg));
      ws.subscribe("copiona");
    },
    // this is called when a message is received
    async message(ws, message) {
      if (typeof message !== "string") {
        return;
      }
      const json = JSON.parse(message);
      const msg = zClientMessage.safeParse(json);
      if (msg.error) {
        console.error(msg.error);
        return;
      }
      const { type, coso } = msg.data;
      switch (type) {
        case "createdCoso": {
          addCoso(coso);
          const msg: ServerMessage = {
            type: "newCoso",
            coso,
          };
          server.publish("copiona", JSON.stringify(msg));
          break;
        }
      }
    },
  },
});

console.log(`Listening on ${server.hostname}:${server.port}`);
