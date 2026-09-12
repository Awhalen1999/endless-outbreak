import Phaser from "phaser";
import { Boot } from "./scenes/Boot";
import { Hub } from "./scenes/Hub";
import { Mission } from "./scenes/Mission";
import { Results } from "./scenes/Results";

const WIDTH = 480;
const HEIGHT = 270;

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: WIDTH,
  height: HEIGHT,
  pixelArt: true,
  backgroundColor: "#0b0e11",
  scale: { mode: Phaser.Scale.NONE, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [Boot, Hub, Mission, Results],
});

// Whole-number zoom only, so every game pixel is a square block of screen pixels.
const fitInteger = (): void => {
  game.scale.setZoom(Math.max(1, Math.floor(Math.min(innerWidth / WIDTH, innerHeight / HEIGHT))));
};
fitInteger();
addEventListener("resize", fitInteger);
