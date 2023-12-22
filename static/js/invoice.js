// // Функция для загрузки товаров в накладной
// function loadInvoiceItems() {
//     jsonRpcRequest('/api', 'App.getInvoiceItems', {user_id: parseInt(currentUserId)}, function(response) {
//         const invoiceList = document.getElementById('invoiceList');
//         if (response && Array.isArray(response.items)) {
//             invoiceList.innerHTML = response.items.map(item => 
//                 `<div>${item.productName} - Quantity: ${item.quantity}
//                  <button onclick="removeProductFromInvoice(${item.id})">Удалить</button>
//                  </div>`
//             ).join('');
//         } else {
//             invoiceList.innerHTML = 'Не удалось загрузить товары.';
//             console.error('Ошибка загрузки техники в накладной:', response);
//         }
//     });
// }

// Функция для отправки данных о новом товаре
function addProductToInvoice(event) {
    event.preventDefault();
    const productName = document.getElementById('productName').value;
    const productQuantity = document.getElementById('productQuantity').value;

    jsonRpcRequest('/api', 'App.addToInvoice', {
        user_id: currentUserId,
        product_name: productName,
        quantity: productQuantity
    }, function(response) {
        if (response && response.status === 'success') {
            alert('Товар добавлен в накладную успешно!');
            loadInvoiceItems();  // Обновляем список товаров в накладной
        } else {
            alert('Не удалось добавить товар в накладную.');
            console.error('Не удалось добавить товар в накладную: ', response);
        }
    });
}

// Функция для удаления товара из накладной
function removeProductFromInvoice(invoiceItemId) {
    jsonRpcRequest('/api', 'App.removeFromInvoice', {invoice_item_id: invoiceItemId}, function(response) {
        if (response && response.status === 'success') {
            alert('Товар удален из накладной успешно!');
            loadInvoiceItems();  // Обновляем список товаров в накладной
        } else {
            alert('Не удалось удалить товар из накладной.');
            console.error('Не удалось удалить товар из накладной: ', response);
        }
    });
}


// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    loadInvoiceItems();  // Загружаем товары в накладной при загрузке страницы
    document.getElementById('addProductForm').addEventListener('submit', addProductToInvoice);
});
