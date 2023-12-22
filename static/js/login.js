document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const login = document.getElementById('login').value;
    const password = document.getElementById('password').value;
    loginUser(login, password);
});

function loginUser(login, password) {
    jsonRpcRequest('/api', 'App.login', { login: login, password: password }, function(data) {
        if (data.status === 'success') {
            window.location.href = '/';  // После логина переходим на основную страницу
        } else {
            alert('Ошибка логина: ' + (data.message ? data.message : 'Ошиибка'));
        }
    });
}
