import createNodeWorkerProcess from "./createNodeWorkerProcess.mjs"

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
	let resolve, reject;

	/**
	 * @anio-js-core-foundation/create-promise is not
	 * used here to keep this package dependency free.
	 */
	let promise = new Promise((a, b) => {
		resolve = a; reject = b;
	})

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
