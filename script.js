(() => {
  const STORAGE_KEY = "todos";

  const form = document.getElementById("todo-form");
  const input = document.getElementById("todo-input");
  const dateInput = document.getElementById("todo-datetime");
  const list = document.getElementById("todo-list");
  const summary = document.getElementById("task-summary");
  const clearCompletedBtn = document.getElementById("clear-completed");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const itemTemplate = document.getElementById("todo-item-template");

  let todos = loadTodos();
  let currentFilter = "all";

  function loadTodos() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveTodos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function formatDue(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    const datePart = date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const timePart = date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    return `${datePart}, ${timePart}`;
  }

  function getFilteredTodos() {
    if (currentFilter === "active") return todos.filter(t => !t.completed);
    if (currentFilter === "completed") return todos.filter(t => t.completed);
    return todos;
  }

  function render() {
    list.innerHTML = "";
    const filtered = getFilteredTodos();

    if (filtered.length === 0) {
      const empty = document.createElement("li");
      empty.className = "empty-state";
      empty.textContent = todos.length === 0
        ? "Nothing here yet. Add your first task above."
        : "No tasks match this filter.";
      list.appendChild(empty);
    } else {
      filtered.forEach(todo => list.appendChild(buildItem(todo)));
    }

    updateSummary();
    saveTodos();
  }

  function buildItem(todo) {
    const node = itemTemplate.content.firstElementChild.cloneNode(true);
    node.dataset.id = todo.id;
    node.classList.toggle("completed", todo.completed);

    const checkbox = node.querySelector(".todo-checkbox");
    const text = node.querySelector(".todo-text");
    const editInput = node.querySelector(".todo-edit-input");
    const dueBadge = node.querySelector(".todo-due");
    const deleteBtn = node.querySelector(".delete-btn");

    checkbox.checked = todo.completed;
    text.textContent = todo.text;
    editInput.value = todo.text;

    if (todo.due) {
      dueBadge.textContent = formatDue(todo.due);
      const isOverdue = !todo.completed && new Date(todo.due).getTime() < Date.now();
      dueBadge.classList.toggle("overdue", isOverdue);
    } else {
      dueBadge.remove();
    }

    checkbox.addEventListener("change", () => {
      todo.completed = checkbox.checked;
      render();
    });

    deleteBtn.addEventListener("click", () => {
      todos = todos.filter(t => t.id !== todo.id);
      render();
    });

    text.addEventListener("dblclick", () => {
      node.classList.add("editing");
      editInput.focus();
      editInput.select();
    });

    function commitEdit() {
      const value = editInput.value.trim();
      if (value) {
        todo.text = value;
      }
      node.classList.remove("editing");
      render();
    }

    editInput.addEventListener("blur", commitEdit);
    editInput.addEventListener("keydown", e => {
      if (e.key === "Enter") editInput.blur();
      if (e.key === "Escape") {
        editInput.value = todo.text;
        node.classList.remove("editing");
      }
    });

    return node;
  }

  function updateSummary() {
    const activeCount = todos.filter(t => !t.completed).length;
    if (todos.length === 0) {
      summary.textContent = "No tasks yet";
    } else {
      summary.textContent = `${activeCount} of ${todos.length} task${todos.length === 1 ? "" : "s"} remaining`;
    }
  }

  form.addEventListener("submit", e => {
    e.preventDefault();
    const value = input.value.trim();
    if (!value) return;
    const due = dateInput.value ? new Date(dateInput.value).toISOString() : null;
    todos.push({ id: uid(), text: value, completed: false, due });
    input.value = "";
    dateInput.value = "";
    render();
  });

  clearCompletedBtn.addEventListener("click", () => {
    todos = todos.filter(t => !t.completed);
    render();
  });

  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      render();
    });
  });

  render();
})();
