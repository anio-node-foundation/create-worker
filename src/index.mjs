import fs from "node:fs"
import {spawn} from "node:child_process"
import {fileURLToPath} from "node:url"
import path from "node:path"

import {createMasterInterface} from "@anio-js-foundation/master-slave-protocol"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default function nodeCreateWorker(request_handler_file, node_binary = "node") {
	return new Promise((resolve, reject) => {
		// make sure path is always absolute
		const absolute_request_handler_file = fs.realpathSync(request_handler_file)

		const child = spawn(node_binary, [
			path.resolve(__dirname, "child.mjs"),
			absolute_request_handler_file
		], {
			stdio: ["pipe", "pipe", "pipe", "ipc"]
		})

		const master = createMasterInterface(str => {
			child.send(str)
		})

		child.on("error", reject)

		child.on("message", message => {
			master.onMessage(message)
		})

		master.slaveReady().then(() => {
			resolve({
				stdin : child.stdin,
				stdout: child.stdout,
				stderr: child.stderr,

				sendRequest(...args) {
					return master.sendRequest(...args)
				},

				terminate() {
					child.kill("SIGTERM")
				},

				kill() {
					child.kill("SIGKILL")
				}
			})
		})
	})
}
