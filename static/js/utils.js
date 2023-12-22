function jsonRpcRequest(url, method, params, callback) {
    console.log("Sending JSON-RPC request with params:", params);

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            method: method,
            params: params,
            id: new Date().getTime()  
        })
    }).then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('Error: ' + data.error.message);
        } else {
            callback(data.result);
        }
    }).catch(error => {
        alert('Ошибка: ' + error);
    });
}
