import { defineComponent, Types } from "bitecs";

export const CTransform2d = defineComponent({ local: [Types.f32, 6] });
export const CSprite = defineComponent({ spriteId: Types.ui16 });
export const CShape = defineComponent({ type: Types.ui8, data: [Types.f32, 4] });
export const CSource = defineComponent({ sourceId: Types.ui16 });
