<script lang="ts">
  import { onMount } from "svelte";

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  let texts = [{ text: "hello world", x: 100, y: 300 }];

  let typing: false | { x: number; y: number; offset: number } = false;

  let mouse = { x: 0, y: 0 };

  function draw() {
    if (!canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "black";
    ctx.font = "40px sans-serif";
    // ctx.fillText("hello world", 10, 10);

    for (const text of texts) {
      ctx.fillText(text.text, text.x, text.y);
    }

    if (!typing) {
      ctx.fillStyle = "#aaa";
      ctx.fillText("empezá a escribir...", mouse.x, mouse.y);
    } else {
    }

    window.requestAnimationFrame(draw);
  }

  function resize() {
    // canvas.width = canvas.clientWidth;
    // canvas.height = canvas.clientHeight;
  }

  function onKey(event: Event & { key: string }) {
    const { key } = event;
  }

  function mousemove(
    event: Event & {
      screenX: number;
      screenY: number;
      clientX: number;
      clientY: number;
    }
  ) {
    mouse = {
      x: (event.clientX / canvas.clientWidth) * canvas.width,
      y: (event.clientY / canvas.clientHeight) * canvas.height,
    };
  }

  onMount(() => {
    resize();
    ctx = canvas.getContext("2d")!;
    draw();
  });
</script>

<svelte:window on:resize={resize} on:keypress={onKey} />
<canvas bind:this={canvas} width="1280" height="720" on:mousemove={mousemove} />

<style>
  canvas {
    max-width: 100vw;
    max-height: 100vh;
    aspect-ratio: 16/9;
  }
</style>
