# @anio-js-foundation/node-create-worker

Create a node worker.

```js
import nodeCreateWorker from "@anio-js-foundation/node-create-worker"

// ./worker.mjs default export is the request handler
const worker = await nodeCreateWorker("./worker.mjs")

// sending a request
// response will be the return value
// if worker throws error, this will also throw an error
await worker.sendRequest("my request")

// terminating worker
worker.terminate() // or worker.kill()

// access to stdout/stderr
worker.stderr.on("data", data => console.log(`${data}`))
worker.stdout.on("data", data => console.log(`${data}`))
```
