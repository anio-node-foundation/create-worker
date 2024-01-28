import {setupSlave} from "@anio-js-foundation/master-slave-protocol"

const {requestHandler} = await import(process.argv[2])

const slave = setupSlave(msg => {
	process.send(msg)
}, requestHandler)

process.on("message", slave.onMessage)
