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
            const output = {
                distinctions: data.comparison.distinctions,
                recommendations: data.comparison.recommend,
                comparison: data.comparison.table,

            }

            if (data.error) {
                resultsDiv.innerHTML = `<p>Error: ${data.error}</p>`;
            } else {
                resultsDiv.innerHTML = `
                    <h3>Comparison Results</h3>
                    <h4>Distinctions: ${output.distinctions}</h4>
                    <h4>Recommendations: ${output.recommendations}</h4>
                    <br>
                    <div id="comparison-items-wrapper"></div>
                `;

                const itemsWrapper = document.getElementById("comparison-items-wrapper");

                output.comparison.forEach(element => {
                    let specsTable = `<table class="specs-table"><thead>`;

                    Object.entries(element.specs).forEach(([name, value]) => {
                        specsTable += `<tr>
                            <td>${name}</td>
                            <td>${value}</td>
                        </tr>`
                    });

                    specsTable += `</thead></table>`;

                    itemsWrapper.innerHTML += `
                        <div class="comparison-item">
                            <h4>${element.item}</h4>
                            <p class="pros"> Pros: ${element.pros}</p>
                            <p class="cons"> Cons: ${element.cons}</p>
                            <br></br>
                            ${specsTable}
                        </div>
                    `;
                });
            }
        } catch (error) {
            console.error("Error fetching comparison:", error);
            resultsDiv.innerHTML = "<p>An error occurred while fetching the comparison. Please try again later.</p>";
        }
    });
});
