document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded, form element:', document.getElementById('contactForm'));

    const form = document.getElementById('contactForm');
    if (!form) {
        console.error('Form with ID "contactForm" not found');
        alert('Form not found! Check HTML.');
        return;
    }

    console.log('Form found, attaching submit event listener');
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        console.log('Form submission triggered');

        let hasErrors = false; // Declare hasErrors here
        const fields = {
            fullName: { input: document.getElementById('fullName'), error: document.querySelector('#fullName + .field-error') || { textContent: '', style: {} } },
            email: { input: document.getElementById('email'), error: document.querySelector('#email + .field-error') || { textContent: '', style: {} } },
            businessType: { input: document.getElementById('businessType'), error: document.querySelector('#businessType + .field-error') || { textContent: '', style: {} } },
            bestTime: { input: document.getElementById('bestTime'), error: document.querySelector('#bestTime + .field-error') || { textContent: '', style: {} } }
        };
        const phone = document.getElementById('phone');
        const phoneError = document.querySelector('#phone + .field-error') || { textContent: '', style: {} };
        const termsInput = document.getElementById('termsOfUse');
        const termsError = document.querySelector('#termsOfUse + .field-error') || { textContent: '', style: {} };

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

        // Validate terms of use (required)
        if (termsInput && !termsInput.checked) {
            termsError.textContent = 'You must agree to the Terms of Use';
            termsError.style.display = 'block';
            termsInput.parentElement.classList.add('error-highlight');
            hasErrors = true;
            console.log('Terms of Use not checked');
        } else if (termsError) {
            termsError.textContent = '';
            termsError.style.display = 'none';
            termsInput.parentElement.classList.remove('error-highlight');
            console.log('Terms of Use checked');
        }

        // If no errors, send to server
        if (!hasErrors) {
            console.log('No errors, submitting form to server');
            const formData = new FormData(form);
            const formObject = Object.fromEntries(formData);
            formObject.termsOfUse = formObject.termsOfUse === 'on'; // Convert checkbox to boolean

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
            alert('Form has errors, check fields');
        }
    });

    document.addEventListener('DOMContentLoaded', function () {
        alert('Script loaded'); // Confirm script runs
        console.log('DOM loaded, form element:', document.getElementById('contactForm'));
        // ... rest of your code
    });
});

if (!hasErrors) {
    fetch('/api/submit-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: 'Test', email: 'test@example.com', businessType: 'Test', bestTime: 'Now', termsOfUse: true })
    }).then(response => console.log('Success:', response)).catch(err => console.error('Error:', err));
}