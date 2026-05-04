document.getElementById("btn").addEventListener("click", createItinerary);

async function createItinerary() {
    const place = document.getElementById("place").textContent;
    const output = document.getElementById("prompt");

    try {
        output.textContent = "Loading Itinerary...";
        console.log(place);
        const res = await fetch('/promptItinerary', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: `create a 1 to 3 days travel plan for ${place}, only the itinerary`
            })
        });

        const api = await res.json();

        output.innerHTML = api.reply;

    } catch (err) {
        console.error("generate error",err);
        output.textContent = "Failed to generate itinerary.";
    }
}