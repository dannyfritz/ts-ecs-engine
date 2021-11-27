#!/usr/bin/env node

import process from "process";
import { spawn } from "child_process";
import chokidar from "chokidar";
import { readPackageUp } from "read-pkg-up";
// import { run } from '@pnpm/plugin-commands-script-runners';

chokidar
	.watch(".", {
		ignored: ["**/node_modules", "**/dist", ".git", ".parcel-cache"],
		ignoreInitial: true,
		followSymlinks: false,
	})
	.on("all", async (event, path) => {
		console.log(event, path);
		const packageJson = await readPackageUp({ cwd: path });
		const packageName = packageJson.packageJson.name;
		console.log(`Package Changed: ${packageName}`);
		const child = spawn("pnpm", ["run", "-r", "build", "--filter", `...^${packageName}`]);
		child.stdout.on("data", (data) => {
			process.stdout.write(`EXEC: ${data}`);
		});
		child.stderr.on("data", (data) => {
			process.stderr.write(`EXEC_ERR: ${data}`);
		});
		child.on("close", (code) => {
			process.stdout.write(`EXEC: exited with code ${code}`);
		});
	})
	.on("ready", () => console.log("Watching for changes..."));
