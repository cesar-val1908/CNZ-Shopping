document.addEventListener("DOMContentLoaded", () => {
  const compareBtn = document.getElementById("compare-btn");
  const inputsWrapper = document.querySelector(".inputs-wrapper");
  const addBtn = document.getElementById("add-btn");
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
    "⢁",
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

  async function getPerplexityItemData(itemName) {
    try {
      const response = await puter.ai.chat(
        `Get product data for "${itemName}". Include specs, price, pros, and cons.`,
        { model: "perplexity/sonar" }
      );
      return { item: itemName, ...response };
    } catch (error) {
      console.error(`Error getting data for ${itemName}:`, error);
      return { item: itemName, error: "Failed to fetch data" };
    }
  }

  compareBtn.addEventListener("click", async () => {
    const inputs = inputsWrapper.querySelectorAll(".item-input");
    const values = Array.from(inputs)
      .filter(
        (input) =>
          input.value.trim() !== "" && input.placeholder !== "Add Another...",
      )
      .map((input) => input.value);

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
      const itemDataPromises = values.map(getPerplexityItemData);
      const itemData = await Promise.all(itemDataPromises);

      const response = await fetch("/compare-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items: itemData }),
      });

      clearInterval(spinnerInterval);
      const data = await response.json();

      const compareInputs = document.querySelector(".compare-inputs");
      if (compareInputs) {
        compareInputs.style.display = "none";
      }

      const header = document.querySelector(".header");
      if (header) {
        header.style.display = "none";
      }

      const description = document.querySelector(".description");
      if (description) {
        description.style.display = "none";
      }

      if (!data.table) {
        resultsDiv.innerHTML = `<p>Error: No comparison data returned. Please check your input or try again later.</p>`;
        return;
      }

      const output = {
        distinctions: data.distinctions,
        recommendations: data.recommend,
        comparison: data.table,
      };

      if (data.error) {
        resultsDiv.innerHTML = `<p>Error: ${data.error}</p>`;
      } else {
        const sidebarResults = document.getElementById("sidebar-results");
        sidebarResults.innerHTML = `
                    <h3 class="distinctions">Distinctions</h3>
                    <p class="distinctions-text">${output.distinctions}</p>
                    <h3 class="recommendations">Recommendations</h3>
                    <p class="recommendations-text">${output.recommendations}</p>
                `;

        // --- Collapsible Sidebar Logic ---

        // 1. Add transition property for smooth animation
        sidebarResults.style.transition = "transform 0.3s ease-out";

        // 2. Create and append the toggle button
        const sidebarToggle = document.createElement("div");
        sidebarToggle.id = "sidebar-toggle";
        // Using an SVG for a clean arrow icon
        sidebarToggle.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
          </svg>
        `;
        document.body.appendChild(sidebarToggle);

        // 3. Add click event listener to toggle the 'collapsed' class
        sidebarToggle.addEventListener("click", () => {
          sidebarResults.classList.toggle("collapsed");
          sidebarToggle.classList.toggle("collapsed");
        });

        sidebarResults.style.display = "block"; // Show the sidebar

        resultsDiv.innerHTML = `
                    <h3 class="comparison-results">Comparison Results</h3>
                    <br>
                    <div id="comparison-items-wrapper"></div>
                `;

        const itemsWrapper = document.getElementById(
          "comparison-items-wrapper",
        );

        output.comparison.forEach((element) => {
          let specsHtml = "";
          element.specs.forEach((group) => {
            specsHtml += `<h5 class="spec-group-name">${group.groupName}</h5>`;
            specsHtml += `<div class="specs-group">`;
            group.stats.forEach((stat) => {
              let statClass = "";
              if (stat.status === "good") {
                statClass = "good-stat";
              } else if (stat.status === "bad") {
                statClass = "bad-stat";
              }
              specsHtml += `
                                <div class="spec-item ${statClass}">
                                    <span class="spec-name">${stat.name}:</span>
                                    <span class="spec-value">${stat.value}</span>
                                    ${stat.indicator ? `<span class="spec-indicator">${stat.indicator}</span>` : ""}
                                </div>
                            `;
            });
            specsHtml += `</div>`;
          });

          itemsWrapper.innerHTML += `
                        <div class="comparison-item">
                            <h4 class="comparison-item-name">${element.item}</h4>
                            <h4 class="comparison-item-price">Price: ${element.price}</h4>
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
      resultsDiv.innerHTML =
        "<p>An error occurred while fetching the comparison. Please try again later.</p>";
    }
  });
});
