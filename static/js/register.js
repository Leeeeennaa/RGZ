document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const login = document.getElementById('login').value;
    const password = document.getElementById('password').value;
    registerUser(name, login, password);
});

function registerUser(name, login, password) {
    fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'App.register',
            params: { name: name, login: login, password: password },
            id: 1
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.result.status === 'success') {
            console.log('Успешная регистрация:', data.result);
        } else {
            alert('Ошибка: ' + data.result.message);
        }
    });
}
