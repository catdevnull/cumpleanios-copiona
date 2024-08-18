<script lang="ts">
  import { tick } from "svelte";

  let editing = false;
  let currentlyEditingText = "";
  let mouse = { x: 0, y: 0 };
  let pos = { x: 0, y: 0 };

  let existingText: { text: string; x: number; y: number }[] = [];

  const genRandom = () => Math.random() * 10 + 10;
  let random = genRandom();

  let inputEl: HTMLInputElement;

  function mousemove(
    event: Event & {
      screenX: number;
      screenY: number;
      clientX: number;
      clientY: number;
    }
  ) {
    mouse = {
      x: event.clientX,
      y: event.clientY,
    };
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
        (span) => span.textContent == oldText
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
    existingText = [...existingText, { text: currentlyEditingText, ...pos }];
    currentlyEditingText = "";
    pos = mouse;
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div on:mousemove={mousemove}>
  {#each existingText as { text, x, y }}
    <span style={`top: ${y}px; left: ${x}px;`}>{text}</span>
  {/each}
</div>

<input
  bind:value={currentlyEditingText}
  type="text"
  style={`top: ${pos.y}px; left: ${pos.x}px;`}
  on:input={input}
  on:keypress={keypress}
  on:blur={commit}
  bind:this={inputEl}
/>

<style>
  div {
    width: 100vw;
    height: 100vh;
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
  }
</style>
