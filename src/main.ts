import type {
  //@ts-ignore
  IWorld,
} from 'bitecs';
import {
  mat2d,
  vec2,
} from 'gl-matrix';
import {
  addComponent,
  addEntity,
  createWorld,
  defineComponent,
  defineQuery,
  pipe,
  Types,
} from 'bitecs';
import {
  Renderer,
  Sprite
} from 'pixi.js';
import imgBunny from './bunny.png';
import sndJump from './jump.wav';
import './style.css'

/* DOM */
const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `<canvas></canvas>`;
const canvas = document.querySelector<HTMLCanvasElement>('canvas')!;

/* COMPONENTS */
const CVelocity = defineComponent({
  vec2: [Types.f32, 2],
});
const CTransform = defineComponent({
  local: [Types.f32, 6],
});
const CGravity = defineComponent();
const CSprite = defineComponent({
  spriteId: Types.ui16,
});

/* SYSTEMS.TIME */
interface IWorld {
  time: {
    elapsed: number,
    updateTimeLeft: number,
    updateDelta: number,
    then: number,
  }
};
const timeSystem = (world: IWorld): IWorld => {
  const { time } = world;
  const now = performance.now() / 1000;
  const delta = now - time.then;
  time.updateTimeLeft += delta;
  time.elapsed += delta;
  time.then = now;
  return world;
}

/* SYSTEMS.RENDERER */
interface IWorld {
  renderer: Renderer,
  sprite: {
    getSprite: (spriteId: number) => Sprite,
  }
}
const drawSpriteQuery = defineQuery([CTransform, CSprite]);
const drawSystem = (world: IWorld): IWorld => {
  const { renderer } = world;
  const { sprite: { getSprite } } = world
  renderer.clear();
  for (let eid of drawSpriteQuery(world)) {
    const spriteId = CSprite.spriteId[eid];
    const localTransform = CTransform.local[eid];
    const sprite = getSprite(spriteId);
    sprite.x = localTransform[4];
    sprite.y = localTransform[5];
    renderer.render(sprite);
  }
  renderer.batch.flush();
  return world;
}

/* SYSTEMS.MOVEMENT */
const movementQuery = defineQuery([CTransform, CVelocity]);
const movementSystem = (world: IWorld): IWorld => {
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

/* SYSTEMS.GRAVITY */
const gravityQuery = defineQuery([CGravity, CVelocity]);
const gravitySystem = (world: IWorld): IWorld => {
  const { time: { updateDelta: dt } } = world;
  for (let eid of gravityQuery(world)) {
    const velocity = CVelocity.vec2[eid];
    velocity[1] += 100 * dt;
  }
  return world
}

/* PROGRAM */
const world = createWorld() as IWorld;
const sprites: Map<number, Sprite> = new Map();
world.sprite = {
  getSprite: (spriteId: number): Sprite => {
    return sprites.get(spriteId)!;
  }
}
world.time = {
  elapsed: 0,
  updateTimeLeft: 0,
  updateDelta: 16 / 1000,
  then: performance.now() / 1000,
};
world.renderer = new Renderer(
  {
    clearBeforeRender: false,
    view: canvas,
    width: 600,
    height: 400,
  }
);
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
const update = pipe(
  gravitySystem,
  movementSystem,
)
const render = pipe(
  drawSystem,
)
let alive = true;
setTimeout(() => alive = false, 10_000);
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
