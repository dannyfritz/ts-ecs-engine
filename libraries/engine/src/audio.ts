import { defineQuery, enterQuery, IWorld, removeEntity } from "bitecs";
import { CSource } from "./components";

export type IWorldAudio = {
  audio: {
    context: AudioContext,
    sources: {
      pathToId: Record<string, number>,
      idToSource: Record<number, AudioBuffer>,
    },
  }
};
export const createContextAudio = (): IWorldAudio["audio"] => {
  return {
    context: new AudioContext(),
    sources: {
      idToSource: {},
      pathToId: {},
    },
  };
};
const QSource = defineQuery([CSource]);
const QNewSource = enterQuery(QSource);
export const SAudio = <T extends IWorld & IWorldAudio>(world: T): T => {
  const { audio: { context: audioContext, sources: { idToSource } }} = world;
  for (let eid of QNewSource(world)) {
    const sourceId = CSource.sourceId[eid];
    const audioBuffer = idToSource[sourceId];
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
let nextSourceId = 0;
export const createSource = async (world: IWorldAudio, path: string): Promise<void> => {
  const { audio: { sources } } = world;
  const response = await fetch(path)
  const id = nextSourceId++;
  const buffer = await response.arrayBuffer();
  const decodedBuffer = await world.audio.context.decodeAudioData(buffer);
  sources.pathToId[path] = id;
  sources.idToSource[id] = decodedBuffer;
}
export const getSourceId = (world: IWorldAudio, path: string): number => {
  const { audio: { sources } } = world;
  return sources.pathToId[path];
}
