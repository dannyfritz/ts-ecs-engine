import { defineComponent, Types } from "bitecs";

export const CTransform = defineComponent({
  local: [Types.f32, 6],
});
export const CVelocity = defineComponent({
  vec2: [Types.f32, 2],
});
export const CGravity = defineComponent();
export const CSprite = defineComponent({
  spriteId: Types.ui16,
});
export const CSource = defineComponent({
  sourceId: Types.ui16,
});
