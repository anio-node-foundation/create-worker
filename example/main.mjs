import nodeCreateWorker from "../src/index.mjs"
import path from "node:path"
import {fileURLToPath} from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const worker = await nodeCreateWorker(path.join(__dirname, "worker.mjs"), ["a", "b"], {
	silent: false
})

worker.sendMessage("Hello from main!")

worker.onMessage = (msg) => {
	console.log("Got message from worker", msg)
}

setTimeout(() => {
	worker.sendMessage("Hello from main again!")
}, 1000)
