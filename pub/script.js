
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const chatBubble = document.getElementById('chatBubble');
    const chatbotOverlay = document.getElementById('chatbotOverlay');
    const closeChatbot = document.getElementById('closeChatbot');
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const typingIndicator = document.getElementById('typingIndicator');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const body = document.body;

    // --- Configuration ---
    const GEMINI_API_KEY = ""; // <-- IMPORTANT: Replace with your key (or use a safer method)
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
    const MY_FULL_NAME = "Dev Gautam Roy"; // <-- Replace with your name

    // --- Personal Description (Customize this!) ---
    const myDescription = `
        My name is ${MY_FULL_NAME}. I am a passionate Web Developer with experience in HTML, CSS, JavaScript, and frameworks like React and Node.js.
        I also have a strong interest in Artificial Intelligence and machine learning concepts.
        I've worked on projects like this portfolio using HTML, CSS and JS 
        I enjoy solving problems, learning new technologies, and building user-friendly applications.
        I'm currently looking for opportunities where I can contribute my skills and grow further.
        My hobbies include reading tech blogs, contributing to open-source, and swimming.
        I studied Computer Science at Pailan College of Management and Technology.
        I am proficient in English.
        I prefer dark mode for coding.
    `; // <-- Add more details about yourself, skills, experience, education, hobbies etc.

    let isChatbotOpen = false;
    let initialMessageDisplayed = false;

    // --- Dark Mode ---
    function applyDarkModePreference() {
        const prefersDark = localStorage.getItem('darkMode') === 'true';
        if (prefersDark) {
            body.classList.add('dark-mode');
            
        } else {
            body.classList.remove('dark-mode');
            
        }
    }

    function toggleDarkMode() {
        body.classList.toggle('dark-mode');
        const isDark = body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDark);
        
    }

    // --- Chatbot Logic ---
    function toggleChatbot() {
        isChatbotOpen = !isChatbotOpen;
        chatbotOverlay.classList.toggle('hidden', !isChatbotOpen);
        chatBubble.style.display = isChatbotOpen ? 'none' : 'flex'; // Hide bubble when chat is open

        if (isChatbotOpen && !initialMessageDisplayed) {
            displayInitialMessage();
            initialMessageDisplayed = true;
        }
         if (isChatbotOpen) {
            userInput.focus(); // Focus input when opening
        }
    }

    function displayInitialMessage() {
        const initialMessage = `Hi! I'm ${MY_FULL_NAME}. What would you like to know about me?`;
        addMessageToChat(initialMessage, 'ai');
    }

    function addMessageToChat(message, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`);

        // Basic Markdown-like formatting (bold and italics) - can be expanded
        message = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // Bold
        message = message.replace(/\*(.*?)\*/g, '<em>$1</em>');     // Italics
        message = message.replace(/\n/g, '<br>'); // Convert newlines

        messageElement.innerHTML = message; // Use innerHTML to render formatting
        chatMessages.appendChild(messageElement);
        scrollToBottom();
    }

    function showTypingIndicator() {
        typingIndicator.classList.remove('hidden');
        scrollToBottom();
    }

    function hideTypingIndicator() {
        typingIndicator.classList.add('hidden');
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

     async function sendMessage() {
        const messageText = userInput.value.trim();
        if (!messageText) return; // Don't send empty messages

        addMessageToChat(messageText, 'user');
        userInput.value = ''; // Clear input field
        showTypingIndicator();

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `User_message: ${messageText}. Reply naturally to the user message. If relevant, answer based on the following information about me: ${myDescription}. Reply in a way that sounds like ${MY_FULL_NAME} is talking directly. Keep replies relatively short and conversational.`
                        }]
                    }],
                     // Optional safety settings - adjust as needed
                    // "safetySettings": [
                    //     { "category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE" },
                    //     { "category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE" },
                    //     { "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE" },
                    //     { "category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE" }
                    // ],
                    // Optional generation config - adjust as needed
                    // "generationConfig": {
                    //     "temperature": 0.7, // Controls randomness (0.0 - 1.0)
                    //     "maxOutputTokens": 150 // Limits response length
                    // }
                })
            });

            hideTypingIndicator();

            if (!response.ok) {
                const errorData = await response.json();
                console.error("API Error:", errorData);
                throw new Error(`API Error: ${response.status} ${response.statusText}. ${errorData?.error?.message || ''}`);
            }

            const data = await response.json();

            // --- Safely access the response text ---
            let aiResponse = "Sorry, I couldn't generate a response."; // Default fallback
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text) {
               aiResponse = data.candidates[0].content.parts[0].text;
            } else if (data.promptFeedback && data.promptFeedback.blockReason) {
                 aiResponse = `I cannot respond to that due to safety reasons (${data.promptFeedback.blockReason}). Please ask something else!`;
                 console.warn("Response blocked:", data.promptFeedback);
            } else {
                 console.error("Unexpected API response structure:", data);
            }

            addMessageToChat(aiResponse, 'ai');

        } catch (error) {
            console.error('Error fetching AI response:', error);
            hideTypingIndicator();
            addMessageToChat(`Oops! Something went wrong. Please try again later. (Error: ${error.message})`, 'ai');
        }
    }

    // --- Event Listeners ---
    chatBubble.addEventListener('click', toggleChatbot);
    closeChatbot.addEventListener('click', toggleChatbot);
    sendMessageBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });
    darkModeToggle.addEventListener('click', toggleDarkMode);
    if(toggleDarkMode = True){
        consloe.log("Successfully toggled");

    }
    else{
        console.log("Error in toggleing dark mode");
    }

    // --- Initial Setup ---
    // Apply theme on load

}); // End DOMContentLoaded
