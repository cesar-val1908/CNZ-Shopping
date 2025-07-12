document.addEventListener("DOMContentLoaded", () => {
    const startBtn = document.getElementById("start-btn");
    const eventInput = document.getElementById("event-input");
    const resultsDiv = document.getElementById("shopping-list-results");
    const finalShoppingListDiv = document.getElementById("final-shopping-list");

    let accepted = [];
    let rejected = [];
    let currentEvent = "";
    let suggestionCount = 0;
    const maxSuggestions = 5;

    startBtn.addEventListener("click", async () => {
        currentEvent = eventInput.value.trim();
        accepted = [];
        rejected = [];
        suggestionCount = 0;
        finalShoppingListDiv.style.display = "none";
        await getNextItem();
    });

    async function getNextItem() {
        if (suggestionCount >= maxSuggestions) {
            displayFinalList();
            return;
        }

        resultsDiv.innerHTML = "Loading...";
        const response = await fetch("/get_shopping_list_item", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                event: currentEvent,
                accepted: accepted,
                rejected: rejected
            })
        });

        suggestionCount++;
        const data = await response.json();

        if (data.error || !data.item) {
            resultsDiv.innerHTML = `<p>Error: ${data.error || "No more items."}</p>`;
            displayFinalList();
            return;
        }

        resultsDiv.innerHTML = `
            <h3>Suggested Item :</h3>
            <p><strong>${data.item}</strong>: ${data.reason} (${data.price})</p>
            <button id="accept-btn">Accept</button>
            <button id="reject-btn">Reject</button>
        `;

        document.getElementById("accept-btn").onclick = () => {
            accepted.push(data);
            getNextItem();
        };

        document.getElementById("reject-btn").onclick = () => {
            rejected.push(data.item);
            getNextItem();
        };
    }

    function displayFinalList() {
        resultsDiv.innerHTML = "";
        finalShoppingListDiv.style.display = "block";
        let listHtml = "<h2>Final Shopping List</h2><ul>";
        accepted.forEach(item => {
            listHtml += `<li><strong>${item.item}</strong>: ${item.reason} (${item.price})</li>`;
        });
        listHtml += "</ul>";
        finalShoppingListDiv.innerHTML = listHtml;
    }
});
