import { IWorld } from "bitecs";

export const getCanvas = (querySelector: string): HTMLCanvasElement => {
	const element = document.querySelector<HTMLElement>(querySelector)!;
	element.innerHTML = `<canvas tabindex='1'></canvas>`;
	return document.querySelector<HTMLCanvasElement>('canvas')!;
}

export const start = (world: IWorld, STime, SUpdate, SRender) => {
	let alive = true;
	const main: FrameRequestCallback = () => {
	STime(world);
	while (world.time.updateTimeLeft >= world.time.updateDelta) {
		SUpdate(world);
		world.time.updateTimeLeft -= world.time.updateDelta;
	}
	SRender(world);
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
