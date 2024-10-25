// Get all book buttons
const bookButtons = document.querySelectorAll('.btn');
const bookViewer = document.getElementById('book-viewer');
const bookShelf = document.getElementById('book-shelf');
const bookContent = document.getElementById('book-content');
const readBookButton = document.getElementById('read-book');

// Initially select the first book button
let selectedBookIndex = 0;
bookButtons[selectedBookIndex].classList.add('selected');

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
      speakMessage(`You have opened the book titled ${bookTitle}.`);
      setTimeout(() => {
        speakMessage("Where do you want to begin from?");
        startVoiceRecognition(); // Start voice recognition after asking the question
      }, 3000); // Delay to allow the first message to be spoken
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
  } else if (command.includes('read from page')) {
    const pageNumber = parseInt(command.split('read from page')[1].trim());
    if (!isNaN(pageNumber)) {
      readFromPage(pageNumber);
    } else {
      speakMessage("Please specify a valid page number.");
    }
  } else if (command.includes('read from chapter')) {
    const chapterNumber = parseInt(command.split('read from chapter')[1].trim());
    if (!isNaN(chapterNumber)) {
      readFromChapter(chapterNumber);
    } else {
      speakMessage("Please specify a valid chapter number.");
    }
  } else if (command.includes('read from introduction')) {
    readFromIntroduction();
  } else if (command.includes('summary')) {
    readSummary();
  } else if (command.includes('how many books')) {
    informBookCount();
  } else if (command.includes('list books') || command.includes('which books') || command.includes('what books') || command.includes('name the books')){
    listBooksInLibrary();
  } else {
    speakMessage("Please say 'open' followed by the book title, 'close' to return to the library, or specify a reading location.");
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

// Function to read from a specific page and start reading
function readFromPage(pageNumber) {
  renderPDFPages(bookContent.dataset.url, pageNumber, true);
}

// Function to read from the introduction and start reading
function readFromIntroduction() {
  // Assuming introduction is on page 1 for this example
  readFromPage(1);
}

// Function to read from a specific chapter and start reading
function readFromChapter(chapterNumber) {
  // Implement chapter navigation logic here
  // For simplicity, let's assume each chapter starts on a fixed page
  const chapterStartPage = chapterNumber * 10; // Example logic
  readFromPage(chapterStartPage);
}

// Function to read summary
function readSummary() {
  const summaryText = extractSummary(bookContent.dataset.url);
  const utterance = new SpeechSynthesisUtterance(summaryText);
  utterance.rate = 0.8; // Adjust speed rate as needed (0.8 is slower)
  window.speechSynthesis.speak(utterance);
}

// Function to extract summary
function extractSummary(url) {
  // Implement logic to extract summary from PDF
  // For simplicity, let's assume summary is on the first page
  // This function should be enhanced to better extract actual summaries
  return "This is a placeholder for the summary. The actual summary extraction logic needs to be implemented.";
}

// Function to render specific pages of the PDF using PDF.js
function renderPDFPages(url, startPage, readContent = false) {
  const loadingTask = pdfjsLib.getDocument(url);
  loadingTask.promise.then(function(pdf) {
    bookContent.innerHTML = ''; // Clear previous content
    let fullText = ''; // To collect text for reading
    for (let pageNumber = startPage; pageNumber <= pdf.numPages; pageNumber++) {
      pdf.getPage(pageNumber).then(function(page) {
        const scale = 1.5;
        const viewport = page.getViewport({ scale: scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        page.render(renderContext).promise.then(function () {
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
              fullText += textItem.str + ' '; // Collect text for reading
            });

            bookContent.appendChild(textLayerDiv);

            // Start reading the content if readContent is true
            if (readContent) {
              const utterance = new SpeechSynthesisUtterance(fullText);
              utterance.rate = 0.8; // Adjust speed rate as needed (0.8 is slower)
              window.speechSynthesis.speak(utterance);
            }
          });
        });
      });
    }
  });
}

// Function to render the PDF using PDF.js
function renderPDF(url) {
  const loadingTask = pdfjsLib.getDocument(url);
  loadingTask.promise.then(function(pdf) {
    bookContent.dataset.url = url; // Store the URL for later use
    bookContent.innerHTML = ''; // Clear previous content
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      pdf.getPage(pageNumber).then(function(page) {
        const scale = 1.5;
        const viewport = page.getViewport({ scale: scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        page.render(renderContext).promise.then(function () {
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

// Function to inform user about the number of books
function informBookCount() {
  const bookCount = bookButtons.length;
  speakMessage(`There are ${bookCount} books in the library.`);
}

// Function to list the books in the library
function listBooksInLibrary() {
  const bookTitles = Array.from(bookButtons).map(button => button.querySelector('a').innerText);
  const message = `The books in the library are: ${bookTitles.join(', ')}.`;
  speakMessage(message);
}

// Function to handle keyboard events
function handleKeydown(event) {
  // Stop speaking voice on space bar or Enter key press
  if (event.key === ' ' || event.key === 'Enter') {
    window.speechSynthesis.cancel(); // Stop speaking voice
  }

  // Handle specific key actions
  switch (event.key) {
    case ' ':
      event.preventDefault(); // Prevent default spacebar action (scrolling)
      startVoiceRecognition();
      break;
    case 'Enter':
      startVoiceRecognition(); // Start voice recognition for commands
      break;
  }
}

// Add event listeners for keyboard events
document.addEventListener('keydown', handleKeydown);
readBookButton.addEventListener('click', readBook);
