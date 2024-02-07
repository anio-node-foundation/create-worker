import nodeIsProcessRunning from "@anio-js-core-foundation/node-is-process-running"
import eventEmitter from "@anio-js-core-foundation/simple-event-emitter"

let global_parent_pid = null

function exitIfParentIsDead() {
	if (global_parent_pid === null) return

	if (!nodeIsProcessRunning(global_parent_pid)) {
		process.exit(1)

		return true
	}

	return false
}

function exitIfParentIsDeadLoop() {
	if (exitIfParentIsDead()) return

	setTimeout(exitIfParentIsDeadLoop, 250)
}

function createWorkerThis() {
	let new_this = {}

	let event_emitter = eventEmitter(["message"])

	let dispatchEvent = event_emitter.install(new_this)

	process.on("message", msg => {
		dispatchEvent("message", msg)
	})

	Object.defineProperty(new_this, "sendMessage", {
		enumerable: true,

		set() { throw new Error(`Cannot set sendMessage.`) },
		get() {
			return (str) => {
				exitIfParentIsDead()

				return process.send(str)
			}
		}
	})

	return new_this
}

let onMessageHandler = (msg) => {
	if (msg.startsWith("init")) {
		process.removeListener("message", onMessageHandler)

		const payload = JSON.parse(msg.slice("init".length))

		global_parent_pid = payload.parent_pid

		import(payload.worker_file_path)
		.then(mod => {
			const init_args = payload.worker_args

			let new_this = createWorkerThis()

			return mod.NodeWorkerMain.apply(new_this, init_args)
		})
		.then(() => {
			process.send(payload.init_token)

			setTimeout(exitIfParentIsDeadLoop, 0)
		})
	}
}

process.on("message", onMessageHandler)
