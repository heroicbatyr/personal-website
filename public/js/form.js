document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const apiEndpoint = form.getAttribute('data-endpoint') || '/api/submit-contact';

    form.addEventListener('submit', function (event) {
        event.preventDefault();

        let hasErrors = false;
        const fieldIds = ['name', 'email', 'subject', 'message'];

        fieldIds.forEach(function (id) {
            const input = document.getElementById(id);
            if (!input) return;
            const error = input.nextElementSibling;
            if (!input.value.trim()) {
                if (error) {
                    error.textContent = id.charAt(0).toUpperCase() + id.slice(1) + ' is required';
                    error.style.display = 'block';
                }
                input.classList.add('error-highlight');
                hasErrors = true;
            } else {
                if (error) { error.textContent = ''; error.style.display = 'none'; }
                input.classList.remove('error-highlight');
            }
        });

        if (hasErrors) return;

        const formData = Object.fromEntries(new FormData(form));

        fetch(apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
        .then(function (response) {
            if (!response.ok) throw new Error('HTTP error ' + response.status);
            return response.json();
        })
        .then(function () {
            form.reset();
            const msg = document.getElementById('sendmessage');
            if (msg) msg.style.display = 'block';
        })
        .catch(function () {
            const err = document.getElementById('errormessage');
            if (err) {
                err.textContent = 'Failed to send message. Please try again.';
                err.style.display = 'block';
            }
        });
    });
});
