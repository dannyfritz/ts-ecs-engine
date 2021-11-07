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
  createContextAudio,
  createContextRenderer2d,
  createContextTime,
  createSource,
  createSprite,
  CShape,
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
  SHAPES,
  STime,
} from './engine';
import { getCanvas, start } from './engine/domHelpers';
import imgBunny from './bunny.png';
import sndJump from './jump.wav';
import './style.css'


const canvas = getCanvas('#app');

/* COMPONENTS */
const CVelocity2d = defineComponent({
  vec2: [Types.f32, 2],
});
const CPaddleTag = defineComponent();
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
const paddleEntityId = addEntity(world);
addComponent(world, CPaddleTag, paddleEntityId);
addComponent(world, CTransform2d, paddleEntityId);
mat2d.identity(CTransform2d.local[paddleEntityId]);
const localTransform = CTransform2d.local[paddleEntityId];
localTransform[4] = 50.0;
localTransform[5] = 50.0;
addComponent(world, CVelocity2d, paddleEntityId);
const velocity = CVelocity2d.vec2[paddleEntityId];
velocity[0] = 0;
velocity[1] = 0;
addComponent(world, CShape, paddleEntityId);
CShape.type[paddleEntityId] = SHAPES.RECTANGLE;
const paddleShapeData = CShape.data[paddleEntityId];
paddleShapeData[0] = 0.0;
paddleShapeData[1] = 0.0;
paddleShapeData[2] = 100.0;
paddleShapeData[3] = 25.0;
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
  SMovement,
  SActionDelete,
)

const SRender = pipe(
  SAudio,
  SDraw,
)

start(world, STime, SUpdate, SRender);
