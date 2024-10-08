<script lang="ts">
  import { onDestroy, onMount, tick } from "svelte";
  import linkifyStr from "linkify-string";

  import { API_URL } from "./consts";
  import { zServerMessage, type ClientMessage, type Coso } from "shared";
  import Cowboy from "./cowboy.svelte";

  let ws: WebSocket;

  let editing = false;
  let currentlyEditingText = "";
  let mouse = { x: 0, y: 0 };
  let pos = { x: 0, y: 0 };
  type Color = (typeof colores)[number];
  let backgroundColor: Color = "#ffffff";
  let wsState: "connected" | "connecting" | "disconnected" = "connecting";

  let existingText: Coso[] = [];
  let tempText: Coso[] = [];

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
    const x = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
    const y = Math.min(Math.max(event.clientY - rect.top, 0), rect.height);

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

      pos.x = Math.min(pos.x + span.clientWidth, divEl.clientWidth - 10);
      pos.y = Math.min(pos.y + 32, divEl.clientHeight - 10);
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
    const coso: Coso = { text: currentlyEditingText, backgroundColor, ...pos };
    const msg: ClientMessage = {
      type: "createdCoso",
      coso,
    };
    ws.send(JSON.stringify(msg));
    tempText = [...tempText, coso];
    currentlyEditingText = "";
    pos = mouse;
  }

  let divEl: HTMLDivElement;

  function scrollToCenter() {
    const vw = Math.max(document.documentElement.clientWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight || 0);

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
          tempText = tempText.filter(
            (coso) => coso.x !== msg.coso.x && coso.y !== msg.coso.y,
          );
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
    "#ffffff",
    "#70D6FF",
    "#FF70A6",
    "#FF9770",
    "#FFD670",
    "#E9FF70",
  ] as const;
  function setColor(color: Color) {
    backgroundColor = color;
  }

  $: caretColor = currentlyEditingText
    ? "black"
    : backgroundColor === "#ffffff"
      ? "black"
      : backgroundColor;
</script>

<svelte:window on:beforeunload={scrollToCenter} />

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="canvas" bind:this={divEl} on:mousemove={mousemove}>
  {#each [...existingText, ...tempText] as { text, backgroundColor, x, y }}
    <span
      style={`
        top: ${y}px;
        left: ${x}px;
        background-color: ${backgroundColor};
        /* z-index: ${linkifyStr(text).includes("<a") ? 50 : 0}; */
        --top: ${y}px;
        --left: ${x}px;
      `}>{@html linkifyStr(text, { target: "_blank" })}</span
    >
  {/each}
  <a href="https://nulo.in" target="_blank" class="nulo">
    producido por
    <Cowboy style="width: 1em; height: 1em;" />Nulo Inc™️
  </a>

  <input
    hidden={wsState !== "connected"}
    bind:value={currentlyEditingText}
    type="text"
    style={`top: ${pos.y}px; left: ${pos.x}px; background-color: ${currentlyEditingText ? backgroundColor : "transparent"};
    caret-color: ${caretColor};`}
    on:input={input}
    on:keypress={keypress}
    on:blur={commit}
  />
</div>

<div class="nav">
  <div class="colors">
    {#each colores as color}
      <button
        class="color"
        style={`background: ${color}; outline: ${backgroundColor === color ? "3px solid black" : "1px solid black"};`}
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

<style>
  .canvas {
    width: 2500px;
    height: 2500px;
    position: relative;
    overflow: clip;
  }
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
    padding-top: 4px;
    margin: 0 auto;
    pointer-events: all;
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
  .nulo {
    position: absolute;
    bottom: 0;
    right: 0;
    font-size: 32px;
    text-decoration: none;
    line-height: 1;
    padding: 4px;
    color: lightcyan;
    pointer-events: all;
    background: #ff70a6;
    z-index: 99;
  }
  :global(a) {
    color: inherit !important;
  }
  :global(a::before) {
    content: "↗";
    position: absolute;
    top: 0;
    left: -36px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ddd;
    border-radius: 4px;
    font-size: 32px;
    line-height: 1;
    z-index: 50;
    pointer-events: all;
  }
</style>
