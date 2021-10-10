import {
  defineQuery,
  IWorld,
} from 'bitecs';
import {
  mat2d, vec2,
} from 'gl-matrix';
import {
  addComponent,
  addEntity,
  createWorld,
  pipe,
} from 'bitecs';
import {
  Renderer,
  Sprite,
} from 'pixi.js';
import imgBunny from './bunny.png';
import sndJump from './jump.wav';
import './style.css'
import { CGravity, CSprite, CTransform, CVelocity } from './components';
import { audioSystem, IWorldAudio } from './audio';
import { drawSystem, IWorldRenderer } from './renderer';
import { IWorldTime, timeSystem } from './time';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `<canvas></canvas>`;
const canvas = document.querySelector<HTMLCanvasElement>('canvas')!;

/* WORLD */
const world = createWorld() as IWorld & IWorldTime & IWorldRenderer & IWorldAudio;
world.time = {
  elapsed: 0,
  updateTimeLeft: 0,
  updateDelta: 16 / 1000,
  then: performance.now() / 1000,
};
const sprites: Map<number, Sprite> = new Map();
world.renderer = {
  renderer: new Renderer({
    clearBeforeRender: false,
    view: canvas,
    width: 600,
    height: 400,
  }),
  camera: {},
  sprite: {
    getSprite: (spriteId: number): Sprite => {
      return sprites.get(spriteId)!;
    }
  }
};
world.audio = {
  context: new AudioContext(),
  sourceIds: new Map(),
  sources: new Map(),
};

/* DATA SETUP */
let nextSourceId = 0;
const createSource = async (path: string): Promise<void> => {
  const response = await fetch(path)
  const id = nextSourceId++;
  const buffer = await response.arrayBuffer();
  const decodedBuffer = await world.audio.context.decodeAudioData(buffer); 
  world.audio.sourceIds.set(path, id);
  world.audio.sources.set(id, decodedBuffer);
}
await createSource(sndJump);
const sprite = Sprite.from(imgBunny);
sprites.set(sprite.texture.baseTexture.uid, sprite);
for (let i = 0; i <= 100; i++) {
  const entityId = addEntity(world);
  addComponent(world, CTransform, entityId);
  mat2d.identity(CTransform.local[entityId]);
  const localTransform = CTransform.local[entityId];
  localTransform[4] = Math.random() * 600;
  localTransform[5] = Math.random() * 200 + 100;
  addComponent(world, CVelocity, entityId);
  const velocity = CVelocity.vec2[entityId];
  velocity[0] = (Math.random() - 0.5) * 200;
  velocity[1] = (Math.random() - 0.5) * 200;
  addComponent(world, CGravity, entityId);
  addComponent(world, CSprite, entityId);
  CSprite.spriteId[entityId] = sprite.texture.baseTexture.uid;
}

/* SYSTEMS */
const movementQuery = defineQuery([CTransform, CVelocity]);
const movementSystem = <T extends IWorld & IWorldTime>(world: T): T => {
  const { time: { updateDelta: dt } } = world;
  const velocityScaled = vec2.create();
  for (let eid of movementQuery(world)) {
    const localTransform = CTransform.local[eid];
    const velocity = CVelocity.vec2[eid];
    mat2d.translate(localTransform, localTransform, vec2.scale(velocityScaled, velocity, dt));
    if (localTransform[4] >= 600 - 27) {
      velocity[0] = -Math.abs(velocity[0]);
    } else if (localTransform[4] < 0) {
      velocity[0] = Math.abs(velocity[0]);
    }
    if (localTransform[5] >= (400 - 37)) {
      velocity[1] = -Math.abs(velocity[1]);
    }
  }
  return world
}

const gravityQuery = defineQuery([CGravity, CVelocity]);
const gravitySystem = <T extends IWorld & IWorldTime>(world: T): T => {
  const { time: { updateDelta: dt } } = world;
  for (let eid of gravityQuery(world)) {
    const velocity = CVelocity.vec2[eid];
    velocity[1] += 100 * dt;
  }
  return world
}

const update = pipe(
  gravitySystem,
  movementSystem,
)
const render = pipe(
  audioSystem,
  drawSystem,
)

/* LOOP */
let alive = true;
const main: FrameRequestCallback = () => {
  timeSystem(world);
  while (world.time.updateTimeLeft >= world.time.updateDelta) {
    update(world);
    world.time.updateTimeLeft -= world.time.updateDelta;
  }
  render(world);
  if (alive) {
    requestAnimationFrame(main);
  }
};
requestAnimationFrame(main);

setTimeout(() => {
  console.log('stopping')
  alive = false
}, 10_000);
