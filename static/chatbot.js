const SPINNER = ["⣼", "⣹", "⢻", "⠿", "⡟", "⣏", "⣧", "⣶"];
const STATUS_MSGS = [
  "Evaluating user needs",
  "Collecting data",
  "Evaluating results",
  "Compiling recommendations",
  "Finalizing response",
];

let requirements = [];
let constraints = [];
let sources = [];
let report = "";
let spinnerTimer = null;
let msgTimer = null;

function showSpinner() {
  const chat = document.getElementById("chat-messages");
  const main = document.getElementById("main-content");

  if (main) main.style.display = "none";
  if (chat) {
    chat.style.display = "flex";
    chat.style.justifyContent = "left";
    chat.style.alignItems = "center";
  }

  let frame = 0;
  let msgIdx = 0;

  chat.innerHTML = `
    <div class="spinner-and-message-container">
      <div class="spinner-container" style="font-size: 3em;">${SPINNER[frame]}</div>
      <div class="progress-message-container">
        <p class="progress-message"></p>
      </div>
      <div class="tracking-info" id="tracking-info"></div>
    </div>
  `;

  const spinner = chat.querySelector(".spinner-container");
  const statusMsg = chat.querySelector(".progress-message");
  const tracking = document.getElementById("tracking-info");

  if (requirements.length > 0) {
    const div = document.createElement("div");
    div.className = "requirements-list";
    div.id = "requirements-list";
    div.innerHTML = '<h4>Requirements:</h4><ul id="requirements-items"></ul>';
    tracking.appendChild(div);

    const list = document.getElementById("requirements-items");
    requirements.forEach((req) => {
      const li = document.createElement("li");
      li.textContent = req;
      list.appendChild(li);
    });
  }

  if (constraints.length > 0) {
    const div = document.createElement("div");
    div.className = "constraints-list";
    div.id = "constraints-list";
    div.innerHTML = '<h4>Constraints:</h4><ul id="constraints-items"></ul>';
    tracking.appendChild(div);

    const list = document.getElementById("constraints-items");
    constraints.forEach((con) => {
      const li = document.createElement("li");
      li.textContent = con;
      list.appendChild(li);
    });
  }

  spinnerTimer = setInterval(() => {
    frame = (frame + 1) % SPINNER.length;
    if (spinner) spinner.textContent = SPINNER[frame];
  }, 70);

  function cycleStatus() {
    if (!statusMsg) return;
    statusMsg.classList.remove("slide-up-fade-in");
    void statusMsg.offsetWidth;
    statusMsg.textContent = STATUS_MSGS[msgIdx];
    statusMsg.classList.add("slide-up-fade-in");
    msgIdx = (msgIdx + 1) % STATUS_MSGS.length;
  }

  cycleStatus();
  msgTimer = setInterval(cycleStatus, 2000);
}

function hideSpinner() {
  if (spinnerTimer) clearInterval(spinnerTimer);
  if (msgTimer) clearInterval(msgTimer);
  spinnerTimer = null;
  msgTimer = null;
}

function sendMessage(msg) {
  showSpinner();

  let context = "";
  if (requirements.length > 0) {
    context += "Current Requirements:\n- " + requirements.join("\n- ") + "\n\n";
  }
  if (constraints.length > 0) {
    context += "Current Constraints:\n- " + constraints.join("\n- ") + "\n\n";
  }
  if (sources.length > 0) {
    context += "Current Sources:\n- " + sources.map(s => `${s.name}: ${s.url}`).join("\n- ") + "\n\n";
  }

  const fullMessage = context + "User message: " + msg;

  fetch("/get_response", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_input: fullMessage }),
  })
    .then((res) => res.json())
    .then((data) => {
      try {
        const resp = JSON.parse(data.response);
        handleResponse(resp, data.response);
      } catch (e) {
        hideSpinner();
        document.getElementById("chat-messages").innerHTML =
          `<div class="question-container"><p>${data.response}</p></div>`;
      }
    })
    .catch((err) => {
      hideSpinner();
      document.getElementById("chat-messages").innerHTML =
        `<div class="question-container"><p>Sorry, something went wrong.</p></div>`;
      console.error("Error:", err);
    });
}

function submitAnswer(e) {
  e.preventDefault();
  const input = document.getElementById("user-input");
  const msg = input.value.trim();

  if (msg) {
    input.value = "";
    sendMessage(msg);
  }
}

function isSimilar(a, b) {
  const normalize = (s) => s.toLowerCase().trim();
  const words = (s) =>
    normalize(s)
      .split(/\s+/)
      .filter((w) => w.length > 3);

  const aWords = words(a);
  const bWords = words(b);

  if (aWords.length === 0 || bWords.length === 0) return false;

  const matches = aWords.filter((w) =>
    bWords.some((bw) => bw.includes(w) || w.includes(bw)),
  ).length;

  return matches / aWords.length > 0.7;
}

function addRequirement(req) {
  const exists = requirements.some(
    (r) =>
      r.toLowerCase().trim() === req.toLowerCase().trim() || isSimilar(r, req),
  );

  if (exists) {
    console.log(`Skipping duplicate: "${req}"`);
    return;
  }

  requirements.push(req);

  const tracking = document.getElementById("tracking-info");
  let section = document.getElementById("requirements-list");

  if (!section && tracking) {
    section = document.createElement("div");
    section.className = "requirements-list";
    section.id = "requirements-list";
    section.innerHTML =
      '<h4>Requirements:</h4><ul id="requirements-items"></ul>';
    tracking.appendChild(section);
  }

  const list = document.getElementById("requirements-items");
  if (list) {
    const li = document.createElement("li");
    li.textContent = req;
    li.classList.add("fade-in-item");
    list.appendChild(li);
  }
}

function addConstraint(con) {
  const exists = constraints.some(
    (c) =>
      c.toLowerCase().trim() === con.toLowerCase().trim() || isSimilar(c, con),
  );

  if (exists) {
    console.log(`Skipping duplicate: "${con}"`);
    return;
  }

  constraints.push(con);

  const tracking = document.getElementById("tracking-info");
  let section = document.getElementById("constraints-list");

  if (!section && tracking) {
    section = document.createElement("div");
    section.className = "constraints-list";
    section.id = "constraints-list";
    section.innerHTML = '<h4>Constraints:</h4><ul id="constraints-items"></ul>';
    tracking.appendChild(section);
  }

  const list = document.getElementById("constraints-items");
  if (list) {
    const li = document.createElement("li");
    li.textContent = con;
    li.classList.add("fade-in-item");
    list.appendChild(li);
  }
}
function showSources(srcs) {
  sources = srcs;

  let tracking = document.getElementById("tracking-info");

  if (!tracking) {
    const chat = document.getElementById("chat-messages");
    const container = chat.querySelector(".spinner-and-message-container");
    if (container) {
      const trackingDiv = document.createElement("div");
      trackingDiv.className = "tracking-info";
      trackingDiv.id = "tracking-info";
      container.appendChild(trackingDiv);
      tracking = trackingDiv;
    }
  }

  if (tracking) tracking.classList.add("bento-layout");

  let section = document.getElementById("sources-list");
  if (!section && tracking) {
    section = document.createElement("div");
    section.className = "sources-list";
    section.id = "sources-list";
    section.innerHTML = '<h4>Sources:</h4><ul id="sources-items"></ul>';
    tracking.appendChild(section);
  }

  const list = document.getElementById("sources-items");
  if (list) {
    list.innerHTML = "";
    srcs.forEach((src) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <a href="${src.url}" target="_blank" class="source-name">${src.name}</a>
        <span class="source-url">↗ ${src.url}</span>
      `;
      li.classList.add("fade-in-item");
      list.appendChild(li);
    });
  }
}

function showReport(msg) {
  report = msg;

  let tracking = document.getElementById("tracking-info");

  if (!tracking) {
    const chat = document.getElementById("chat-messages");
    const container = chat.querySelector(".spinner-and-message-container");
    if (container) {
      const trackingDiv = document.createElement("div");
      trackingDiv.className = "tracking-info";
      trackingDiv.id = "tracking-info";
      container.appendChild(trackingDiv);
      tracking = trackingDiv;
    }
  }

  if (tracking) tracking.classList.add("bento-layout");

  let section = document.getElementById("report-section");
  if (!section && tracking) {
    section = document.createElement("div");
    section.className = "report-section";
    section.id = "report-section";
    section.innerHTML = '<h4>Analysis:</h4><p id="report-text"></p>';
    tracking.appendChild(section);
  }

  const text = document.getElementById("report-text");
  if (text) {
    text.textContent = msg;
    text.classList.add("fade-in-item");
  }
}

function continueConvo() {
  fetch("/get_response", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_input: "" }),
  })
    .then((res) => res.json())
    .then((data) => {
      try {
        const resp = JSON.parse(data.response);
        handleResponse(resp, data.response);
      } catch (e) {
        hideSpinner();
        document.getElementById("chat-messages").innerHTML =
          `<div class="question-container"><p>${data.response}</p></div>`;
      }
    })
    .catch((err) => {
      hideSpinner();
      document.getElementById("chat-messages").innerHTML =
        `<div class="question-container"><p>Sorry, something went wrong.</p></div>`;
      console.error("Error:", err);
    });
}

function handleResponse(resp, raw) {
  switch (resp.type) {
    case "user_requirement":
      addRequirement(resp.requirement);
      continueConvo();
      break;

    case "user_constraint":
      addConstraint(resp.constraint);
      continueConvo();
      break;

    case "sources":
      showSources(resp.sources);
      continueConvo();
      break;

    case "user_report":
    case "report_user":
      // showReport(resp.message);
      continueConvo();
      break;

    case "question_multiple_choice":
      hideSpinner();
      showMultiChoice(resp);
      break;

    case "question_slider":
      hideSpinner();
      showSlider(resp);
      break;

    case "question_open_ended":
      hideSpinner();
      showOpenEnded(resp);
      break;

    case "recommendations_list":
      hideSpinner();
      showResults(resp);
      break;

    default:
      console.warn("Unknown type:", resp.type, resp);
      console.warn("Raw:", raw);
      hideSpinner();
      document.getElementById("chat-messages").innerHTML =
        `<div class="question-container"><p>Received unexpected response type: ${resp.type || "unknown"}</p><pre style="font-size: 0.8em; margin-top: 10px; opacity: 0.7;">${JSON.stringify(resp, null, 2)}</pre></div>`;
  }
}

function showMultiChoice(data) {
  const chat = document.getElementById("chat-messages");
  const radioName = `answer_${Date.now()}`;

  let html = `<div class="question-container">`;
  html += `<div class="question-container-questions">`;
  html += `<h2 class="question-title">${data.question}</h2>`;
  html += `<p class="question-reasoning">${data.reasoning}</p>`;

  if (data.options && data.options.length > 0) {
    html += `<form class="mcq-form">`;
    data.options.forEach((opt, i) => {
      html += `
        <label class="mcq-option" role="button">
          <input type="radio" name="${radioName}" value="${opt}" ${i === 0 ? "checked" : ""}>
          <span class="mcq-option-text">${opt}</span>
        </label>
      `;
    });
    html += `</form></div><button type="button" class="mcq-next-btn">Next</button>`;
  }
  html += `</div>`;
  chat.innerHTML = html;

  const form = chat.querySelector(".mcq-form");
  const btn = chat.querySelector(".mcq-next-btn");
  btn.addEventListener("click", () => {
    const selected = form.querySelector(`input[name="${radioName}"]:checked`);
    if (selected) sendMessage(selected.value);
  });
}

function showSlider(data) {
  const chat = document.getElementById("chat-messages");

  let html = `<div class="question-container">`;
  html += `<h2 class="slider-question-header">${data.question}</h2>`;
  html += `<p class="slider-question-reasoning">${data.reasoning}</p>`;
  html += `
    <form class="slider-form">
      <label>
        <input class="slider-input" type="range" min="${data.min}" max="${data.max}" value="${data.min}">
        <span class="slider-value">${data.min}</span> / ${data.max}
      </label>
      <button type="button" class="slider-next-btn">Next</button>
    </form>
  </div>`;
  chat.innerHTML = html;

  const slider = chat.querySelector(".slider-input");
  const value = chat.querySelector(".slider-value");
  const btn = chat.querySelector(".slider-next-btn");

  slider.addEventListener("input", () => {
    value.textContent = slider.value;
  });

  btn.addEventListener("click", () => {
    sendMessage(slider.value);
  });
}

function showOpenEnded(data) {
  const chat = document.getElementById("chat-messages");
  const main = document.getElementById("main-content");
  const header = document.getElementById("header");
  const desc = document.getElementById("description");
  const chatInput = document.getElementById("chat-input-area");
  const userInput = document.getElementById("user-input");

  if (header) {
    header.innerHTML = `<h2 class="open-ended-question-title">${data.question}</h2>`;
    header.style.display = "block";
  }
  if (desc) {
    desc.innerHTML = `<p class="open-ended-question-reasoning">${data.reasoning}</p>`;
    desc.style.display = "block";
  }

  chat.style.display = "none";

  if (main) main.style.display = "flex";
  if (chatInput) chatInput.style.display = "flex";
  if (userInput) userInput.placeholder = "Enter your answer here...";
}

async function getPerplexityProductData(itemName) {
  try {
    const response = await fetch(`/get_image_serp?item_name=${encodeURIComponent(itemName)}`);
    if (!response.ok) {
      console.error(`Error fetching image from SerpAPI: ${response.statusText}`);
      return null;
    }
    const data = await response.json();
    return { image: data.image_url };
  } catch (error) {
    console.error("Error getting product data from SerpAPI:", error);
    return null;
  }
}

async function showResults(data) {
  const chat = document.getElementById("chat-messages");
  chat.innerHTML = `<div class="recommendations-wrapper">
    <h2>Here are your recommendations:</h2>
    <div class="recommendations-container"></div>
  </div>`;

  const container = chat.querySelector(".recommendations-container");
  const itemHtmlArray = [];

  for (const rec of data.recommendations) {
    const productData = await getPerplexityProductData(rec.text);
    const img = productData?.image || "https://placehold.co/400x300";
    const price = rec.price.replace("Price: ", "");
    const rating = rec.ratings.replace("Ratings: ", "");

    itemHtmlArray.push(`
      <div class="suggested-item">
        <div class="item-image-container">
          <a href="https://www.google.com/search?tbm=shop&q=${encodeURIComponent(rec.text)}" 
            target="_blank" 
            rel="noopener noreferrer">
            <img 
              src="${img}" 
              class="item-image" 
              alt="${rec.text}"
              style="cursor: pointer;"
            >
          </a>
        </div>

        <div class="item-details">
          <h3 class="item-name">${rec.text}</h3>
          <div class="item-meta">
            <p class="item-price">${price}</p>
            <p class="item-rating">${rating} <span class="star-icon">★</span></p>
          </div>
        </div>
        <div class="item-specs">
          <p class="item-specs-text">${rec.specs}</p>
        </div>
      </div>
    `);
  }
  container.innerHTML = itemHtmlArray.join("");

  requirements = [];
  constraints = [];
  sources = [];
  report = "";
}

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("user-input");
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitAnswer(e);
  });

  const params = new URLSearchParams(window.location.search);
  const query = params.get("q");
  if (query) sendMessage(decodeURIComponent(query));
});
