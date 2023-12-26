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

function loadOrders() {
    jsonRpcRequest('/api', 'App.viewOrders', {}, displayOrders, true);
}

function displayOrders(data) {
    const ordersList = document.getElementById('ordersList');
    ordersList.innerHTML = '';  

    if (data.status === 'success') {
        data.orders.forEach(order => {
            ordersList.innerHTML += `<div>
                <p>Заказ ID: ${order.id}, Статус: ${order.status}</p>
                <button onclick="viewOrderDetails(${order.id})">Детали</button>
                <button onclick="updateOrderStatus(${order.id}, 'Оплачено')">Отметить оплаченым</button>
            </div>`;
        });
    } else {
        alert('Ошибка: ' + (data.message ? data.message : 'Ошибка'));
    }
}

function viewOrderDetails(orderId) {
    jsonRpcRequest('/api', 'App.getOrderDetails', {order_id: orderId}, displayOrderDetails, true);
}

function displayOrderDetails(data) {
    const orderDetailsDiv = document.getElementById('orderDetails');
    orderDetailsDiv.innerHTML = '';  

    if (data.status === 'success') {
        let detailsHtml = `<h3>Детали заказа с ID: ${data.order_id}</h3>`;
        data.products.forEach(product => {
            detailsHtml += `<p>${product.name} - Количество: ${product.quantity}</p>`;
        });
        orderDetailsDiv.innerHTML = detailsHtml;
    } else {
        alert('Ошибка: ' + (data.message ? data.message : 'Ошибка'));
    }
}

function updateOrderStatus(orderId, newStatus) {
    jsonRpcRequest('/api', 'App.updateOrderStatus', { order_id: orderId, new_status: newStatus }, function(data) {
        if (data.status === 'success') {
            loadOrders();  
        } else {
            alert('Ошибка обнавления статуса: ' + (data.message ? data.message : 'Ошибка'));
        }
    }, true);
}

window.onload = loadOrders;
