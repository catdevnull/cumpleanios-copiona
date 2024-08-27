import { zClientMessage, type Coso, type ServerMessage } from "shared";
let state: { cosos: Coso[] } = { cosos: [] };

const server = Bun.serve<{ authToken: string }>({
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
        state,
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
          state.cosos.push(coso);
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
