async function fetchTodos() {
  const res = await fetch('/api/todos');
  return res.json();
}

async function addTodo(title) {
  await fetch('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
}

async function updateTodo(id, updates) {
  await fetch(`/api/todos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
}

async function deleteTodo(id) {
  await fetch(`/api/todos/${id}`, { method: 'DELETE' });
}

function render(todos) {
  const list = document.getElementById('todo-list');
  list.innerHTML = '';
  todos.forEach((t) => {
    const li = document.createElement('li');
    const left = document.createElement('div');
    left.className = 'todo-title';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = t.completed;
    const span = document.createElement('span');
    span.textContent = t.title;
    left.appendChild(checkbox);
    left.appendChild(span);

    const actions = document.createElement('div');
    actions.className = 'todo-actions';
    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.style.background = '#ef4444';
    delBtn.style.color = '#fff';
    actions.appendChild(delBtn);

    checkbox.addEventListener('change', async () => {
      await updateTodo(t.id, { completed: checkbox.checked });
      await refresh();
    });
    delBtn.addEventListener('click', async () => {
      await deleteTodo(t.id);
      await refresh();
    });

    li.appendChild(left);
    li.appendChild(actions);
    list.appendChild(li);
  });
}

async function refresh() {
  const todos = await fetchTodos();
  render(todos);
}

document.getElementById('add-btn').addEventListener('click', async () => {
  const input = document.getElementById('todo-input');
  const title = input.value.trim();
  if (!title) return;
  await addTodo(title);
  input.value = '';
  await refresh();
});

document.addEventListener('DOMContentLoaded', refresh);


