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
            alert(`Ошибка: ${data.error.message}`);
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

function finalizeInvoice() {
    jsonRpcRequest('/api', 'App.finalizeInvoice', {user_id: userId}, function(response) {
        console.log(response);
        if (response && response.status === 'success') {
            alert("Накладная завершена, заказ создан.");
        }
    });
}

function renderInvoiceItem(item) {
    return `<div class="invoice-item">
                <span>${item.productName} - Количество: ${item.quantity}</span>
            </div>`;
}

function loadInvoiceItems() {
    jsonRpcRequest('/api', 'App.getInvoiceItems', {user_id: userId}, function(response) {
        const itemsContainer = document.getElementById('invoiceItems');
        
        itemsContainer.innerHTML = '';

        if (response && response.status === 'success' && response.items) {
            response.items.forEach(item => {
                const itemHtml = `<div class="invoice-item">
                                    <span>${item.productName} - Количество: ${item.quantity}</span>
                                  </div>`;
                itemsContainer.innerHTML += itemHtml;
            });
        } 
    });
}

window.onload = loadInvoiceItems;
