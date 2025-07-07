function getBotResponse(event) {
  event.preventDefault();
  const userInputField = document.getElementById("user-input");
  const userMessage = userInputField.value;

  appendMessage("user", userMessage);
  userInputField.value = "";

  fetch("/get_response", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_input: userMessage }),
  })
    .then((response) => response.json())
    .then((data) => {
      try {
        const botResponse = JSON.parse(data.response);
        handleBotResponse(botResponse, data.response);
      } catch (e) {
        appendMessage("bot", data.response);
      }
    }).catch((error) => {
      console.error("Error:", error);
      appendMessage("bot", "Sorry, something went wrong.");
    });
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
    appendMessage("bot", rawResponse);
  }
}

function appendMessage(sender, text) {
  const chatMessages = document.getElementById("chat-messages");
  const messageElement = document.createElement("div");
  messageElement.classList.add("chat-message", `${sender}-message`);
  messageElement.innerHTML = `<p>${text}</p>`;
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function displayMultipleChoiceQuestion(questionData) {
  const chatMessages = document.getElementById("chat-messages");
  const messageElement = document.createElement("div");
  messageElement.classList.add("chat-message", "bot-message");
  const radioName = `answer_${Date.now()}`;

  let htmlContent = `<p><strong>Question:</strong> ${questionData.question}</p>`;
  htmlContent += `<p><strong>Reasoning:</strong> ${questionData.reasoning}</p>`;
  if (questionData.options && questionData.options.length > 0) {
    htmlContent += `<form class="mcq-form"><p><strong>Options:</strong></p>`;
    questionData.options.forEach((option, idx) => {
      htmlContent += `
        <label>
          <input type="radio" name="${radioName}" value="${option}" ${idx === 0 ? "checked" : ""}>
          ${option}
        </label><br>
      `;
    });
    htmlContent += `<button type="button" class="mcq-next-btn">Next</button></form>`;
  }
  messageElement.innerHTML = htmlContent;
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  const form = messageElement.querySelector('.mcq-form');
  const nextBtn = messageElement.querySelector('.mcq-next-btn');
  nextBtn.addEventListener('click', function () {
    const selected = form.querySelector(`input[name="${radioName}"]:checked`);
    if (selected) {
      appendMessage("user", selected.value);

      fetch("/get_response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_input: selected.value }),
      })
        .then((response) => response.json())
        .then((data) => {
          try {
            const botResponse = JSON.parse(data.response);
            handleBotResponse(botResponse, data.response);
          } catch (e) {
            appendMessage("bot", data.response);
          }
        }).catch((error) => {
          console.error("Error:", error);
          appendMessage("bot", "Sorry, something went wrong.");
        });

      // Disable form after submission so user cant send more message while the ai computes
      nextBtn.disabled = true;
      const radios = form.querySelectorAll('input[type="radio"]');
      radios.forEach(radio => radio.disabled = true);
    }
  });
}

//TODO : Add min-max range to slider
function displaySliderQuestion(questionData) {
  const chatMessages = document.getElementById("chat-messages");
  const messageElement = document.createElement("div");
  messageElement.classList.add("chat-message", "bot-message");
  let htmlContent = `<p><strong>Question:</strong> ${questionData.question}</p>`;
  htmlContent += `<p><strong>Reasoning:</strong> ${questionData.reasoning}</p>`;

  let min = questionData.min, max = questionData.max;
  htmlContent += `
    <form class="slider-form">
      <label>
        <input type="range" min="${min}" max="${max}" value="${min}" class="slider-input">
        <span class="slider-value">${min}</span> / ${max}
      </label>
      <button type="button" class="slider-next-btn">Next</button>
    </form>
  `;

  messageElement.innerHTML = htmlContent;
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  const form = messageElement.querySelector('.slider-form');
  const slider = form.querySelector('.slider-input');
  const sliderRange = form.querySelector('.slider-value');
  const nextBtn = form.querySelector('.slider-next-btn');

  slider.addEventListener('input', function () {
    sliderRange.textContent = slider.value;
  });
  nextBtn.addEventListener('click', function () {
    appendMessage("user", slider.value);

    fetch("/get_response", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_input: slider.value }),
    })
      .then((response) => response.json())
      .then((data) => {
        try {
          const botResponse = JSON.parse(data.response);
          handleBotResponse(botResponse, data.response);
        } catch (e) {
          appendMessage("bot", data.response);
        }
      }).catch((error) => {
        console.error("Error:", error);
        appendMessage("bot", "Sorry, something went wrong.");
      });
    nextBtn.disabled = true;
    slider.disabled = true;

  });

}

function displayOpenEndedQuestion(questionData) {
  const chatMessages = document.getElementById("chat-messages");
  const messageElement = document.createElement("div");
  messageElement.classList.add("chat-message", "bot-message");
  let htmlContent = `<p><strong>Question:</strong> ${questionData.question}</p>`;
  htmlContent += `<p><strong>Reasoning:</strong> ${questionData.reasoning}</p>`;
  messageElement.innerHTML = htmlContent;
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

//TODO: Implement recommendations display
function displayRecommendations(recommendationsData) {
  const chatMessages = document.getElementById("chat-messages");
  const messageElement = document.createElement("div");
  messageElement.classList.add("chat-message", "bot-message");
  let htmlContent = "<p><strong>Here are some recommendations:</strong></p>";

  recommendationsData.recommendations.forEach((rec, index) => {
    htmlContent += `<div class="recommendation-item">`;
    htmlContent += `<p><strong>Recommendation ${index + 1}:</strong> ${rec.text}</p>`;
    htmlContent += `<p><strong>Specs:</strong> ${rec.specs}</p>`;
    htmlContent += `<p><strong>Price:</strong> ${rec.price.replace('Price: ', '')}</p>`;
    htmlContent += `<p><strong>Ratings:</strong> ${rec.ratings.replace('Ratings: ', '')}</p>`;
    htmlContent += `</div>`;
  });


  messageElement.innerHTML = htmlContent;
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
