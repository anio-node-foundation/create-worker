function createWorkerThis() {
	let new_this = {}

	let currentOnMessageHandler = null

	process.on("message", msg => {
		if (typeof currentOnMessageHandler === "function") {
			currentOnMessageHandler(msg)
		}
	})

	Object.defineProperty(new_this, "sendMessage", {
		set() { throw new Error(`Cannot set sendMessage.`) },
		get() { return (str) => process.send(str) }
	})

	Object.defineProperty(new_this, "onMessage", {
		get() { throw new Error(`Cannot read onMessage.`) },
		set(v) { currentOnMessageHandler = v }
	})

	return new_this
}

export default function() {
	let onMessageHandler = (msg) => {
		if (msg.startsWith("init")) {
			process.removeListener("message", onMessageHandler)

			const payload = JSON.parse(msg.slice("init".length))

			import(payload.worker_file_path)
			.then(mod => {
				const init_args = payload.worker_args

				let new_this = createWorkerThis()

				return mod.WorkerMain.apply(new_this, init_args)
			})
			.then(() => {
				process.send(payload.init_token)
			})
		}
	}

	process.on("message", onMessageHandler)
}
