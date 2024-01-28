import {setupSlave} from "@anio-js-foundation/master-slave-protocol"

const request_handler = (await import(process.argv[2])).default

const slave = setupSlave(msg => {
	process.send(msg)
}, request_handler)

process.on("message", slave.onMessage)
