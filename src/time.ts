import type { IWorld } from 'bitecs';

export type IWorldTime = {
  time: {
    elapsed: number,
    updateTimeLeft: number,
    updateDelta: number,
    then: number,
  }
};
export const timeSystem = <T extends IWorldTime & IWorld>(world: T): T => {
  const { time } = world;
  const now = performance.now() / 1000;
  const delta = now - time.then;
  time.updateTimeLeft += delta;
  time.elapsed += delta;
  time.then = now;
  return world;
}
