import {
  mat2d, vec2,
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
  createContextAudio,
  createContextRenderer2d,
  createContextTime,
  createSource,
  createSprite,
  CSource,
  CSprite,
  CTransform2d,
  getSourceId,
  getSpriteId,
  IWorldAudio,
  IWorldRenderer2d,
  IWorldTime,
  SAudio,
  SDraw,
  STime,
} from 'engine';
import imgBunny from '../assets/bunny.png';
import sndJump from '../assets/jump.wav';
import '../assets/style.css'
import { getCanvas, start } from 'domhelpers';


const canvas = getCanvas('#app');

/* COMPONENTS */
const CVelocity2d = defineComponent({
  vec2: [Types.f32, 2],
});
const CGravity = defineComponent();
export const CAction = defineComponent({ action: Types.ui16 });

/* WORLD & CONFIG */
const world = createWorld() as IWorld & IWorldTime & IWorldRenderer2d & IWorldAudio;
world.time = createContextTime();
world.renderer2d = createContextRenderer2d(canvas, vec2.fromValues(600, 400));
world.audio = createContextAudio();
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
const QMovement = defineQuery([CTransform2d, CVelocity2d]);
const SMovement = <T extends IWorld & IWorldTime>(world: T): T => {
  const { time: { updateDelta: dt } } = world;
  const velocityScaled = vec2.create();
  for (let eid of QMovement(world)) {
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

const QGravity = defineQuery([CGravity, CVelocity2d]);
const SGravity = <T extends IWorld & IWorldTime>(world: T): T => {
  const { time: { updateDelta: dt } } = world;
  for (let eid of QGravity(world)) {
    const velocity = CVelocity2d.vec2[eid];
    velocity[1] += 100 * dt;
  }
  return world
}

const QAction = defineQuery([CAction]);
const QActionEnter = enterQuery(QAction);
const SActionToSource = <T extends IWorld & IWorldAudio>(world: T): T => {
  for (const eid of QActionEnter(world)) {
    if (CAction.action[eid] === ACTIONS.JUMP) {
      const newEid = addEntity(world);
      addComponent(world, CSource, newEid);
      CSource.sourceId[newEid] = getSourceId(world, sndJump);
    }
  }
  return world;
}

const SActionDelete = <T extends IWorld>(world: T): T => {
  for (const eid of QAction(world)) {
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

const SUpdate = pipe(
  SActionToSource,
  SGravity,
  SMovement,
  SActionDelete,
)
const SRender = pipe(
  SAudio,
  SDraw,
)

start(world, STime, SUpdate, SRender);
