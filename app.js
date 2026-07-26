// A data-led lesson engine: modes and levels can expand without changing the UI.
const SETTINGS = { low: { addition: [1, 5], subtraction: [3, 10] }, medium: { addition: [4, 10], subtraction: [8, 20] }, high: { addition: [8, 18], subtraction: [15, 30] } };
const state = { index: 0, attempts: 0, correct: 0, retried: false, mode: 'subtraction', difficulty: 'medium', lesson: [] };
const $ = (id) => document.getElementById(id);
const saved = JSON.parse(localStorage.getItem('leoCoachProgress') || '{}');
const modeName = (mode) => mode === 'mixed' ? 'mixed addition and subtraction' : mode;
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function makeQuestion(mode, difficulty) {
  const operation = mode === 'mixed' ? (Math.random() > .5 ? 'addition' : 'subtraction') : mode;
  const [min, max] = SETTINGS[difficulty][operation];
  if (operation === 'addition') {
    const a = rand(min, max), b = rand(min, max);
    return { a, b, answer: a + b, operation, prompt: `Nori found ${a} eggs, then ${b} more. How many eggs are there now?`, hint: `Start with ${a}. Count ${b} more, slowly and clearly.`, success: `Great job! ${a} plus ${b} equals ${a + b}.`, retry: `That was a brave try. Let’s count forward from ${a}, ${b} times.` };
  }
  const a = rand(min, max), b = rand(1, Math.min(10, a - 1));
  return { a, b, answer: a - b, operation, prompt: `Nori has ${a} eggs. ${b} eggs roll away. How many eggs are left?`, hint: `Start at ${a}. Count backwards ${b} steps: ${a - 1}, then keep going.`, success: `Yes! ${a} take away ${b} equals ${a - b}.`, retry: `A brave try. Let’s move the ${b} rolling eggs away one at a time, then count what is left.` };
}
function makeChoices(answer, difficulty) { const gap = difficulty === 'high' ? 2 : 1; const values = new Set([answer, Math.max(0, answer - gap), answer + gap]); while (values.size < 3) values.add(answer + values.size + 1); return [...values].sort(() => Math.random() - .5); }
function newLesson() { state.lesson = Array.from({ length: 3 }, () => { const q = makeQuestion(state.mode, state.difficulty); return { ...q, choices: makeChoices(q.answer, state.difficulty) }; }); }
function eggs(count, parent) { const shown = Math.min(count, 30); parent.innerHTML = Array.from({ length: shown }, (_, i) => `<span class="egg" style="--delay:${Math.min(i, 10) * 45}ms">●</span>`).join(''); parent.setAttribute('aria-label', `${count} eggs`); }
function speak(text) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US'; utterance.rate = .82; utterance.pitch = 1.12;
  const englishVoice = speechSynthesis.getVoices().find((voice) => /^en(-|_)/i.test(voice.lang));
  if (englishVoice) utterance.voice = englishVoice;
  speechSynthesis.speak(utterance);
}
function renderChallenge() {
  const item = state.lesson[state.index];
  $('challengeChip').textContent = `CHALLENGE ${state.index + 1} · ${item.operation.toUpperCase()}`;
  $('guideText').textContent = item.prompt; $('mathOperator').textContent = item.operation === 'addition' ? '+' : '−';
  $('thinkPrompt').textContent = item.operation === 'addition' ? 'Pick an answer, then tell Nori how you added.' : 'Pick an answer, then tell Nori how you took eggs away.';
  $('hintButton').disabled = false; $('hintButton').textContent = 'Need a clue? 💡';
  $('feedback').hidden = true; $('feedback').className = 'feedback'; $('nextButton').hidden = true; $('strategyRow').hidden = false;
  eggs(item.a, $('leftEggs')); eggs(item.b, $('rightEggs'));
  $('answers').innerHTML = item.choices.map(n => `<button class="answer" data-answer="${n}">${n}</button>`).join('');
  document.querySelectorAll('.answer').forEach((button) => button.addEventListener('click', () => checkAnswer(Number(button.dataset.answer), button)));
  $('progressCount').textContent = `${state.index} / ${state.lesson.length}`; $('progressBar').style.width = `${(state.index / state.lesson.length) * 100}%`;
  $('modeSummary').textContent = `Today: ${state.difficulty} ${modeName(state.mode)} practice.`;
}
function checkAnswer(answer, button) {
  const item = state.lesson[state.index]; state.attempts++;
  document.querySelectorAll('.answer').forEach((b) => { b.disabled = true; });
  const feedback = $('feedback'); feedback.hidden = false;
  if (answer === item.answer) {
    state.correct++; button.classList.add('correct'); feedback.className = 'feedback good'; feedback.innerHTML = `<strong>🌟 Great thinking!</strong><span>${item.success}</span>`; $('nextButton').hidden = false; $('nextButton').focus();
  } else {
    button.classList.add('try-again'); state.retried = true; feedback.className = 'feedback gentle'; feedback.innerHTML = `<strong>That was a brave try.</strong><span>${item.retry}</span><button id="tryAgain">Try with Nori’s clue</button>`;
    $('tryAgain').addEventListener('click', () => { $('hintButton').click(); document.querySelectorAll('.answer').forEach((b) => { b.disabled = false; b.classList.remove('try-again'); }); feedback.hidden = true; });
  }
  updateDashboard();
}
function updateDashboard() {
  const mastery = Math.round((state.correct / state.lesson.length) * 100);
  $('triesValue').textContent = state.attempts; $('masteryValue').textContent = `${mastery}%`; $('masteryBar').style.width = `${Math.max(mastery, 5)}%`;
  $('masteryText').textContent = state.attempts ? `Nori noticed ${state.attempts} brave attempt${state.attempts === 1 ? '' : 's'} today.` : 'Today’s small win will appear here.';
  $('moodValue').textContent = state.retried ? 'Kept trying' : state.attempts ? 'Confident explorer' : 'Ready to explore';
  $('skillValue').textContent = state.mode === 'subtraction' ? 'Taking away' : state.mode === 'addition' ? 'Adding together' : 'Math explorer';
}
function finish() {
  $('challengeCard').closest('.lesson-section').hidden = true; $('celebration').hidden = false; $('progressBar').style.width = '100%'; $('progressCount').textContent = '3 / 3'; $('progressWords').textContent = 'Quest complete!';
  const mastery = Math.round((state.correct / state.lesson.length) * 100);
  localStorage.setItem('leoCoachProgress', JSON.stringify({ mastery, completedAt: new Date().toISOString(), attempts: state.attempts, mode: state.mode, difficulty: state.difficulty }));
  $('parentNote').textContent = state.mode === 'subtraction' ? 'Leo is practising subtraction. Try using 10 small objects: move some away, then ask “How many are left?” — no timer, just 3 minutes.' : 'Ask Leo to explain his strategy using small objects. Explaining helps the idea stick.';
  updateDashboard(); speak('Quest complete! You helped Nori hatch the golden egg!');
}
function startQuest() { state.mode = $('modeSelect').value; state.difficulty = $('difficultySelect').value; state.index = 0; state.attempts = 0; state.correct = 0; state.retried = false; newLesson(); $('celebration').hidden = true; document.querySelector('.lesson-section').hidden = false; renderChallenge(); window.scrollTo({ top: document.querySelector('.lesson-section').offsetTop - 16, behavior: 'smooth' }); }
$('hintButton').addEventListener('click', () => { const item = state.lesson[state.index]; $('thinkPrompt').textContent = item.hint; $('hintButton').textContent = 'Clue unlocked! ✨'; $('hintButton').disabled = true; speak(item.hint); });
$('soundButton').addEventListener('click', () => speak(state.lesson[state.index].prompt));
$('nextButton').addEventListener('click', () => { state.index++; state.index < state.lesson.length ? renderChallenge() : finish(); });
document.querySelectorAll('[data-strategy]').forEach((b) => b.addEventListener('click', () => { document.querySelectorAll('[data-strategy]').forEach((x) => x.classList.remove('selected')); b.classList.add('selected'); }));
$('startQuest').addEventListener('click', startQuest);
$('parentToggle').addEventListener('click', () => { $('parentPanel').hidden = false; $('parentToggle').setAttribute('aria-expanded', 'true'); $('parentPanel').scrollIntoView({ behavior: 'smooth' }); });
$('closeParent').addEventListener('click', () => { $('parentPanel').hidden = true; $('parentToggle').setAttribute('aria-expanded', 'false'); });
$('playAgain').addEventListener('click', startQuest);
$('resetProgress').addEventListener('click', () => { localStorage.removeItem('leoCoachProgress'); location.reload(); });
if (saved.mastery) { $('masteryValue').textContent = `${saved.mastery}%`; $('masteryBar').style.width = `${saved.mastery}%`; $('masteryText').textContent = 'Saved from the last completed dino quest on this device.'; }
newLesson(); renderChallenge();
