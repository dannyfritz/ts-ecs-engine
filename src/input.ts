import { addComponent, addEntity, IWorld } from "bitecs";
import { CAction } from "./components";

export type IWorldInput = {
  mappings: Record<KeyboardEvent["code"], number>,
};

export const bootstrapInputSystem = <T extends IWorld & IWorldInput>(target: HTMLElement, world: T) => {
  const { input: { mappings } } = world;
  target.addEventListener('keydown', (event) => {
    if (mappings[event.code] !== undefined) {
      const action = mappings[event.code];
      const actionEid = addEntity(world);
      addComponent(world, CAction, actionEid);
      CAction.action[actionEid] = action;
    }
  });
}
