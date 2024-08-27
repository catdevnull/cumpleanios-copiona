<script lang="ts">
  import { onMount, tick } from "svelte";

  let editing = false;
  let currentlyEditingText = "";
  let mouse = { x: 0, y: 0 };
  let pos = { x: 0, y: 0 };

  let existingText: { text: string; x: number; y: number }[] = [];

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
    existingText = [...existingText, { text: currentlyEditingText, ...pos }];
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

  onMount(() => {
    scrollToCenter();
  });
</script>

<svelte:window on:beforeunload={scrollToCenter} />

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  bind:this={divEl}
  on:mousemove={mousemove}
  style="width: 2500px; height: 2500px;"
>
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
  }
</style>
