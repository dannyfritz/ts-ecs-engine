import {
  addComponent,
  addEntity,
  createWorld,
  defineComponent,
  defineQuery,
  enterQuery,
  IWorld,
  pipe,
  removeEntity,
  Types,
} from 'bitecs';
import {
  mat2d, vec2,
} from 'gl-matrix';
import {
  Renderer,
} from 'pixi.js';
import { audioSystem, createSource, getSourceId, IWorldAudio } from './audio';
import imgBunny from './bunny.png';
import { CSource, CSprite, CTransform2d } from './components';
import sndJump from './jump.wav';
import { createSprite, drawSystem, getSpriteId, IWorldRenderer } from './renderer2d';
import './style.css'
import { IWorldTime, timeSystem } from './time';

const element = document.querySelector<HTMLDivElement>('#app')!;
element.innerHTML = `<canvas tabindex='1'></canvas>`;
const canvas = document.querySelector<HTMLCanvasElement>('canvas')!;

/* COMPONENTS */
const CVelocity2d = defineComponent({
  vec2: [Types.f32, 2],
});
const CGravity = defineComponent();
export const CAction = defineComponent({ action: Types.ui16 });

/* WORLD & CONFIG */
const world = createWorld() as IWorld & IWorldTime & IWorldRenderer & IWorldAudio;
world.time = {
  elapsed: 0,
  updateTimeLeft: 0,
  updateDelta: 16 / 1000,
  then: performance.now() / 1000,
};
world.renderer2d = {
  renderer: new Renderer({
    clearBeforeRender: false,
    view: canvas,
    width: 600,
    height: 400,
  }),
  camera: {},
  sprites: {
    idToSprite: {},
    pathToId: {},
  },
};
world.audio = {
  context: new AudioContext(),
  sources: {
    idToSource: {},
    pathToId: {},
  },
};
const ACTIONS = Object.freeze({
  JUMP: 0,
});
const inputActions: Record<KeyboardEvent["code"], number> = {
  'Space': ACTIONS.JUMP,
};

/* DATA  */
await createSource(world, sndJump);
await createSprite(world, imgBunny);
for (let i = 0; i <= 100; i++) {
  const entityId = addEntity(world);
  addComponent(world, CTransform2d, entityId);
  mat2d.identity(CTransform2d.local[entityId]);
  const localTransform = CTransform2d.local[entityId];
  localTransform[4] = Math.random() * 600;
  localTransform[5] = Math.random() * 200 + 100;
  addComponent(world, CVelocity2d, entityId);
  const velocity = CVelocity2d.vec2[entityId];
  velocity[0] = (Math.random() - 0.5) * 200;
  velocity[1] = (Math.random() - 0.5) * 200;
  addComponent(world, CGravity, entityId);
  addComponent(world, CSprite, entityId);
  CSprite.spriteId[entityId] = getSpriteId(world, imgBunny);
}

/* SYSTEMS */
const movementQuery = defineQuery([CTransform2d, CVelocity2d]);
const movementSystem = <T extends IWorld & IWorldTime>(world: T): T => {
  const { time: { updateDelta: dt } } = world;
  const velocityScaled = vec2.create();
  for (let eid of movementQuery(world)) {
    const localTransform = CTransform2d.local[eid];
    const velocity = CVelocity2d.vec2[eid];
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

const gravityQuery = defineQuery([CGravity, CVelocity2d]);
const gravitySystem = <T extends IWorld & IWorldTime>(world: T): T => {
  const { time: { updateDelta: dt } } = world;
  for (let eid of gravityQuery(world)) {
    const velocity = CVelocity2d.vec2[eid];
    velocity[1] += 100 * dt;
  }
  return world
}

const actionQuery = defineQuery([CAction]);
const actionEnter = enterQuery(actionQuery);
const actionToSourceSystem = <T extends IWorld & IWorldAudio>(world: T): T => {
  for (const eid of actionEnter(world)) {
    if (CAction.action[eid] === ACTIONS.JUMP) {
      const newEid = addEntity(world);
      addComponent(world, CSource, newEid);
      CSource.sourceId[newEid] = getSourceId(world, sndJump);
    }
  }
  return world;
}

const actionDeleteSystem = <T extends IWorld>(world: T): T => {
  for (const eid of actionQuery(world)) {
    removeEntity(world, eid);
  }
  return world;
}

canvas.addEventListener('keydown', (event) => {
  if (inputActions[event.code] !== undefined) {
    const action = inputActions[event.code];
    const actionEid = addEntity(world);
    addComponent(world, CAction, actionEid);
    CAction.action[actionEid] = action;
  }
});

const update = pipe(
  actionToSourceSystem,
  gravitySystem,
  movementSystem,
  actionDeleteSystem,
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
