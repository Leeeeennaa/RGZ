function loadOrders() {
    jsonRpcRequest('/api', 'App.viewOrders', {}, function(data) {
        if (data.status === 'success') {
            const ordersList = document.getElementById('ordersList');
            ordersList.innerHTML = '';
            data.orders.forEach(order => {
                ordersList.innerHTML += `<div>
                    <p>Order ID: ${order.id}, Status: ${order.status}</p>
                    <button onclick="updateOrderStatus(${order.id}, 'Paid')">Отметить как оплаченный</button>
                </div>`;
            });
        } else {
            alert(data.message);
        }
    });
}

function updateOrderStatus(orderId, newStatus) {
    jsonRpcRequest('/api', 'App.updateOrderStatus', { order_id: orderId, new_status: newStatus }, function(data) {
        if (data.status === 'success') {
            loadOrders();  // Перезагрузка после обнавления статуса
        } else {
            alert(data.message);
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    loadOrders();
});
