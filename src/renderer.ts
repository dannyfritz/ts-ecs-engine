import { Renderer } from "@pixi/core";
import { Sprite } from "@pixi/sprite";
import { defineQuery, IWorld } from "bitecs";
import { CSprite, CTransform } from "./components";

export type Camera = {

}

export type IWorldRenderer = {
  renderer: {
    camera: Camera,
    renderer: Renderer,
    sprite: {
      getSprite: (spriteId: number) => Sprite,
    }
  }
}
const drawSpriteQuery = defineQuery([CTransform, CSprite]);
export const drawSystem = <T extends IWorld & IWorldRenderer>(world: T): T => {
  const {
    renderer: {
      renderer,
      sprite: { getSprite }
    }
  } = world;
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
