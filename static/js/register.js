function jsonRpcRequest(url, method, params, callback, debug = false) {
    const requestPayload = {
        jsonrpc: '2.0',
        method: method,
        params: params,
        id: new Date().getTime()
    };

    if (debug) {
        console.log("Отправка jsonrpc:", requestPayload);
    }

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
    })
    .then(response => {
        if (!response.ok) {
            const error = new Error(`HTTP error, status = ${response.status}`);
            console.error('Ошибка:', error);
            if (error.stack) {
                console.error('Ошибка:', error.stack);
            }
            throw error;
        }
        return response.json();
    })
    .then(data => {
        if (data.error) {
            const error = new Error(data.error.message || "Ошибка");
            console.error('Ошибка:', error);
            console.error('Ошибка :', {url, requestPayload, response: data.error});
            if (error.stack) {
                console.error('Ошибка :', error.stack);
            }
            throw error;
        }
        callback(data.result);
    })
    .catch(error => {
        console.error('Ошибка :', error);
        if (error.stack) {
            console.error('Ошибка :', error.stack);
        }
    });
}

// Event listener for register form submission
document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const login = document.getElementById('login').value;
    const password = document.getElementById('password').value;
    registerUser(name, login, password);
});

function registerUser(name, login, password) {
    jsonRpcRequest('/api', 'App.register', {
        name: name,
        login: login,
        password: password
    }, function(result) {
        alert(result.message);
        if (result.status === 'success') {
            console.log('Успешная регистрация:', result);

        } else {
            console.error('Ошибка :', result);
            alert('Ошибка: ' + result.message);
        }
    }, true);
}
