const http = require('http');
const fs = require('fs');
const url = require('url');

const PORT = process.env.PORT || 3000;

// In-memory database
const db = {
  todos: [
    { id: 1, text: 'Learn Node.js', completed: true, createdAt: new Date('2024-01-01') },
    { id: 2, text: 'Build a REST API', completed: true, createdAt: new Date('2024-01-05') },
    { id: 3, text: 'Deploy to production', completed: false, createdAt: new Date('2024-02-07') }
  ],
  nextId: 4,
  stats: {
    totalTodos: 3,
    completedTodos: 2,
    views: 1245
  }
};

// Send JSON response
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data, null, 2));
}

// Send HTML response
function sendHTML(res, html) {
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(html);
}

// Get all todos
function getTodos() {
  db.stats.views++;
  return {
    success: true,
    data: db.todos,
    stats: db.stats,
    timestamp: new Date().toISOString()
  };
}

// Get single todo
function getTodoById(id) {
  const todo = db.todos.find(t => t.id === parseInt(id));
  if (!todo) {
    return { success: false, error: 'Todo not found', status: 404 };
  }
  return { success: true, data: todo };
}

// Create new todo
function createTodo(text) {
  if (!text || text.trim() === '') {
    return { success: false, error: 'Todo text is required', status: 400 };
  }

  const newTodo = {
    id: db.nextId++,
    text: text.trim(),
    completed: false,
    createdAt: new Date()
  };

  db.todos.push(newTodo);
  db.stats.totalTodos++;

  return { success: true, data: newTodo, status: 201 };
}

// Update todo
function updateTodo(id, updates) {
  const todo = db.todos.find(t => t.id === parseInt(id));
  if (!todo) {
    return { success: false, error: 'Todo not found', status: 404 };
  }

  if (updates.text !== undefined) todo.text = updates.text;
  if (updates.completed !== undefined) {
    const wasCompleted = todo.completed;
    todo.completed = updates.completed;
    if (!wasCompleted && updates.completed) {
      db.stats.completedTodos++;
    } else if (wasCompleted && !updates.completed) {
      db.stats.completedTodos--;
    }
  }

  return { success: true, data: todo };
}

// Delete todo
function deleteTodo(id) {
  const index = db.todos.findIndex(t => t.id === parseInt(id));
  if (index === -1) {
    return { success: false, error: 'Todo not found', status: 404 };
  }

  const deletedTodo = db.todos[index];
  if (deletedTodo.completed) db.stats.completedTodos--;
  db.stats.totalTodos--;
  db.todos.splice(index, 1);

  return { success: true, data: deletedTodo };
}

// Parse request body
function parseBody(req, callback) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  req.on('end', () => {
    try {
      callback(JSON.parse(body || '{}'));
    } catch (e) {
      callback(null, e);
    }
  });
}

// Main HTML UI
const getHTML = function() {
  return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Modern Todo App</title><style>* { margin: 0; padding: 0; box-sizing: border-box; } body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; } .container { background: white; border-radius: 20px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); max-width: 600px; width: 100%; overflow: hidden; } .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; } .header h1 { font-size: 28px; margin-bottom: 10px; font-weight: 600; } .header p { opacity: 0.9; font-size: 14px; } .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; padding: 30px; background: #f8f9fa; border-bottom: 1px solid #e9ecef; } .stat-box { text-align: center; padding: 15px; background: white; border-radius: 12px; border: 1px solid #e9ecef; } .stat-number { font-size: 24px; font-weight: bold; color: #667eea; display: block; } .stat-label { font-size: 12px; color: #666; margin-top: 5px; text-transform: uppercase; } .add-todo { display: flex; gap: 10px; padding: 30px; border-bottom: 1px solid #e9ecef; } .add-todo input { flex: 1; padding: 12px 16px; border: 1px solid #e9ecef; border-radius: 8px; font-size: 14px; outline: none; transition: all 0.3s; } .add-todo input:focus { border-color: #667eea; box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); } .add-todo button { padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.3s; } .add-todo button:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3); } .todos { max-height: 400px; overflow-y: auto; } .todo-item { padding: 16px 30px; border-bottom: 1px solid #f0f0f0; display: flex; align-items: center; gap: 12px; transition: background 0.2s; } .todo-item:hover { background: #f8f9fa; } .todo-item input[type="checkbox"] { width: 20px; height: 20px; cursor: pointer; accent-color: #667eea; } .todo-text { flex: 1; font-size: 14px; color: #333; } .todo-item.completed .todo-text { color: #999; text-decoration: line-through; } .delete-btn { background: #ff6b6b; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; transition: all 0.2s; } .delete-btn:hover { background: #ff5252; transform: scale(1.05); } .empty-state { padding: 40px 30px; text-align: center; color: #999; } .empty-state p { margin-bottom: 10px; } .empty-state .emoji { font-size: 40px; margin-bottom: 10px; display: block; } .footer { padding: 20px; text-align: center; background: #f8f9fa; border-top: 1px solid #e9ecef; font-size: 12px; color: #666; } @media (max-width: 600px) { .header { padding: 30px 20px; } .header h1 { font-size: 24px; } .stats { grid-template-columns: repeat(3, 1fr); padding: 20px; } .add-todo { padding: 20px; flex-direction: column; } .todo-item { padding: 12px 20px; } }</style></head><body><div class="container"><div class="header"><h1>Modern Todo App</h1><p>Built with Node.js</p></div><div class="stats"><div class="stat-box"><span class="stat-number" id="totalCount">0</span><span class="stat-label">Total Todos</span></div><div class="stat-box"><span class="stat-number" id="completedCount">0</span><span class="stat-label">Completed</span></div><div class="stat-box"><span class="stat-number" id="pendingCount">0</span><span class="stat-label">Pending</span></div></div><div class="add-todo"><input type="text" id="todoInput" placeholder="Add a new todo..." /><button onclick="addTodo()">Add</button></div><div class="todos" id="todosList"><div class="empty-state"><span class="emoji">📝</span><p>Loading todos...</p></div></div><div class="footer">Made with Node.js | API: <a href="/api/todos" style="color: #667eea; text-decoration: none;">GET /api/todos</a></div></div><script>let todos = []; window.onload = () => { loadTodos(); document.getElementById("todoInput").addEventListener("keypress", (e) => { if (e.key === "Enter") addTodo(); }); }; async function loadTodos() { try { const response = await fetch("/api/todos"); const result = await response.json(); todos = result.data; updateUI(); } catch (error) { console.error("Error loading todos:", error); } } async function addTodo() { const input = document.getElementById("todoInput"); const text = input.value.trim(); if (!text) { alert("Please enter a todo"); return; } try { const response = await fetch("/api/todos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) }); const result = await response.json(); if (result.success) { input.value = ""; loadTodos(); } } catch (error) { console.error("Error adding todo:", error); } } async function toggleTodo(id, completed) { try { const response = await fetch("/api/todos/" + id, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ completed: !completed }) }); const result = await response.json(); if (result.success) { loadTodos(); } } catch (error) { console.error("Error toggling todo:", error); } } async function deleteTodo(id) { if (!confirm("Delete this todo?")) return; try { const response = await fetch("/api/todos/" + id, { method: "DELETE" }); const result = await response.json(); if (result.success) { loadTodos(); } } catch (error) { console.error("Error deleting todo:", error); } } function updateUI() { const todosList = document.getElementById("todosList"); if (todos.length === 0) { todosList.innerHTML = \'<div class="empty-state"><span class="emoji">🎉</span><p>No todos yet. Add one to get started!</p></div>\'; } else { todosList.innerHTML = todos.map(todo => \'<div class="todo-item \' + (todo.completed ? "completed" : "") + \'" id="todo-\' + todo.id + \'"><input type="checkbox" \' + (todo.completed ? "checked" : "") + \' onchange="toggleTodo(\' + todo.id + \', \' + todo.completed + \')"><span class="todo-text">\' + escapeHtml(todo.text) + \'</span><button class="delete-btn" onclick="deleteTodo(\' + todo.id + \')">Delete</button></div>\').join(""); } const stats = todos.length > 0 ? { total: todos.length, completed: todos.filter(t => t.completed).length } : { total: 0, completed: 0 }; document.getElementById("totalCount").textContent = stats.total; document.getElementById("completedCount").textContent = stats.completed; document.getElementById("pendingCount").textContent = stats.total - stats.completed; } function escapeHtml(text) { const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "\'": "&#039;" }; return text.replace(/[&<>"\']/g, m => map[m]); }</script></body></html>';
};

// Create server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  console.log('[' + new Date().toLocaleTimeString() + '] ' + method + ' ' + pathname);

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  // Main page
  if (pathname === '/' && method === 'GET') {
    sendHTML(res, getHTML());
    return;
  }

  // API Routes
  if (pathname.startsWith('/api/')) {
    // GET /api/todos
    if (pathname === '/api/todos' && method === 'GET') {
      sendJSON(res, 200, getTodos());
      return;
    }

    // POST /api/todos
    if (pathname === '/api/todos' && method === 'POST') {
      parseBody(req, (body, error) => {
        if (error) {
          sendJSON(res, 400, { success: false, error: 'Invalid JSON' });
          return;
        }
        const result = createTodo(body.text);
        sendJSON(res, result.status || 201, result);
      });
      return;
    }

    // GET /api/todos/:id
    const idMatch = pathname.match(/^\/api\/todos\/(\d+)$/);
    if (idMatch && method === 'GET') {
      const result = getTodoById(idMatch[1]);
      sendJSON(res, result.status || 200, result);
      return;
    }

    // PUT /api/todos/:id
    if (idMatch && method === 'PUT') {
      parseBody(req, (body, error) => {
        if (error) {
          sendJSON(res, 400, { success: false, error: 'Invalid JSON' });
          return;
        }
        const result = updateTodo(idMatch[1], body);
        sendJSON(res, result.status || 200, result);
      });
      return;
    }

    // DELETE /api/todos/:id
    if (idMatch && method === 'DELETE') {
      const result = deleteTodo(idMatch[1]);
      sendJSON(res, result.status || 200, result);
      return;
    }

    // GET /api/stats
    if (pathname === '/api/stats' && method === 'GET') {
      sendJSON(res, 200, { success: true, data: db.stats });
      return;
    }

    sendJSON(res, 404, { success: false, error: 'API endpoint not found' });
    return;
  }

  sendJSON(res, 404, { success: false, error: 'Not found' });
});

// Error handling
server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log('║   Modern Todo App - Running          ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('');
  console.log('  URL: http://localhost:' + PORT);
  console.log('  API: http://localhost:' + PORT + '/api/todos');
  console.log('');
  console.log('  Press Ctrl+C to stop');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
