document.addEventListener("DOMContentLoaded", () => {
    const compareBtn = document.getElementById("compare-btn");
    const item1Input = document.getElementById("item1-input");
    const item2Input = document.getElementById("item2-input");
    const resultsDiv = document.getElementById("comparison-results");

    compareBtn.addEventListener("click", async () => {
        const item1 = item1Input.value;
        const item2 = item2Input.value;

        if (!item1 || !item2) {
            resultsDiv.innerHTML = "<p>Please enter both items to compare.</p>";
            return;
        }

        resultsDiv.innerHTML = "<p>Loading comparison...</p>";

        try {
            const response = await fetch("/compare", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ item1, item2 }),
            });

            const data = await response.json();

            if (data.error) {
                resultsDiv.innerHTML = `<p>Error: ${data.error}</p>`;
            } else {
                resultsDiv.innerHTML = JSON.stringify(data.comparison);
            }
        } catch (error) {
            console.error("Error fetching comparison:", error);
            resultsDiv.innerHTML = "<p>An error occurred while fetching the comparison. Please try again later.</p>";
        }
    });
});
