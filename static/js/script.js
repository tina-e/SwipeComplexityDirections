async function send() {

    const name = document.getElementById("name").value
    const value = document.getElementById("value").value

    const res = await fetch("/log", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({name: name, value: value})
    })

    const data = await res.json()

    document.getElementById("status").innerText = "Saved!"
}