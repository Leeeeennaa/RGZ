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

let currentPage = 1;
const perPage = 50;

function renderProduct(product) {
    return `<div>${product.name} - Количество: ${product.quantity}
                <button onclick="deleteProduct(${product.id})">Удалить</button>
            </div>`;
}

function loadProducts(page) {
    jsonRpcRequest('/api', 'App.getProductsPaginated', {page: page, per_page: perPage}, function(response) {
        const productsList = document.getElementById('productsList');
        productsList.innerHTML = '';  

        if (response && Array.isArray(response.products)) {
            response.products.forEach(product => {
                productsList.innerHTML += renderProduct(product);
            });

            if (response.has_more) {
                document.getElementById('moreButton').style.display = 'block';
            } else {
                document.getElementById('moreButton').style.display = 'none';
            }
        } 
    });
}

function loadMoreProducts() {
    loadProducts(++currentPage);
}

function addOrUpdateProduct() {
    const name = document.getElementById('newProductName').value;
    const quantity = document.getElementById('newProductQuantity').value;
    jsonRpcRequest('/api', 'App.addOrUpdateProduct', {name: name, quantity: parseInt(quantity)}, function(response) {
        if (response && response.status === 'success') {
            alert('Продукт обнавлён!');
            loadProducts(currentPage);  
        } 
    });
}

function addProductToInvoice() {
    const name = document.getElementById('productName').value;
    const quantity = document.getElementById('productQuantity').value;
    const user_id = parseInt(document.getElementById('userId').value);
    
    if (!name || !quantity || isNaN(user_id)) {
        alert('Пожалуйста, заполните все поля корректно.');
        return;
    }

    jsonRpcRequest('/api', 'App.addToInvoice', {
        user_id: user_id, 
        product_name: name, 
        quantity: parseInt(quantity)
    }, function(response) {
        if (response && response.status === 'success') {
            alert('Продукт добавлен в накладную!');
            loadProducts(currentPage);
        } 
    });
}


function deleteProduct(productId) {
    jsonRpcRequest('/api', 'App.deleteProduct', {product_id: productId}, function(response) {
        if (response && response.status === 'success') {
            alert('Продукт удалён!');
            loadProducts(currentPage);  
        } 
    });
}

window.onload = function() {
    loadProducts(currentPage);
}
