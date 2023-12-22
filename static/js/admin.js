document.getElementById('adminRegisterForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    jsonRpcRequest('/api', 'App.register', {
        name: formData.get('name'),
        login: formData.get('login'),
        password: formData.get('password')
    }, function(result) {
        alert(result.message);
        if (result.status === 'success') {
            event.target.reset();  // Clear the form
        }
    });
});
