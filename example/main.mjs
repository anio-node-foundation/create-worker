import nodeCreateWorker from "../dist/package.mjs"
import path from "node:path"
import {fileURLToPath} from "node:url"
import {setSharedItem} from "@anio-js-core-foundation/anio-global-store"

setSharedItem("test", 1337)

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const worker = await nodeCreateWorker(path.join(__dirname, "worker.mjs"), ["a", "b"], {
	silent: false
})

worker.sendMessage("Hello from main!")

worker.on("message", (msg) => {
	console.log("Got message from worker", msg)
})

setTimeout(() => {
	worker.sendMessage("Hello from main again!")
}, 1000)
