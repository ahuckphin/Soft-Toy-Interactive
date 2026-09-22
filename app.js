const toys = await fetch('data/toys.json').then((response) => response.json());

const quizQuestions = [
  { answer: 'Coo', image: toys[16].image }, { answer: 'Floppy', image: toys[26].image }, { answer: 'Malta Owl', image: toys[35].image }, { answer: 'Scoop', image: toys[57].image }, { answer: 'Wedges', image: toys[68].image }
];
let quizOrder = [], quizIndex = 0, score = 0, puzzleToy = null, placedPieces = 0;
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
function openPuzzle(toy) { puzzleToy = toy; placedPieces = 0; $('#puzzle-choices').hidden = true; $('#puzzle-stage').hidden = false; $('#puzzle-progress').textContent = '0 / 9 placed'; const board = $('#puzzle-board'); board.innerHTML = ''; [...Array(9)].forEach((_, index) => { const piece = document.createElement('button'); piece.className = 'puzzle-piece'; piece.setAttribute('aria-label', `Puzzle piece ${index + 1}`); piece.style.backgroundImage = `url("${toy.image}")`; piece.style.backgroundPosition = `${(index % 3) * 50}% ${Math.floor(index / 3) * 50}%`; piece.addEventListener('click', () => { if (!piece.classList.contains('is-placed')) { piece.classList.add('is-placed'); placedPieces++; $('#puzzle-progress').textContent = `${placedPieces} / 9 placed`; if (placedPieces === 9) showToast('A new friend, assembled.'); } }); board.appendChild(piece); }); }
function showToast(message) { const toast = $('#toast'); toast.textContent = message; toast.classList.add('show'); clearTimeout(showToast.timeout); showToast.timeout = setTimeout(() => toast.classList.remove('show'), 1500); }

renderCollection(); renderPuzzleChoices();
