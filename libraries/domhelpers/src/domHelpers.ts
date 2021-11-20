import type { IWorld } from "bitecs";
import type { IWorldRenderer2d, IWorldTime, STime } from "engine";

export const getCanvas = (querySelector: string): HTMLCanvasElement => {
	const element = document.querySelector<HTMLElement>(querySelector)!;
	element.innerHTML = `<canvas tabindex='1'></canvas>`;
	return document.querySelector<HTMLCanvasElement>('canvas')!
}

export const start = (world: IWorld & IWorldTime & IWorldRenderer2d, sTime: typeof STime, sUpdate: (world: IWorld) => IWorld, sRender: (world: IWorld) => IWorld) => {
	let alive = true;
	const main: FrameRequestCallback = () => {
		sTime(world);
		while (world.time.updateTimeLeft >= world.time.updateDelta) {
			sUpdate(world);
			world.time.updateTimeLeft -= world.time.updateDelta;
		}
		sRender(world);
		if (alive) {
			requestAnimationFrame(main);
		}
	};
	requestAnimationFrame(main);

	setTimeout(() => {
		console.log('stopping')
		alive = false
	}, 10_000)
}
