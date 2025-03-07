// public/js/message-form.js
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded, form element:', document.getElementById('contactForm'));

    const form = document.getElementById('contactForm');
    if (!form) {
        console.error('Form with ID "contactForm" not found');
        return;
    }

    console.log('Form found, attaching submit event listener');
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        console.log('Form submission triggered');

        let hasErrors = false;
        const fields = {
            name: { input: document.getElementById('name'), error: document.querySelector('#name + .validation') },
            email: { input: document.getElementById('email'), error: document.querySelector('#email + .validation') },
            subject: { input: document.getElementById('subject'), error: document.querySelector('#subject + .validation') },
            message: { input: document.getElementById('message'), error: document.querySelector('#message + .validation') }
        };

        // Validate required fields
        for (const [fieldName, { input, error }] of Object.entries(fields)) {
            if (!input) {
                console.error(`Input for ${fieldName} not found`);
                continue;
            }
            const value = input.value.trim();
            console.log(`${fieldName} value: '${value}'`);
            if (!value) {
                error.textContent = `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
                error.style.display = 'block';
                input.classList.add('error-highlight');
                hasErrors = true;
            } else {
                error.textContent = '';
                error.style.display = 'none';
                input.classList.remove('error-highlight');
            }
        }

        // If no errors, send to server
        if (!hasErrors) {
            console.log('No errors, submitting form to server');
            const formData = new FormData(form);
            const formObject = Object.fromEntries(formData);

            console.log('Form Data (JSON):', formObject);

            fetch('/api/submit-message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formObject)
            })
                .then(response => {
                    console.log('Response Status:', response.status);
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Server Response:', data);
                    form.reset();
                    document.getElementById('sendmessage').style.display = 'block'; // Show success message
                    setTimeout(() => {
                        document.getElementById('sendmessage').style.display = 'none';
                    }, 3000); // Hide after 3 seconds
                })
                .catch(error => {
                    console.error('Error submitting form:', error);
                    document.getElementById('errormessage').style.display = 'block';
                    document.getElementById('errormessage').textContent = 'Failed to submit form: ' + error.message;
                });
        } else {
            console.log('Errors found, submission halted');
        }
    });
});