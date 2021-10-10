import { defineQuery, enterQuery, IWorld, removeEntity } from "bitecs";
import { CSource } from "./components";

export type IWorldAudio = {
  audio: {
    context: AudioContext,
    sourceIds: Map<string, number>,
    sources: Map<number, AudioBuffer>,
  }
};
const sourceQuery = defineQuery([CSource]);
const newSourceQuery = enterQuery(sourceQuery);
export const audioSystem = <T extends IWorld & IWorldAudio>(world: T): T => {
  const { audio: { context: audioContext, sources }} = world;
  for (let eid of newSourceQuery(world)) {
    const sourceId = CSource.sourceId[eid];
    const audioBuffer = sources.get(sourceId)!;
    const bufferSource = audioContext.createBufferSource();
    bufferSource.buffer = audioBuffer;
    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    bufferSource.connect(gainNode);
    gainNode.connect(audioContext.destination)
    bufferSource.start();
    removeEntity(world, eid);
  }
  return world;
}
