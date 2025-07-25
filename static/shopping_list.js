document.addEventListener("DOMContentLoaded", () => {
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
        
        todoTitle.textContent = currentEvent;
        eventInput.style.display = "none";
        startBtn.style.display = "none";
        todoTitle.style.display = "block";
        addItemBtn.style.display = "block";
        todoItems.innerHTML = '';
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
                rejected: rejected
            })
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
                <input type="checkbox" ${item.completed ? "checked" : ""}>
                <div class="item-text">
                    <span class="item-name">${item.item}</span>
                    <span class="item-reason">- ${item.reason}</span>
                </div>
                <span class="item-price">${item.price}</span>
                <button class="delete-btn">&times;</button>
            `;

            li.querySelector("input[type='checkbox']").addEventListener("change", () => {
                accepted[index].completed = !accepted[index].completed;
                renderTodoList();
            });

            li.querySelector(".delete-btn").addEventListener("click", () => {
                rejected.push(accepted[index].item);
                accepted.splice(index, 1);
                renderTodoList();
            });

            todoItems.appendChild(li);
        });
    }
});