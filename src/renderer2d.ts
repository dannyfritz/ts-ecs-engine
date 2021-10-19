import { Framebuffer, Renderer } from "@pixi/core";
import { Sprite } from "@pixi/sprite";
import { defineQuery, IWorld } from "bitecs";
import { CSprite, CTransform2d } from "./components";

export type Camera = {}
export type IWorldRenderer = {
  renderer2d: {
    camera: Camera,
    framebuffer?: Framebuffer,
    renderer: Renderer,
    sprites: {
      idToSprite: Record<number, Sprite>,
      pathToId: Record<string, number>,
    }
  }
}
const drawSpriteQuery = defineQuery([CTransform2d, CSprite]);
export const drawSystem = <T extends IWorld & IWorldRenderer>(world: T): T => {
  const {
    renderer2d: {
      renderer,
      sprites,
    }
  } = world;
  renderer.clear();
  for (let eid of drawSpriteQuery(world)) {
    const spriteId = CSprite.spriteId[eid];
    const localTransform = CTransform2d.local[eid];
    const sprite = sprites.idToSprite[spriteId];
    sprite.x = localTransform[4];
    sprite.y = localTransform[5];
    renderer.render(sprite);
  }
  renderer.batch.flush();
  return world;
}
export const createSprite = async (world: IWorldRenderer, path: string): Promise<number> => {
  const { renderer2d: { sprites } } = world;
  const sprite = Sprite.from(path);
  const id = sprite.texture.baseTexture.uid;
  sprites.pathToId[path] = id;
  sprites.idToSprite[id] = sprite;
  return id;
}
export const getSpriteId = (world: IWorldRenderer, path: string): number => {
  const { renderer2d: { sprites } } = world;
  return sprites.pathToId[path];
}
