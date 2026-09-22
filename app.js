const toys = await fetch('data/toys.json').then((response) => response.json());

const quizQuestions = [
  { answer: 'Coo', image: toys[16].image }, { answer: 'Floppy', image: toys[26].image }, { answer: 'Malta Owl', image: toys[35].image }, { answer: 'Scoop', image: toys[57].image }, { answer: 'Wedges', image: toys[68].image }
];
let quizOrder = [], quizIndex = 0, score = 0, puzzleToy = null, puzzleState = [], puzzleMoves = 0;
const $ = (selector) => document.querySelector(selector);

function showView(route) {
  document.querySelectorAll('.view').forEach((view) => view.classList.toggle('is-active', view.dataset.view === route));
  window.scrollTo(0, 0);
  if (route === 'quiz') startQuiz();
  if (route === 'puzzle') resetPuzzleChoices();
}

document.addEventListener('click', (event) => {
  const routeButton = event.target.closest('[data-route]');
  if (routeButton) showView(routeButton.dataset.route);
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'restart-quiz') startQuiz();
  if (action === 'back-puzzles') resetPuzzleChoices();
  if (action === 'reset-puzzle') openPuzzle(puzzleToy);
});

function renderCollection() {
  $('#toy-grid').innerHTML = toys.map((toy) => `<article class="toy-card"><img src="${toy.image}" alt="${toy.name}, ${toy.detail}" loading="lazy"><div class="toy-caption"><strong class="toy-name">${toy.name}</strong><span class="toy-detail">${toy.detail}</span></div></article>`).join('');
}

function startQuiz() {
  quizOrder = [...quizQuestions].sort(() => Math.random() - .5); quizIndex = 0; score = 0;
  $('#quiz-result').hidden = true; $('.quiz-card').hidden = false; renderQuestion();
}
function renderQuestion() {
  const question = quizOrder[quizIndex];
  $('#question-count').textContent = `0${quizIndex + 1} / 05`; $('#quiz-image').src = question.image;
  $('#answers').innerHTML = '';
  const names = toys.map((toy) => toy.name).filter((name) => name !== question.answer).sort(() => Math.random() - .5).slice(0, 3);
  [question.answer, ...names].sort(() => Math.random() - .5).forEach((name) => {
    const button = document.createElement('button'); button.className = 'answer'; button.textContent = name; button.addEventListener('click', () => answerQuestion(button, name, question.answer)); $('#answers').appendChild(button);
  });
}
function answerQuestion(button, selected, answer) {
  const buttons = document.querySelectorAll('.answer'); buttons.forEach((item) => { item.disabled = true; if (item.textContent === answer) item.classList.add('correct'); });
  if (selected === answer) { score++; showToast('That is exactly right.'); } else { button.classList.add('wrong'); showToast(`It was ${answer}.`); }
  setTimeout(() => { quizIndex++; if (quizIndex < 5) { $('#answers').innerHTML = ''; renderQuestion(); } else showResults(); }, 700);
}
function showResults() { $('.quiz-card').hidden = true; $('#score').textContent = score; $('#quiz-result').hidden = false; $('#result-message').textContent = score === 5 ? 'A perfect cuddle score.' : 'A very respectable cuddle score.'; }

function renderPuzzleChoices() { $('#puzzle-choices').innerHTML = toys.slice(0, 4).map((toy, index) => `<button class="puzzle-choice" data-puzzle="${index}"><img src="${toy.image}" alt=""><span><strong>${toy.name}</strong><span>${toy.detail}</span></span><span>↗</span></button>`).join(''); document.querySelectorAll('[data-puzzle]').forEach((button) => button.addEventListener('click', () => openPuzzle(toys[button.dataset.puzzle]))); }
function resetPuzzleChoices() { $('#puzzle-stage').hidden = true; $('#puzzle-choices').hidden = false; }
function openPuzzle(toy) {
  puzzleToy = toy; puzzleMoves = 0; puzzleState = [...Array(9).keys()];
  let emptyIndex = 8;
  for (let shuffle = 0; shuffle < 80; shuffle++) {
    const neighbours = getPuzzleNeighbours(emptyIndex);
    const nextIndex = neighbours[Math.floor(Math.random() * neighbours.length)];
    [puzzleState[emptyIndex], puzzleState[nextIndex]] = [puzzleState[nextIndex], puzzleState[emptyIndex]];
    emptyIndex = nextIndex;
  }
  if (puzzleState.every((piece, index) => piece === index)) return openPuzzle(toy);
  $('#puzzle-choices').hidden = true; $('#puzzle-stage').hidden = false; renderPuzzleBoard();
}
function getPuzzleNeighbours(index) {
  const row = Math.floor(index / 3); const column = index % 3; const neighbours = [];
  if (row > 0) neighbours.push(index - 3); if (row < 2) neighbours.push(index + 3);
  if (column > 0) neighbours.push(index - 1); if (column < 2) neighbours.push(index + 1);
  return neighbours;
}
function renderPuzzleBoard() {
  $('#puzzle-progress').textContent = `${puzzleMoves} move${puzzleMoves === 1 ? '' : 's'}`;
  const board = $('#puzzle-board'); board.innerHTML = '';
  puzzleState.forEach((pieceIndex, boardIndex) => {
    const piece = document.createElement('button'); piece.className = 'puzzle-piece';
    piece.setAttribute('aria-label', pieceIndex === 8 ? 'Empty puzzle space' : `Puzzle piece ${pieceIndex + 1}`);
    if (pieceIndex === 8) { piece.classList.add('is-empty'); piece.disabled = true; }
    else { piece.style.backgroundImage = `url("${puzzleToy.image}")`; piece.style.backgroundPosition = `${(pieceIndex % 3) * 50}% ${Math.floor(pieceIndex / 3) * 50}%`; piece.addEventListener('click', () => movePuzzlePiece(boardIndex)); }
    board.appendChild(piece);
  });
}
function movePuzzlePiece(index) {
  const emptyIndex = puzzleState.indexOf(8);
  if (!getPuzzleNeighbours(emptyIndex).includes(index)) return;
  [puzzleState[emptyIndex], puzzleState[index]] = [puzzleState[index], puzzleState[emptyIndex]]; puzzleMoves++; renderPuzzleBoard();
  if (puzzleState.every((piece, boardIndex) => piece === boardIndex)) showToast('A new friend, assembled.');
}
function showToast(message) { const toast = $('#toast'); toast.textContent = message; toast.classList.add('show'); clearTimeout(showToast.timeout); showToast.timeout = setTimeout(() => toast.classList.remove('show'), 1500); }

renderCollection(); renderPuzzleChoices();
