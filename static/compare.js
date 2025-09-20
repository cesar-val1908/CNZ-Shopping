document.addEventListener("DOMContentLoaded", () => {
    const compareBtn = document.getElementById("compare-btn");
    const inputsWrapper = document.querySelector(".inputs-wrapper");
    const addBtn = document.getElementById("add-btn");
    const resultsDiv = document.getElementById("comparison-results");

    const spinnerFrames = [
        "⠁", "⠂", "⠄", "⡀", "⡈", "⡐", "⡠", "⣀", "⣁", "⣂", "⣄", "⣌", "⣔", "⣤", "⣥", "⣦", "⣮", "⣶", "⣷", "⣿", "⡿", "⠿", "⢟", "⠟", "⡛", "⠛", "⠫", "⢋", "⠋", "⠍", "⡉", "⠉", "⠑", "⠡", "⢁"
    ];

    addBtn.addEventListener("click", () => {
        const newInputGroup = document.createElement("div");
        newInputGroup.classList.add("input-group");

        const newInput = document.createElement("input");
        newInput.classList.add("item-input");
        newInput.type = "text";
        newInput.placeholder = "Enter item name";

        newInputGroup.appendChild(newInput);
        inputsWrapper.insertBefore(newInputGroup, addBtn.parentElement);
    });

    compareBtn.addEventListener("click", async () => {
        const inputs = inputsWrapper.querySelectorAll('.item-input');
        const values = Array.from(inputs)
            .filter(input => input.value.trim() !== "" && input.placeholder !== "Add Another...")
            .map(input => input.value);

        if (values.length < 2) {
            resultsDiv.innerHTML = `<p>Please enter at least two items to compare.</p>`;
            return;
        }

        let frameIndex = 0;
        resultsDiv.innerHTML = `<p id="compare-spinner"><span style="white-space:pre">${spinnerFrames[frameIndex]}</span> Loading comparison</p>`;
        const spinnerElem = document.getElementById("compare-spinner");
        const spinnerInterval = setInterval(() => {
            frameIndex = (frameIndex + 1) % spinnerFrames.length;
            spinnerElem.innerHTML = `<span style="white-space:pre">${spinnerFrames[frameIndex]}</span> Loading comparison`;
        }, 70);

        try {
            const response = await fetch("/compare-items", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ items: values }),
            });

            clearInterval(spinnerInterval);
            const data = await response.json();

            const compareInputs = document.querySelector(".compare-inputs");
            if (compareInputs) {
                compareInputs.style.display = 'none';
            }

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
                const sidebarResults = document.getElementById("sidebar-results");
                sidebarResults.innerHTML = `
                    <h3>Distinctions</h3>
                    <p>${output.distinctions}</p>
                    <h3>Recommendations</h3>
                    <p>${output.recommendations}</p>
                `;
                sidebarResults.style.display = 'block'; // Show the sidebar

                resultsDiv.innerHTML = `
                    <h3>Comparison Results</h3>
                    <br>
                    <div id="comparison-items-wrapper"></div>
                `;

                const itemsWrapper = document.getElementById("comparison-items-wrapper");

                output.comparison.forEach(element => {
                    let specsHtml = '';
                    element.specs.forEach(group => {
                        specsHtml += `<h5 class="spec-group-name">${group.groupName}</h5>`;
                        specsHtml += `<div class="specs-group">`;
                        group.stats.forEach(stat => {
                            let statClass = '';
                            if (stat.status === 'good') {
                                statClass = 'good-stat';
                            } else if (stat.status === 'bad') {
                                statClass = 'bad-stat';
                            }
                            specsHtml += `
                                <div class="spec-item ${statClass}">
                                    <span class="spec-name">${stat.name}:</span>
                                    <span class="spec-value">${stat.value}</span>
                                    ${stat.indicator ? `<span class="spec-indicator">${stat.indicator}</span>` : ''}
                                </div>
                            `;
                        });
                        specsHtml += `</div>`;
                    });

                    itemsWrapper.innerHTML += `
                        <div class="comparison-item">
                            <h4>${element.item}</h4>
                            <h4>Price: ${element.price}</h4>
                            <p class="pros"> Pros: ${element.pros}</p>
                            <p class="cons"> Cons: ${element.cons}</p>
                            <br></br>
                            ${specsHtml}
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
