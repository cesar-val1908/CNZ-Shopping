const spinnerFrames = [
  "⣼", "⣹", "⢻", "⠿", "⡟", "⣏", "⣧", "⣶"
];

function fetchResponse(userMessage) {
  const chatMessages = document.getElementById("chat-messages");
  const mainContent = document.getElementById("main-content");
  if (mainContent) mainContent.style.display = "none";
  if (chatMessages) {
    chatMessages.style.display = "flex";
    chatMessages.style.justifyContent = "left";
    chatMessages.style.alignItems = "center";
  }
  let frameIndex = 0;
  chatMessages.innerHTML = `<div class="spinner-container" style="font-size: 3em;">${spinnerFrames[frameIndex]}</div>`;
  const spinnerElement = chatMessages.querySelector('.spinner-container');

  const spinnerInterval = setInterval(() => {
    frameIndex = (frameIndex + 1) % spinnerFrames.length;
    if (spinnerElement) {
      spinnerElement.textContent = spinnerFrames[frameIndex];
    }
  }, 70);

  fetch("/get_response", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_input: userMessage }),
  })
    .then((response) => response.json())
    .then((data) => {
      clearInterval(spinnerInterval);
      try {
        const botResponse = JSON.parse(data.response);
        handleBotResponse(botResponse, data.response);
      } catch (e) {
        chatMessages.innerHTML = `<div class="question-container"><p>${data.response}</p></div>`;
      }
    })
    .catch((error) => {
      clearInterval(spinnerInterval);
      chatMessages.innerHTML = `<div class="question-container"><p>Sorry, something went wrong.</p></div>`;
      console.error("Error:", error);
    });
}

function getBotResponse(event) {
  event.preventDefault();
  const userInputField = document.getElementById("user-input");
  const userMessage = userInputField.value.trim();

  if (userMessage) {
    userInputField.value = "";
    fetchResponse(userMessage);
  }
}

function handleBotResponse(botResponse, rawResponse) {
  if (botResponse.type === 'question_multiple_choice') {
    displayMultipleChoiceQuestion(botResponse);
  } else if (botResponse.type === 'question_slider') {
    displaySliderQuestion(botResponse);
  } else if (botResponse.type === 'question_open_ended') {
    displayOpenEndedQuestion(botResponse);
  } else if (botResponse.type === 'recommendations_list') {
    displayRecommendations(botResponse);
  } else {
    const chatMessages = document.getElementById("chat-messages");
    chatMessages.innerHTML = `<div class="question-container"><p>${rawResponse}</p></div>`;
  }
}

function displayMultipleChoiceQuestion(questionData) {
  const chatMessages = document.getElementById("chat-messages");
  const radioName = `answer_${Date.now()}`;

  let htmlContent = `<div class="question-container">`;
  htmlContent += `<div class="question-container-questions">`;
  htmlContent += `<h2 class="question-title">${questionData.question}</h2>`;
  htmlContent += `<p class="question-reasoning">${questionData.reasoning}</p>`;
  if (questionData.options && questionData.options.length > 0) {
    htmlContent += `<form class="mcq-form">`;
    questionData.options.forEach((option, idx) => {
      htmlContent += `
    <label class="mcq-option" role="button">
      <input type="radio" name="${radioName}" value="${option}" ${idx === 0 ? "checked" : ""}>
      <span class="mcq-option-text">${option}</span>
    </label>
  `;
    });
    htmlContent += `</form></div><button type="button" class="mcq-next-btn">Next</button>`;
    ;
  }
  htmlContent += `</div>`;
  chatMessages.innerHTML = htmlContent;

  const form = chatMessages.querySelector('.mcq-form');
  const nextBtn = chatMessages.querySelector('.mcq-next-btn');
  nextBtn.addEventListener('click', function () {
    const selected = form.querySelector(`input[name="${radioName}"]:checked`);
    if (selected) {
      fetchResponse(selected.value);
    }
  });
}

function displaySliderQuestion(questionData) {
  const chatMessages = document.getElementById("chat-messages");
  let htmlContent = `<div class="question-container">`;
  htmlContent += `<h2 class="slider-question-header">${questionData.question}</h2>`;
  htmlContent += `<p class="slider-question-reasoning">${questionData.reasoning}</p>`;

  let min = questionData.min, max = questionData.max;
  htmlContent += `
    <form class="slider-form">
      <label>
        <input class="slider-input" type="range" min="${min}" max="${max}" value="${min}" class="slider-input">
        <span class="slider-value">${min}</span> / ${max}
      </label>
      <button type="button" class="slider-next-btn">Next</button>
    </form>
  `;
  htmlContent += `</div>`;
  chatMessages.innerHTML = htmlContent;

  const form = chatMessages.querySelector('.slider-form');
  const slider = form.querySelector('.slider-input');
  const sliderValue = form.querySelector('.slider-value');
  const nextBtn = form.querySelector('.slider-next-btn');

  slider.addEventListener('input', function () {
    sliderValue.textContent = slider.value;
  });
  nextBtn.addEventListener('click', function () {
    fetchResponse(slider.value);
  });
}

function displayOpenEndedQuestion(questionData) {
    // show the user-input field again
    const mainContent = document.getElementById("main-content");
    if (mainContent) mainContent.style.display = "flex";
    const header = document.getElementById("header");
    header.style.display = "none";
    const description = document.getElementById("description");
    description.style.display = "none";

    const userInputField = document.getElementById("input-chat-area");
    if (userInputField) userInputField.style.display = "flex";
    userInputField.placeholder = "Enter your answer here...";

    const chatMessages = document.getElementById("chat-messages");
    let htmlContent = `<div class="question-container">`;
    htmlContent += `<h2 class="open-ended-question-title">${questionData.question}</h2>`;
    htmlContent += `<p class="open-ended-question-reasoning">${questionData.reasoning}</p>`;
    htmlContent += `</div>`;
    chatMessages.innerHTML = htmlContent;
}


function displayRecommendations(recommendationsData) {
  const chatMessages = document.getElementById("chat-messages");
  let htmlContent = `<div class="recommendations-wrapper">`;
  htmlContent += "<h2>Here are your recommendations:</h2>";
  htmlContent += '<div class="recommendations-container">';

  recommendationsData.recommendations.forEach((rec) => {
    htmlContent += `
      <div class="suggested-item">
        <div class="item-image-container">
          <img src="${rec.image || 'https://placehold.co/400x300'}" class="item-image" alt="${rec.text}">
        </div>
        <div class="item-details">
            <h3 class="item-name">${rec.text}</h3>
            <div class="item-meta">
                <p class="item-price">${rec.price.replace('Price: ', '')}</p>
                <p class="item-rating">${rec.ratings.replace('Ratings: ', '')} <span class="star-icon">★</span></p>
            </div>
        </div>
        <div class="item-specs">
            <p>${rec.specs}</p>
        </div>
      </div>
    `;
  });

  htmlContent += '</div></div>';
  chatMessages.innerHTML = htmlContent;
}

document.addEventListener("DOMContentLoaded", function () {
  const userInputField = document.getElementById("user-input");
  userInputField.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      getBotResponse(event);
    }
  });
});
