export function WorkerMain(...args) {
	console.log("WorkerMain", args)

	this.onMessage = data => {
		console.log("Worker got a message", data)
	}

	this.sendMessage("Hello from Worker!")

	setTimeout(() => {
		this.sendMessage("Hello again from Worker!")
	}, 1000)
}
