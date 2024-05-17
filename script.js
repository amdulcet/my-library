// Get all book buttons
const bookButtons = document.querySelectorAll('.btn');
const bookViewer = document.getElementById('book-viewer');
const bookShelf = document.getElementById('book-shelf');
const bookContent = document.getElementById('book-content');
const readBookButton = document.getElementById('read-book');

// Initially select the first book button
let selectedBookIndex = 0;
bookButtons[selectedBookIndex].classList.add('selected');

// Function to handle keyboard events
function handleKeydown(event) {
  // Remove selection from currently selected book button
  bookButtons[selectedBookIndex].classList.remove('selected');

  // Handle arrow key presses
  switch(event.key) {
    case 'ArrowUp':
      selectedBookIndex = Math.max(selectedBookIndex - 1, 0);
      break;
    case 'ArrowDown':
      selectedBookIndex = Math.min(selectedBookIndex + 1, bookButtons.length - 1);
      break;
    case 'ArrowLeft':
      selectedBookIndex = Math.max(selectedBookIndex - 1, 0);
      break;
    case 'ArrowRight':
      selectedBookIndex = Math.min(selectedBookIndex + 1, bookButtons.length - 1);
      break;
    case ' ':
      event.preventDefault(); // Prevent default spacebar action (scrolling)
      if (bookContent.style.display === 'block') {
        readBook();
      } else {
        startVoiceRecognition();
      }
      return; // Stop further execution
    case 'Enter':
      window.speechSynthesis.cancel(); // Stop speaking voice
      startVoiceRecognition(); // Start voice recognition for commands
      return; // Stop further execution
  }

  // Add selection to the newly selected book button
  bookButtons[selectedBookIndex].classList.add('selected');

  // Speak the selected book title
  speakBookTitle(bookButtons[selectedBookIndex]);
}



// Function to speak the book title using Speech Synthesis
function speakBookTitle(button) {
  const bookTitle = button.querySelector('a').innerText;
  const utterance = new SpeechSynthesisUtterance(bookTitle);
  window.speechSynthesis.speak(utterance);
}

// Function to open the selected book
function openSelectedBook(bookTitle) {
  for (const button of bookButtons) {
    const title = button.querySelector('a').innerText.toLowerCase();
    if (title.includes(bookTitle.toLowerCase())) {
      const bookUrl = button.querySelector('a').href;
      renderPDF(bookUrl);
      bookShelf.style.display = 'none';
      bookContent.style.display = 'block';
      readBookButton.style.display = 'block';
      return; // Stop further execution
    }
  }
  // If book not found, inform the user
  speakMessage("Sorry, that book is not available.");
}

// Function to close the book and return to the library view
function closeBook() {
  bookViewer.src = '';
  bookContent.innerHTML = '';
  bookViewer.style.display = 'none';
  bookShelf.style.display = 'block';
  bookContent.style.display = 'none';
  readBookButton.style.display = 'none';
  speakMessage("Returned to the library.");
}

// Function to handle speech recognition
function handleSpeechRecognition(event) {
  const command = event.results[0][0].transcript.toLowerCase();
  if (command.includes('open')) {
    const bookTitle = command.split('open')[1].trim();
    if (bookTitle) {
      openSelectedBook(bookTitle);
    } else {
      speakMessage("Please specify a book title.");
    }
  } else if (command.includes('close')) {
    closeBook();
  } else if (command.includes('read')) {
    readBook();
  } else {
    speakMessage("Please say 'open' followed by the book title or 'close' to return to the library.");
  }
}
// Function to speak a message with reduced speed rate
function speakMessage(message) {
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.rate = 0.8; // Adjust speed rate as needed (0.8 is slower)
  window.speechSynthesis.speak(utterance);
}

// Function to read the book content with reduced speed rate
function readBook() {
  const textContent = bookContent.innerText;
  const utterance = new SpeechSynthesisUtterance(textContent);
  utterance.rate = 0.8; // Adjust speed rate as needed (0.8 is slower)
  window.speechSynthesis.speak(utterance);
}

// Function to start voice recognition
function startVoiceRecognition() {
  const recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.lang = 'en-US';
  recognition.onresult = handleSpeechRecognition;
  recognition.onerror = function(event) {
    speakMessage("Sorry, there was an error processing your request.");
  };
  recognition.start();
}

// Function to read the book content
function readBook() {
  const textContent = bookContent.innerText;
  const utterance = new SpeechSynthesisUtterance(textContent);
  window.speechSynthesis.speak(utterance);
}

// Function to render the PDF using PDF.js
function renderPDF(url) {
  const loadingTask = pdfjsLib.getDocument(url);
  loadingTask.promise.then(function(pdf) {
    bookContent.innerHTML = ''; // Clear previous content
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      pdf.getPage(pageNumber).then(function(page) {
        const scale = 1.5;
        const viewport = page.getViewport({scale: scale});

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        page.render(renderContext).promise.then(function() {
          bookContent.appendChild(canvas);

          // Extract text from the page
          page.getTextContent().then(function(textContent) {
            let textLayerDiv = document.createElement('div');
            textLayerDiv.setAttribute('class', 'textLayer');
            textLayerDiv.setAttribute('style', `width: ${viewport.width}px; height: ${viewport.height}px;`);
            
            textContent.items.forEach(function(textItem) {
              let span = document.createElement('span');
              span.textContent = textItem.str;
              span.setAttribute('style', `left: ${textItem.transform[4]}px; top: ${textItem.transform[5]}px; font-size: ${textItem.height}px;`);
              textLayerDiv.appendChild(span);
            });

            bookContent.appendChild(textLayerDiv);
          });
        });
      });
    }
  });
}

// Add event listeners for keyboard events
document.addEventListener('keydown', handleKeydown);
readBookButton.addEventListener('click', readBook);
