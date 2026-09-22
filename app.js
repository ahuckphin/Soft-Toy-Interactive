// Load the toy data from the JSON file when the page starts.
// This gives us all the toy names, descriptions, and image paths.
const toys = await fetch('data/toys.json').then((response) => response.json());

// These are the 5 quiz questions shown in the game.
// Each question has the correct toy name and the matching image.
const quizQuestions = [
  { answer: 'Coo', image: toys[16].image }, { answer: 'Floppy', image: toys[26].image }, { answer: 'Malta Owl', image: toys[35].image }, { answer: 'Scoop', image: toys[57].image }, { answer: 'Wedges', image: toys[68].image }
];

// Keep track of the quiz state and puzzle state.
// These variables store the current order, score, active toy, and puzzle layout.
let quizOrder = [], quizIndex = 0, score = 0, puzzleToy = null, puzzleState = [], puzzleMoves = 0;

// Small helper: it finds one element in the page quickly.
const $ = (selector) => document.querySelector(selector);

// Show one page/view at a time, such as the collection, quiz, or puzzle screens.
// It turns the matching section active and scrolls back to the top.
function showView(route) {
  document.querySelectorAll('.view').forEach((view) => view.classList.toggle('is-active', view.dataset.view === route));
  window.scrollTo(0, 0);
  if (route === 'quiz') startQuiz();
  if (route === 'puzzle') resetPuzzleChoices();
}

// Listen for clicks anywhere on the page.
// If a button has a data-route, open that view.
// If a button has a data-action, do the matching action.
document.addEventListener('click', (event) => {
  const routeButton = event.target.closest('[data-route]');
  if (routeButton) showView(routeButton.dataset.route);

  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'restart-quiz') startQuiz();
  if (action === 'back-puzzles') resetPuzzleChoices();
  if (action === 'reset-puzzle') openPuzzle(puzzleToy);
});

// Build the toy gallery on the page.
// Each toy becomes a card with its image, name, and short description.
function renderCollection() {
  $('#toy-grid').innerHTML = toys.map((toy) => `<article class="toy-card"><img src="${toy.image}" alt="${toy.name}, ${toy.detail}" loading="lazy"><div class="toy-caption"><strong class="toy-name">${toy.name}</strong><span class="toy-detail">${toy.detail}</span></div></article>`).join('');
}

// Start a new quiz round.
// It shuffles the questions, resets the score, and shows the first question.
function startQuiz() {
  quizOrder = [...quizQuestions].sort(() => Math.random() - .5);
  quizIndex = 0;
  score = 0;
  $('#quiz-result').hidden = true;
  $('.quiz-card').hidden = false;
  renderQuestion();
}

// Show one question at a time.
// It changes the image and fills the answer buttons with four possible names.
function renderQuestion() {
  const question = quizOrder[quizIndex];
  $('#question-count').textContent = `0${quizIndex + 1} / 05`;
  $('#quiz-image').src = question.image;
  $('#answers').innerHTML = '';

  // Create wrong answers by taking other toy names and mixing them up.
  const names = toys.map((toy) => toy.name)
    .filter((name) => name !== question.answer)
    .sort(() => Math.random() - .5)
    .slice(0, 3);

  // Put the correct answer among the wrong ones and shuffle them.
  [question.answer, ...names].sort(() => Math.random() - .5).forEach((name) => {
    const button = document.createElement('button');
    button.className = 'answer';
    button.textContent = name;
    button.addEventListener('click', () => answerQuestion(button, name, question.answer));
    $('#answers').appendChild(button);
  });
}

// When the user clicks an answer, lock all options and check if it is correct.
function answerQuestion(button, selected, answer) {
  const buttons = document.querySelectorAll('.answer');
  buttons.forEach((item) => {
    item.disabled = true;
    if (item.textContent === answer) item.classList.add('correct');
  });

  if (selected === answer) {
    score++;
    showToast('That is exactly right.');
  } else {
    button.classList.add('wrong');
    showToast(`It was ${answer}.`);
  }

  // Wait briefly so the user can see the result, then move to the next question.
  setTimeout(() => {
    quizIndex++;
    if (quizIndex < 5) {
      $('#answers').innerHTML = '';
      renderQuestion();
    } else showResults();
  }, 700);
}

// Show the final quiz score at the end of the game.
function showResults() {
  $('.quiz-card').hidden = true;
  $('#score').textContent = score;
  $('#quiz-result').hidden = false;
  $('#result-message').textContent = score === 5 ? 'A perfect cuddle score.' : 'A very respectable cuddle score.';
}

// Make the puzzle choice buttons for the first four toys.
function renderPuzzleChoices() {
  $('#puzzle-choices').innerHTML = toys.slice(0, 4).map((toy, index) => `<button class="puzzle-choice" data-puzzle="${index}"><img src="${toy.image}" alt=""><span><strong>${toy.name}</strong><span>${toy.detail}</span></span><span>↗</span></button>`).join('');
  document.querySelectorAll('[data-puzzle]').forEach((button) => button.addEventListener('click', () => openPuzzle(toys[button.dataset.puzzle])));
}

// Return from the active puzzle back to the puzzle selection screen.
function resetPuzzleChoices() {
  $('#puzzle-stage').hidden = true;
  $('#puzzle-choices').hidden = false;
}

// Start a sliding-picture puzzle for the chosen toy.
// It mixes the tiles by moving the empty space around many times.
function openPuzzle(toy) {
  puzzleToy = toy;
  puzzleMoves = 0;
  puzzleState = [...Array(9).keys()];

  let emptyIndex = 8;
  for (let shuffle = 0; shuffle < 80; shuffle++) {
    const neighbours = getPuzzleNeighbours(emptyIndex);
    const nextIndex = neighbours[Math.floor(Math.random() * neighbours.length)];
    [puzzleState[emptyIndex], puzzleState[nextIndex]] = [puzzleState[nextIndex], puzzleState[emptyIndex]];
    emptyIndex = nextIndex;
  }

  // If the puzzle somehow ends up solved, shuffle it again.
  if (puzzleState.every((piece, index) => piece === index)) return openPuzzle(toy);

  $('#puzzle-choices').hidden = true;
  $('#puzzle-stage').hidden = false;
  renderPuzzleBoard();
}

// Work out which tiles can move next to the empty space.
// The puzzle is a 3x3 grid, so the empty space can move up, down, left, or right.
function getPuzzleNeighbours(index) {
  const row = Math.floor(index / 3);
  const column = index % 3;
  const neighbours = [];

  if (row > 0) neighbours.push(index - 3);
  if (row < 2) neighbours.push(index + 3);
  if (column > 0) neighbours.push(index - 1);
  if (column < 2) neighbours.push(index + 1);

  return neighbours;
}

// Draw the puzzle board based on the current tile order.
// Each tile shows a part of the selected toy image in the correct position.
function renderPuzzleBoard() {
  $('#puzzle-progress').textContent = `${puzzleMoves} move${puzzleMoves === 1 ? '' : 's'}`;
  const board = $('#puzzle-board');
  board.innerHTML = '';

  puzzleState.forEach((pieceIndex, boardIndex) => {
    const piece = document.createElement('button');
    piece.className = 'puzzle-piece';
    piece.setAttribute('aria-label', pieceIndex === 8 ? 'Empty puzzle space' : `Puzzle piece ${pieceIndex + 1}`);

    if (pieceIndex === 8) {
      piece.classList.add('is-empty');
      piece.disabled = true;
    } else {
      piece.style.backgroundImage = `url("${puzzleToy.image}")`;
      piece.style.backgroundPosition = `${(pieceIndex % 3) * 50}% ${Math.floor(pieceIndex / 3) * 50}%`;
      piece.addEventListener('click', () => movePuzzlePiece(boardIndex));
    }

    board.appendChild(piece);
  });
}

// Move a puzzle tile into the empty spot when the user clicks a valid tile.
function movePuzzlePiece(index) {
  const emptyIndex = puzzleState.indexOf(8);

  // Only allow moves that are next to the empty space.
  if (!getPuzzleNeighbours(emptyIndex).includes(index)) return;

  [puzzleState[emptyIndex], puzzleState[index]] = [puzzleState[index], puzzleState[emptyIndex]];
  puzzleMoves++;
  renderPuzzleBoard();

  // When every tile is back in the correct order, the puzzle is complete.
  if (puzzleState.every((piece, boardIndex) => piece === boardIndex)) showToast('A new friend, assembled.');
}

// Show a small message at the bottom of the page for a short time.
// This is used for quiz feedback and puzzle completion messages.
function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toast.classList.remove('show'), 1500);
}

// Start the page by showing the collection and puzzle choices.
renderCollection();
renderPuzzleChoices();
