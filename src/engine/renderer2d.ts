import { Framebuffer, Renderer } from "pixi.js";
import { Matrix } from '@pixi/math';
import { Sprite } from "@pixi/sprite";
import { defineQuery, IWorld } from "bitecs";
import { CSprite, CTransform2d } from "./components";
import { vec2 } from "gl-matrix";

export type IWorldRenderer2d = {
  renderer2d: {
    framebuffer?: Framebuffer,
    renderer: Renderer,
    sprites: {
      idToSprite: Record<number, Sprite>,
      pathToId: Record<string, number>,
    }
  }
}
export const createContextRenderer2d = (canvas: HTMLCanvasElement, size: vec2): IWorldRenderer2d["renderer2d"] => {
  return {
    renderer: new Renderer({
      clearBeforeRender: false,
      view: canvas,
      width: size[0],
      height: size[1],
    }),
    sprites: {
      idToSprite: {},
      pathToId: {},
    },
  };
};
const QDrawSprite = defineQuery([CTransform2d, CSprite]);
export const SDraw = <T extends IWorld & IWorldRenderer2d>(world: T): T => {
  const {
    renderer2d: {
      renderer,
      sprites,
    }
  } = world;
  renderer.clear();
  for (let eid of QDrawSprite(world)) {
    const spriteId = CSprite.spriteId[eid];
    const localTransform = CTransform2d.local[eid];
    const sprite = sprites.idToSprite[spriteId];
    sprite.transform.setFromMatrix(new Matrix(...localTransform));
    renderer.render(sprite);
  }
  renderer.batch.flush();
  return world;
}
export const createSprite = async (world: IWorldRenderer2d, path: string): Promise<number> => {
  const { renderer2d: { sprites } } = world;
  const sprite = Sprite.from(path);
  const id = sprite.texture.baseTexture.uid;
  sprites.pathToId[path] = id;
  sprites.idToSprite[id] = sprite;
  return id;
}
export const getSpriteId = (world: IWorldRenderer2d, path: string): number => {
  const { renderer2d: { sprites } } = world;
  return sprites.pathToId[path];
}
