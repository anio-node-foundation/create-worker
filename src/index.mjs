import createRandomIdentifier from "@anio-js-core-foundation/create-random-identifier"
import createPromise from "@anio-js-core-foundation/create-promise"
import createTemporaryResource from "@anio-js-foundation/create-temporary-resource"
import bootstrap_code from "includeStaticResource:../dist/bootstrap.mjs"

async function createNodeWorkerProcess(dependencies, options) {
	const {spawn} = dependencies

	let node_binary_path = "node", silent = true

	if ("node_binary" in options) {
		node_binary_path = options.node_binary
	}

	if ("silent" in options) {
		silent = options.silent
	}

	const stdio = silent ? ["pipe", "pipe", "pipe", "ipc"] : ["pipe", "inherit", "inherit", "ipc"]

	const bootstrap = await createTemporaryResource(
		bootstrap_code, {type: "text/javascript"}
	)

	const child = spawn(node_binary_path, [
		bootstrap.location
	], {
		stdio
	})

	// delete bootstrap file after first ipc message
	let onMessageHandler = (msg) => {
		child.removeListener("message", onMessageHandler)

		bootstrap.cleanup()
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

async function nodeCreateWorkerImplementation(dependencies, worker_file_path, worker_args, additional = {}) {
	let {promise, resolve, reject} = createPromise()

	const init_token = Math.random().toString(32) + "_" + Math.random().toString(32)

	let child = await createNodeWorkerProcess(dependencies, additional)
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

export default async function nodeCreateWorker(...args) {
	const {spawn} = await import("node:child_process")

	const dependencies = {spawn}

	return await nodeCreateWorkerImplementation(
		dependencies, ...args
	)
}
