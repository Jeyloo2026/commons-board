const $ = selector => document.querySelector(selector);
const member = $('#member');
const composer = $('#composer');
const form = $('#proposal-form');
const storageKey = 'commons-board-preview-v2';
const views = {
  all: ['Proposal board', 'Review ideas and cast your vote before the deadline.'],
  closed: ['Decision archive', 'See what the guild decided and how each vote ended.'],
  mine: ['My votes', 'Review the proposals you voted on as this demo member.'],
};
const day = 86_400_000;
const initialProposals = [
  { title: 'Host a hands-on Go workshop?', details: 'Run a 90-minute session where new contributors ship a small CLI together.', deadline: Date.now() + 2 * day, yes: 8, no: 2, votes: {} },
  { title: 'Start a monthly maintainer office hour?', details: 'Give contributors a regular place to ask questions and get help with their first pull requests.', deadline: Date.now() + 4 * day, yes: 4, no: 1, votes: {} },
  { title: 'Publish a contributor starter kit?', details: 'Collect the setup guide, first issues and review checklist in one place.', deadline: Date.now() - day, yes: 11, no: 2, votes: {} },
];
let proposals = initialProposals;
let view = 'all';
try {
  const saved = JSON.parse(localStorage.getItem(storageKey));
  if (Array.isArray(saved)) proposals = saved;
} catch {
  // The demo still works in memory when storage is unavailable.
}

function save() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(proposals));
  } catch {
    // Keep the current session usable when storage is unavailable.
  }
}

function tally(proposal) {
  const votes = Object.values(proposal.votes);
  const yes = proposal.yes + votes.filter(vote => vote === 'yes').length;
  return { yes, no: proposal.no + votes.length - (yes - proposal.yes) };
}

function outcome(yes, no) {
  if (yes + no === 0) return 'No votes';
  if (yes === no) return 'Tied';
  return yes > no ? 'Passed' : 'Rejected';
}

function timeLeft(milliseconds) {
  const minutes = Math.max(1, Math.ceil(milliseconds / 60_000));
  if (minutes < 60) return minutes + ' min left';
  const hours = Math.ceil(minutes / 60);
  return hours < 24 ? hours + ' hr left' : Math.ceil(hours / 24) + ' days left';
}

function announce(message) {
  $('#status').textContent = message;
}

function drawPoll(proposal, now) {
  const node = $('#poll-template').content.firstElementChild.cloneNode(true);
  const get = selector => node.querySelector(selector);
  const { yes, no } = tally(proposal);
  const closed = proposal.deadline <= now;
  const previousVote = proposal.votes[member.value];
  get('h3').textContent = proposal.title;
  get('.description').textContent = proposal.details;
  get('.pill').textContent = closed ? outcome(yes, no) : 'Open for voting';
  get('.pill').classList.toggle('closed', closed);
  get('.deadline').textContent = closed
    ? 'Closed ' + new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(proposal.deadline)
    : timeLeft(proposal.deadline - now);
  get('.yes').textContent = 'Yes · ' + yes;
  get('.no').textContent = 'No · ' + no;
  get('.meter').setAttribute('aria-label', yes + ' yes votes and ' + no + ' no votes');
  get('.meter span').style.width = (yes + no ? yes / (yes + no) * 100 : 0) + '%';
  const receipt = get('.receipt');
  if (previousVote) {
    receipt.hidden = false;
    receipt.textContent = '✓ Your vote: ' + previousVote;
  }
  for (const button of node.querySelectorAll('[data-vote]')) {
    button.hidden = closed || Boolean(previousVote);
    button.addEventListener('click', () => {
      if (proposal.deadline <= Date.now() || proposal.votes[member.value]) {
        draw();
        return;
      }
      proposal.votes[member.value] = button.dataset.vote;
      save();
      const updated = draw();
      const replacement = updated.get(proposal);
      replacement.tabIndex = -1;
      replacement.focus();
      announce('Your ' + button.dataset.vote + ' vote was recorded.');
    });
  }
  return node;
}

function draw() {
  const now = Date.now();
  const closedCount = proposals.filter(proposal => proposal.deadline <= now).length;
  $('#open-count').textContent = proposals.length - closedCount;
  $('#closed-count').textContent = closedCount;
  $('#vote-count').textContent = proposals.reduce((sum, proposal) => {
    const { yes, no } = tally(proposal);
    return sum + yes + no;
  }, 0);
  const [title, note] = views[view];
  $('#view-title').textContent = title;
  $('#view-note').textContent = note;
  const visible = proposals.filter(proposal => {
    if (view === 'closed') return proposal.deadline <= now;
    if (view === 'mine') return Boolean(proposal.votes[member.value]);
    return true;
  });
  $('#result-count').textContent = visible.length + (visible.length === 1 ? ' proposal' : ' proposals');
  const container = $('#proposals');
  container.replaceChildren();
  const rendered = new Map();
  for (const proposal of visible) {
    const node = drawPoll(proposal, now);
    rendered.set(proposal, node);
    container.append(node);
  }
  if (!visible.length) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = view === 'mine' ? 'Your votes will appear here.' : 'Closed proposals will appear here.';
    container.append(empty);
  }
  return rendered;
}

function changeView(next) {
  view = next;
  for (const button of document.querySelectorAll('[data-view]')) {
    button.setAttribute('aria-pressed', String(button.dataset.view === view));
  }
  return draw();
}

for (const button of document.querySelectorAll('[data-view]')) {
  button.addEventListener('click', () => changeView(button.dataset.view));
}
member.addEventListener('change', draw);
$('#new').addEventListener('click', () => composer.showModal());
$('#cancel').addEventListener('click', () => composer.close());
form.addEventListener('submit', event => {
  event.preventDefault();
  const titleField = $('#title');
  const title = titleField.value.trim();
  if (!title) {
    titleField.setCustomValidity('Enter a proposal title.');
    titleField.reportValidity();
    return;
  }
  const proposal = {
    title, details: $('#details').value.trim(),
    deadline: Date.now() + Number($('#duration').value) * 60_000,
    yes: 0, no: 0, votes: {},
  };
  proposals.unshift(proposal);
  save();
  composer.close();
  form.reset();
  const card = changeView('all').get(proposal);
  card.tabIndex = -1;
  card.focus();
  announce('Proposal added. Voting is open.');
});
$('#title').addEventListener('input', event => event.target.setCustomValidity(''));
draw();
let lastRefresh = Date.now();
setInterval(() => {
  const now = Date.now();
  if (proposals.some(proposal => proposal.deadline > lastRefresh && proposal.deadline <= now)) {
    const focused = document.activeElement;
    if ($('#proposals').contains(focused)) $('#new').focus();
    draw();
    announce('A voting window closed. Results have been updated.');
  }
  lastRefresh = now;
}, 1000);
