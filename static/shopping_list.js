document.addEventListener("DOMContentLoaded", () => {
  const svgSymbol = `
      <svg xmlns="http://www.w3.org/2000/svg" style="display:none">
        <symbol id="todo-checkbox-symbol" viewBox="0 0 22 22">
          <path fill="none" stroke="currentColor" d="M5.5,11.3L9,14.8L20.2,3.3l0,0c-0.5-1-1.5-1.8-2.7-1.8h-13c-1.7,0-3,1.3-3,3v13c0,1.7,1.3,3,3,3h13 c1.7,0,3-1.3,3-3v-13c0-0.4-0.1-0.8-0.3-1.2"/>
        </symbol>
      </svg>
    `;
  document.body.insertAdjacentHTML("beforeend", svgSymbol);

  const startBtn = document.getElementById("start-btn");
  const eventInput = document.getElementById("event-input");
  const todoTitle = document.getElementById("todo-title");
  const todoItems = document.getElementById("todo-items");
  const addItemBtn = document.getElementById("add-item-btn");

  let currentEvent = "";
  let accepted = [];
  let rejected = [];

  startBtn.addEventListener("click", () => {
    currentEvent = eventInput.value.trim();

    const header = document.querySelector(".header");
    if (header) {
      header.style.display = "none";
    }
    const description = document.querySelector(".description");
    if (description) {
      description.style.display = "none";
    }

    todoTitle.textContent = currentEvent;
    eventInput.style.display = "none";
    startBtn.style.display = "none";
    todoTitle.style.display = "block";
    addItemBtn.style.display = "block";
    todoItems.innerHTML = "";
    accepted = [];
    rejected = [];
    getNextItem();
  });

  addItemBtn.addEventListener("click", getNextItem);

  async function getNextItem() {
    addItemBtn.textContent = "Loading...";
    addItemBtn.disabled = true;

    const response = await fetch("/get_shopping_list_item", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: currentEvent,
        accepted: accepted,
        rejected: rejected,
      }),
    });

    const data = await response.json();

    addItemBtn.textContent = "+ Generate another...";
    addItemBtn.disabled = false;

    if (data.error || !data.item) {
      addItemBtn.textContent = "No more items to suggest.";
      addItemBtn.disabled = true;
      return;
    }

    accepted.push(data);
    renderTodoList();
  }

  function renderTodoList() {
    todoItems.innerHTML = "";
    accepted.forEach((item, index) => {
      const li = document.createElement("li");
      li.className = "todo-item";
      if (item.completed) {
        li.classList.add("completed");
      }

      li.innerHTML = `
                <div class="todo-checkbox-wrapper">
                  <span class="todo-checkbox">
                    <input type="checkbox" ${item.completed ? "checked" : ""}>
                    <svg>
                      <use xlink:href="#todo-checkbox-symbol" class="todo-checkbox"></use>
                    </svg>
                  </span>
                </div>
                <div class="item-text">
                    <span class="item-name">${item.item}</span>
                    <span class="item-reason">- ${item.reason}</span>
                </div>
                <span class="item-price">${item.price}</span>
                <button class="search-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#444"><path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/></svg>
                </button>
                <button class="delete-btn">&times;</button>
            `;

      li.querySelector("input[type='checkbox']").addEventListener(
        "change",
        () => {
          accepted[index].completed = !accepted[index].completed;
          renderTodoList();
        },
      );

      li.querySelector(".delete-btn").addEventListener("click", () => {
        rejected.push(accepted[index].item);
        accepted.splice(index, 1);
        renderTodoList();
      });

      li.querySelector(".search-btn").addEventListener("click", () => {
        const itemName = encodeURIComponent(accepted[index].item);
        window.location.href = `/?q=${itemName}`;
      });

      todoItems.appendChild(li);
    });
  }
});
