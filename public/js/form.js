// public/js/form.js
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
            fullName: { input: document.getElementById('fullName'), error: document.querySelector('#fullName + .field-error') },
            email: { input: document.getElementById('email'), error: document.querySelector('#email + .field-error') }
        };
        const phone = document.getElementById('phone');
        const phoneError = document.querySelector('#phone + .field-error');

        // Validate required fields
        for (const [fieldName, { input, error }] of Object.entries(fields)) {
            if (!input) {
                console.error(`Input for ${fieldName} not found`);
                continue;
            }
            const value = input.value.trim();
            console.log(`${fieldName} value: '${value}'`);
            if (!value) {
                error.textContent = `${fieldName.replace(/([A-Z])/g, ' $1').trim()} is required`;
                error.style.display = 'block';
                input.classList.add('error-highlight');
                hasErrors = true;
            } else {
                error.textContent = '';
                error.style.display = 'none';
                input.classList.remove('error-highlight');
            }
        }

        // Validate phone (optional, 11-12 digits)
        const phoneValue = phone ? phone.value.trim() : '';
        if (phoneValue && !/^\d{11,12}$/.test(phoneValue)) {
            phoneError.textContent = 'Phone must be 11 or 12 digits';
            phoneError.style.display = 'block';
            phone.classList.add('error-highlight');
            hasErrors = true;
            console.log('Invalid phone format:', phoneValue);
        } else if (phoneError) {
            phoneError.textContent = '';
            phoneError.style.display = 'none';
            phone.classList.remove('error-highlight');
            console.log('Phone is valid or empty:', phoneValue);
        }

        // If no errors, send to server
        if (!hasErrors) {
            console.log('No errors, submitting form to server');
            const formData = new FormData(form);
            const formObject = Object.fromEntries(formData);

            console.log('Form Data (JSON):', formObject);

            fetch('/api/submit-form', {
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
                    window.location.href = 'success.html'; // Redirect after successful submission
                })
                .catch(error => {
                    console.error('Error submitting form:', error);
                    alert('Failed to submit form: ' + error.message);
                });
        } else {
            console.log('Errors found, submission halted');
        }
    });
});