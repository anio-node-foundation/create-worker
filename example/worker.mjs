export function NodeWorkerMain(...args) {
	console.log("NodeWorkerMain", args)

	this.on("message", data => {
		console.log("Worker got a message", data)
	})

	this.sendMessage("Hello from Worker!")

	setTimeout(() => {
		this.sendMessage("Hello again from Worker!")
	}, 1000)
}
