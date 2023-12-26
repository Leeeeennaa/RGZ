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
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(`Error: ${data.error.message}`);
            console.error('Ошибка:', {url, requestPayload, response: data.error});
        } else {
            callback(data.result);
        }
    })
    .catch(error => {
        alert('Ошибка: ' + error);
        console.error('Ошибка:', error);
    });
}

function loginUser(event) {
    event.preventDefault();
    const login = document.getElementById('login').value;
    const password = document.getElementById('password').value;

    jsonRpcRequest('/api', 'App.login', { login: login, password: password }, function(data) {
        if (data.status === 'success') {
            window.location.href = '/';
        } else {
            alert('Login Ошибка: ' + (data.message ? data.message : 'Ошибка'));
        }
    }, true);  
}
