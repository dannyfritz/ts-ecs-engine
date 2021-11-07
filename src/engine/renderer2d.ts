import { Graphics, Framebuffer, Renderer } from "pixi.js";
import { Matrix, Rectangle } from '@pixi/math';
import { Sprite } from "@pixi/sprite";
import { defineQuery, IWorld } from "bitecs";
import { CSprite, CTransform2d } from "./components";
import { vec2 } from "gl-matrix";
import { CShape } from ".";

export type IWorldRenderer2d = {
  renderer2d: {
    framebuffer?: Framebuffer,
    geometry: Graphics,
    renderer: Renderer,
    sprites: {
      idToSprite: Record<number, Sprite>,
      pathToId: Record<string, number>,
    }
  }
}
export const createContextRenderer2d = (canvas: HTMLCanvasElement, size: vec2): IWorldRenderer2d["renderer2d"] => {
  const renderer = new Renderer({
    clearBeforeRender: false,
    view: canvas,
    width: size[0],
    height: size[1],
  });
  return {
    geometry: new Graphics(),
    renderer: renderer,
    sprites: {
      idToSprite: {},
      pathToId: {},
    },
  };
};
export const SHAPES = {
  RECTANGLE: 0,
};
const QDrawSprite = defineQuery([CTransform2d, CSprite]);
const QDrawShape = defineQuery([CTransform2d, CShape]);
export const SDraw = <T extends IWorld & IWorldRenderer2d>(world: T): T => {
  const {
    renderer2d: {
      geometry,
      renderer,
      sprites,
    }
  } = world;
  renderer.clear();
  geometry.clear();
  for (let eid of QDrawSprite(world)) {
    const spriteId = CSprite.spriteId[eid];
    const localTransform = CTransform2d.local[eid];
    const sprite = sprites.idToSprite[spriteId];
    sprite.transform.setFromMatrix(new Matrix(...localTransform));
    renderer.render(sprite);
  }
  for (let eid of QDrawShape(world)) {
    const localTransform = CTransform2d.local[eid];
    const shape = CShape.type[eid];
    const data = CShape.data[eid];
    switch (shape) {
      case SHAPES.RECTANGLE: {
        // sprite.transform.setFromMatrix(new Matrix(...localTransform));
        
        const shape = new Rectangle(data[0], data[1], data[2] - data[0], data[3] - data[1])
        geometry.beginFill(0xDE3249);
        geometry.drawShape(shape);
        geometry.endFill();
        break;
      }
    }
  }
  renderer.render(geometry);
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
