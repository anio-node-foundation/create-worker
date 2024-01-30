import path from "node:path"
import {fileURLToPath} from "node:url"
import {spawn} from "node:child_process"

const __dirname = path.dirname(
	fileURLToPath(import.meta.url)
)

export default function(options) {
	let node_binary_path = "node", silent = true

	if ("node_binary" in options) {
		node_binary_path = options.node_binary
	}

	if ("silent" in options) {
		silent = options.silent
	}

	const stdio = silent ? ["pipe", "pipe", "pipe", "ipc"] : ["pipe", "inherit", "inherit", "ipc"]

	const child = spawn(node_binary_path, [
		path.resolve(__dirname, "bootstrap.mjs")
	], {
		stdio
	})

	return child
}
