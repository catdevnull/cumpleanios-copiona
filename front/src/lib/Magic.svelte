<script lang="ts">
  import { onDestroy, onMount, tick } from "svelte";
  import { API_URL } from "./consts";
  import { zServerMessage, type ClientMessage, type Coso } from "shared";

  let ws: WebSocket;

  let editing = false;
  let currentlyEditingText = "";
  let mouse = { x: 0, y: 0 };
  let pos = { x: 0, y: 0 };
  let backgroundColor = "#ffffff";
  let wsState: "connected" | "connecting" | "disconnected" = "connecting";

  let existingText: Coso[] = [];

  const genRandom = () => Math.random() * 10 + 10;
  let random = genRandom();

  function mousemove(
    event: Event & {
      currentTarget: HTMLElement;
      screenX: number;
      screenY: number;
      clientX: number;
      clientY: number;
    },
  ) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left; //x position within the element.
    const y = event.clientY - rect.top; //y position within the element.

    mouse = { x, y };
    if (!editing) pos = mouse;
  }

  async function input(event: Event) {
    if (currentlyEditingText.length > 0) {
      editing = true;
    }
    if (currentlyEditingText.length > random) {
      let oldText = currentlyEditingText;
      commit();
      await tick();
      const span = Array.from(document.querySelectorAll("span")).find(
        (span) => span.textContent == oldText,
      )!;

      pos.x += span.clientWidth;
      pos.y += 32;
      random = genRandom();
    }
  }
  function keypress(event: Event & { key: string }) {
    if (event.key === "Enter") {
      commit();
    }
  }

  function commit() {
    editing = false;
    const msg: ClientMessage = {
      type: "createdCoso",
      coso: { text: currentlyEditingText, backgroundColor, ...pos },
    };
    ws.send(JSON.stringify(msg));
    currentlyEditingText = "";
    pos = mouse;
  }

  let divEl: HTMLDivElement;

  function scrollToCenter() {
    const vw = Math.max(
      document.documentElement.clientWidth || 0,
      window.innerWidth || 0,
    );
    const vh = Math.max(
      document.documentElement.clientHeight || 0,
      window.innerHeight || 0,
    );

    window.scrollTo(
      divEl.clientWidth / 2 - vw / 2,
      divEl.clientHeight / 2 - vh / 2,
    );
  }

  function connect() {
    wsState = "connecting";
    ws = new WebSocket(API_URL.replace("http", "ws"));
    ws.addEventListener("message", (event) => {
      const json = JSON.parse(event.data);
      const msg = zServerMessage.parse(json);
      console.log("server:", msg);
      switch (msg.type) {
        case "baseState":
          existingText = msg.state.cosos;
          break;
        case "newCoso":
          existingText = [...existingText, msg.coso];
          break;
      }
    });
    ws.addEventListener("open", () => (wsState = "connected"));
    ws.addEventListener("close", () => (wsState = "disconnected"));
    ws.addEventListener("error", () => (wsState = "disconnected"));
  }
  onDestroy(() => {
    ws?.close();
  });

  onMount(() => {
    scrollToCenter();
    connect();
  });

  const colores = [
    "transparent",
    "#ff0000",
    "#00ff00",
    "#0000ff",
    "#ffff00",
    "#00ffff",
    "#ff00ff",
  ];
  function setColor(color: string) {
    backgroundColor = color;
  }
</script>

<svelte:window on:beforeunload={scrollToCenter} />

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  bind:this={divEl}
  on:mousemove={mousemove}
  style="width: 2500px; height: 2500px;"
>
  {#each existingText as { text, backgroundColor, x, y }}
    <span
      style={`top: ${y}px; left: ${x}px; background-color: ${backgroundColor};`}
      >{text}</span
    >
  {/each}
</div>

<div class="nav">
  <div class="colors">
    {#each colores as color}
      <button
        class="color"
        style={`background: ${color}; border: 1px solid black;`}
        on:click={() => setColor(color)}
      >
      </button>
    {/each}
  </div>
  <div class="disconnected">
    {#if wsState === "disconnected"}
      se te desconectó
      <button class="connect" on:click={connect}>reconectar</button>
    {:else if wsState === "connecting"}
      conectando
    {/if}
  </div>
</div>

<input
  hidden={wsState !== "connected"}
  bind:value={currentlyEditingText}
  type="text"
  style={`top: ${pos.y}px; left: ${pos.x}px; background-color: ${currentlyEditingText ? backgroundColor : "transparent"};`}
  on:input={input}
  on:keypress={keypress}
  on:blur={commit}
/>

<style>
  input,
  span {
    position: absolute;
    appearance: none;
    -moz-appearance: none;
    -webkit-appearance: none;
    border: none;
    outline: none;
    font-size: 32px;
    background: none;
    line-height: 1;
    padding: 0;
    margin: 0;
    width: max-content;
  }

  .nav {
    position: fixed;
    display: flex;
    flex-direction: column;
    justify-content: center;
    top: 0;
    left: 0;
    width: 100%;
    pointer-events: none;
  }
  .colors {
    display: flex;
    justify-content: center;
    gap: 8px;
  }
  button {
    pointer-events: all;
  }
  .color {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    appearance: none;
    -webkit-appearance: none;
    padding: 0;
    margin: 0;
    border: 0;
  }
  .disconnected {
    margin: 0 auto;
  }
  .connect {
    width: min-content;
  }
</style>
