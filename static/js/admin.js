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
            const error = new Error(`HTTP ошибка, статус = ${response.status}`);
            console.error('Ошибка:', error);
            throw error;
        }
        return response.json();
    })
    .then(data => {
        if (data.error) {
            const error = new Error(data.error.message || "Ошибка jsonrpc");
            console.error('Ошибка:', error);
            throw error;
        }
        callback(data.result);
    })
    .catch(error => {
        console.error('Ошибка:', error);
    });
}

// Функция для регистрации кладовщика
function registerStorekeeper(event) {
    event.preventDefault();
    const name = document.getElementById('name').value;
    const login = document.getElementById('login').value;
    const password = document.getElementById('password').value;

    jsonRpcRequest('/api', 'App.register', {
        name: name,
        login: login,
        password: password
    }, function(result) {
        alert(result.message);
        if (result.status === 'success') {
            document.getElementById('adminRegisterForm').reset();  // Чистка формы
        }
    }, true); 
}

