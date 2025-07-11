document.addEventListener("DOMContentLoaded", () => {
    const compareBtn = document.getElementById("compare-btn");
    const inputsWrapper = document.querySelector(".inputs-wrapper");
    const addBtn = document.getElementById("add-btn");
    const item1Input = document.getElementById("item1-input");
    const item2Input = document.getElementById("item2-input");
    const resultsDiv = document.getElementById("comparison-results");

    const spinnerFrames = [
        "⠁",
        "⠂",
        "⠄",
        "⡀",
        "⡈",
        "⡐",
        "⡠",
        "⣀",
        "⣁",
        "⣂",
        "⣄",
        "⣌",
        "⣔",
        "⣤",
        "⣥",
        "⣦",
        "⣮",
        "⣶",
        "⣷",
        "⣿",
        "⡿",
        "⠿",
        "⢟",
        "⠟",
        "⡛",
        "⠛",
        "⠫",
        "⢋",
        "⠋",
        "⠍",
        "⡉",
        "⠉",
        "⠑",
        "⠡",
        "⢁"
    ];

    addBtn.addEventListener("click", () => {
        const newInput = document.createElement("input");
        newInput.classList.add("item-input");
        newInput.type = "text";
        newInput.placeholder = "Enter item name";
        inputsWrapper.appendChild(newInput);
    });
    compareBtn.addEventListener("click", async () => {

        const inputs = inputsWrapper.querySelectorAll('input[type="text"]');
        const values = Array.from(inputs).map(input => input.value);

        console.log("Values to compare:", values.toString());

        let frameIndex = 0;
        resultsDiv.innerHTML = `<p id="compare-spinner"><span style="white-space:pre">${spinnerFrames[frameIndex]}</span> Loading comparison</p>`;
        const spinnerElem = document.getElementById("compare-spinner");
        const spinnerInterval = setInterval(() => {
            frameIndex = (frameIndex + 1) % spinnerFrames.length;
            spinnerElem.innerHTML = `<span style="white-space:pre">${spinnerFrames[frameIndex]}</span> Loading comparison`;
        }, 70);

        try {
            const response = await fetch("/compare", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ items: values }),
            });

            clearInterval(spinnerInterval);
            const data = await response.json();

            if (!data.table) {
                resultsDiv.innerHTML = `<p>Error: No comparison data returned. Please check your input or try again later.</p>`;
                return;
            }

            const output = {
                distinctions: data.distinctions,
                recommendations: data.recommend,
                comparison: data.table,

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
                            <h4>Price: ${element.price}</h4>
                            <p class="pros"> Pros: ${element.pros}</p>
                            <p class="cons"> Cons: ${element.cons}</p>
                            <br></br>
                            ${specsTable}
                        </div>
                    `;
                });
            }
        } catch (error) {
            clearInterval(spinnerInterval);
            console.error("Error fetching comparison:", error);
            resultsDiv.innerHTML = "<p>An error occurred while fetching the comparison. Please try again later.</p>";
        }
    });
});
