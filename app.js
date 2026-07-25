// Curriculum lives in data, so additional lessons can reuse the same interaction engine.
const LESSON = [
  { a: 8, b: 7, answer: 15, choices: [14, 15, 16], prompt: 'We need 15 eggs. We found 8, then 7 more. How many eggs do we have?', hint: 'Eight needs 2 more to make 10. Can you move 2 eggs from the group of 7?', success: 'Yes! 8 plus 2 makes 10, and 5 are left. 10 plus 5 makes 15!', retry: 'Nice try! Let’s use a dino trick: first make 10. Eight needs 2 more.' },
  { a: 6, b: 5, answer: 11, choices: [10, 11, 12], prompt: 'Nori found 6 shiny stones, then 5 more. How many stones now?', hint: 'Six needs 4 more to make 10. How many are left from 5?', success: 'You got it! 6 plus 4 is 10, then one more makes 11!', retry: 'That was a brave guess. Let’s make 10: 6 needs 4, so there is 1 left.' },
  { a: 9, b: 4, answer: 13, choices: [12, 13, 14], prompt: 'The baby dinos have 9 leaves, and find 4 more. How many leaves?', hint: 'Nine needs only 1 more to make 10. What is left?', success: 'Amazing! 9 plus 1 is 10, then 3 more makes 13!', retry: 'Keep going — you are learning a clever trick. Move 1 from 4 to make 10.' }
];

const state = { index: 0, attempts: 0, correct: 0, strategy: '', retried: false };
const $ = (id) => document.getElementById(id);
const saved = JSON.parse(localStorage.getItem('leoCoachProgress') || '{}');

function eggs(count, parent) {
  parent.innerHTML = Array.from({ length: count }, (_, i) => `<span class="egg" style="--delay:${i * 45}ms">●</span>`).join('');
}
function speak(text) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text); utterance.rate = .88; utterance.pitch = 1.2;
  speechSynthesis.speak(utterance);
}
function renderChallenge() {
  const item = LESSON[state.index];
  $('challengeChip').textContent = `CHALLENGE ${state.index + 1}`;
  $('guideText').textContent = item.prompt;
  $('thinkPrompt').textContent = 'Pick an answer, then tell Nori how you thought about it.';
  $('hintButton').disabled = false; $('hintButton').textContent = 'Need a clue? 💡';
  $('feedback').hidden = true; $('feedback').className = 'feedback';
  $('nextButton').hidden = true; $('strategyRow').hidden = false;
  eggs(item.a, $('leftEggs')); eggs(item.b, $('rightEggs'));
  $('answers').innerHTML = item.choices.map(n => `<button class="answer" data-answer="${n}">${n}</button>`).join('');
  document.querySelectorAll('.answer').forEach(button => button.addEventListener('click', () => checkAnswer(Number(button.dataset.answer), button)));
  $('progressCount').textContent = `${state.index} / ${LESSON.length}`;
  $('progressBar').style.width = `${(state.index / LESSON.length) * 100}%`;
}
function checkAnswer(answer, button) {
  const item = LESSON[state.index]; state.attempts++;
  document.querySelectorAll('.answer').forEach(b => b.disabled = true);
  const feedback = $('feedback'); feedback.hidden = false;
  if (answer === item.answer) {
    state.correct++; button.classList.add('correct');
    feedback.className = 'feedback good'; feedback.innerHTML = `<strong>🌟 Great thinking!</strong><span>${item.success}</span>`;
    $('nextButton').hidden = false; $('nextButton').focus();
  } else {
    button.classList.add('try-again'); state.retried = true;
    feedback.className = 'feedback gentle'; feedback.innerHTML = `<strong>That was a brave try.</strong><span>${item.retry}</span><button id="tryAgain">Try with Nori’s clue</button>`;
    $('tryAgain').addEventListener('click', () => { $('hintButton').click(); document.querySelectorAll('.answer').forEach(b => { b.disabled = false; b.classList.remove('try-again'); }); feedback.hidden = true; });
  }
  updateDashboard();
}
function updateDashboard() {
  const mastery = Math.round((state.correct / LESSON.length) * 100);
  $('triesValue').textContent = state.attempts;
  $('masteryValue').textContent = `${mastery}%`;
  $('masteryBar').style.width = `${Math.max(mastery, 5)}%`;
  $('masteryText').textContent = state.attempts ? `Nori noticed ${state.attempts} brave attempt${state.attempts === 1 ? '' : 's'} today.` : 'Today’s small win will appear here.';
  $('moodValue').textContent = state.retried ? 'Kept trying' : state.attempts ? 'Confident explorer' : 'Ready to explore';
}
function finish() {
  $('challengeCard').closest('.lesson-section').hidden = true;
  $('celebration').hidden = false; $('progressBar').style.width = '100%'; $('progressCount').textContent = '3 / 3'; $('progressWords').textContent = 'Quest complete!';
  const mastery = Math.round((state.correct / LESSON.length) * 100);
  localStorage.setItem('leoCoachProgress', JSON.stringify({ mastery, completedAt: new Date().toISOString(), attempts: state.attempts }));
  $('skillValue').textContent = mastery >= 67 ? 'Making 10: growing strong' : 'Making 10: keep exploring';
  $('parentNote').textContent = state.retried ? 'Leo made a mistake and came back to try again — that is a meaningful win. Tomorrow, use 10 small objects to make “10 and some more” together for 3 minutes.' : 'Leo is using a powerful “make 10” strategy. Ask him to teach it back to you with small objects; explaining helps the idea stick.';
  updateDashboard(); speak('Quest complete! You helped Nori hatch the golden egg!');
}

$('hintButton').addEventListener('click', () => { const item = LESSON[state.index]; $('thinkPrompt').textContent = item.hint; $('hintButton').textContent = 'Clue unlocked! ✨'; $('hintButton').disabled = true; speak(item.hint); });
$('soundButton').addEventListener('click', () => speak(LESSON[state.index].prompt));
$('nextButton').addEventListener('click', () => { state.index++; state.strategy = ''; state.index < LESSON.length ? renderChallenge() : finish(); });
document.querySelectorAll('[data-strategy]').forEach(b => b.addEventListener('click', () => { state.strategy = b.dataset.strategy; document.querySelectorAll('[data-strategy]').forEach(x => x.classList.remove('selected')); b.classList.add('selected'); }));
$('parentToggle').addEventListener('click', () => { $('parentPanel').hidden = false; $('parentToggle').setAttribute('aria-expanded', 'true'); $('parentPanel').scrollIntoView({ behavior: 'smooth' }); });
$('closeParent').addEventListener('click', () => { $('parentPanel').hidden = true; $('parentToggle').setAttribute('aria-expanded', 'false'); });
$('playAgain').addEventListener('click', () => { state.index = 0; state.attempts = 0; state.correct = 0; state.retried = false; $('celebration').hidden = true; document.querySelector('.lesson-section').hidden = false; renderChallenge(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
$('resetProgress').addEventListener('click', () => { localStorage.removeItem('leoCoachProgress'); location.reload(); });
if (saved.mastery) { $('masteryValue').textContent = `${saved.mastery}%`; $('masteryBar').style.width = `${saved.mastery}%`; $('masteryText').textContent = 'Saved from the last completed dino quest on this device.'; }
renderChallenge();
