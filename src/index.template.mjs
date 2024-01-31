import createRandomIdentifier from "@anio-js-core-foundation/create-random-identifier"
import createPromise from "@anio-js-core-foundation/create-promise"

import {spawn} from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

function createTemporaryBootstrapFile() {
	const tmpdir = os.tmpdir()
	const tmpname = createRandomIdentifier(16)
	const tmppath = path.join(tmpdir, tmpname + ".mjs")

	fs.writeFileSync(tmppath, `$bootstrap.mjs_file_contents$`)

	return tmppath
}

function createNodeWorkerProcess(options) {
	let node_binary_path = "node", silent = true

	if ("node_binary" in options) {
		node_binary_path = options.node_binary
	}

	if ("silent" in options) {
		silent = options.silent
	}

	const stdio = silent ? ["pipe", "pipe", "pipe", "ipc"] : ["pipe", "inherit", "inherit", "ipc"]

	const bootstrap_path = createTemporaryBootstrapFile()

	const child = spawn(node_binary_path, [
		bootstrap_path
	], {
		stdio
	})

	// delete bootstrap file after first ipc message
	let onMessageHandler = (msg) => {
		child.removeListener("message", onMessageHandler)

		try {
			fs.unlinkSync(bootstrap_path)
		} catch {}
	}

	child.on("message", onMessageHandler)

	return child
}

function createWorkerInstance({
	child,
	worker_message_buffer
}) {
	let instance = {}

	let currentOnMessageHandler = null

	child.on("message", msg => {
		if (typeof currentOnMessageHandler === "function") {
			currentOnMessageHandler(msg)
		}
	})

	Object.defineProperty(instance, "onMessage", {
		set(handler) {
			// dump message buffer first
			while (worker_message_buffer.length) {
				const msg = worker_message_buffer.shift()

				handler(msg)
			}

			currentOnMessageHandler = handler
		}
	})

	Object.defineProperty(instance, "sendMessage", {
		enumerable: true,
		get() { return (str) => child.send(str) }
	})

	Object.defineProperty(instance, "terminate", {
		enumerable: true,
		get() { return () => child.kill("SIGKILL") }
	})

	return instance
}

export default function nodeCreateWorker(worker_file_path, worker_args, additional = {}) {
	let {promise, resolve, reject} = createPromise()

	const init_token = Math.random().toString(32) + "_" + Math.random().toString(32)

	let child = createNodeWorkerProcess(additional)
	let worker_message_buffer = []

	child.on("error", reject)

	child.on("message", msg => {
		if (msg === init_token) {
			resolve(
				createWorkerInstance({
					child,
					worker_message_buffer
				})
			)
		}
		// buffer other messages between worker and main script
		else {
			worker_message_buffer.push(msg)
		}
	})

	child.send("init" + JSON.stringify({
		worker_file_path,
		worker_args,
		init_token,
		additional
	}))

	return promise
}
