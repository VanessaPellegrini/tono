import { CanvasRenderer } from "./render/CanvasRenderer";

const canvas = document.createElement("canvas");
document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.style.background = "#1a1a2e";
document.body.appendChild(canvas);

const renderer = new CanvasRenderer(canvas);

function resize() {
  renderer.resize(window.innerWidth, window.innerHeight);
  render();
}

function render() {
  renderer.clear();
  renderer.drawStrings();
  renderer.drawMessage("Connect a controller or enable camera");
}

window.addEventListener("resize", resize);
resize();
