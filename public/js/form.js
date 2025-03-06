document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded, form element:', document.getElementById('contactForm'));

    function validateForm(event) {
        event.preventDefault();
        console.log('Form submission triggered');
        let hasErrors = false;

        const fields = {
            fullName: { input: document.getElementById('fullName'), error: document.querySelector('#fullName + .field-error') },
            email: { input: document.getElementById('email'), error: document.querySelector('#email + .field-error') },
            businessType: { input: document.getElementById('businessType'), error: document.querySelector('#businessType + .field-error') },
            bestTime: { input: document.getElementById('bestTime'), error: document.querySelector('#bestTime + .field-error') },
            termsOfUse: { input: document.getElementById('termsOfUse'), error: document.querySelector('#termsOfUse + .field-error') }
        };
        const phone = document.getElementById('phone');
        const phoneError = document.querySelector('#phone + .field-error');

        for (const [fieldName, { input, error }] of Object.entries(fields)) {
            if (!input) {
                console.error(`Input for ${fieldName} not found`);
                continue;
            }
            if (input.type === 'checkbox') {
                if (!input.checked) {
                    error.textContent = 'You must agree to the Terms of Use';
                    error.style.display = 'block';
                    input.parentElement.classList.add('error-highlight');
                    hasErrors = true;
                    console.log(`${fieldName} not checked`);
                } else {
                    error.textContent = '';
                    error.style.display = 'none';
                    input.parentElement.classList.remove('error-highlight');
                    console.log(`${fieldName} checked`);
                }
            } else {
                const value = input.value.trim();
                console.log(`${fieldName} value: '${value}'`);
                if (!value) {
                    error.textContent = `${fieldName.replace(/([A-Z])/g, ' $1').trim()} is required`;
                    error.style.display = 'block';
                    input.classList.add('error-highlight');
                    hasErrors = true;
                    console.log(`${fieldName} is empty`);
                } else {
                    error.textContent = '';
                    error.style.display = 'none';
                    input.classList.remove('error-highlight');
                    console.log(`${fieldName} is valid: ${value}`);
                }
            }
        }

        const phoneValue = phone ? phone.value.trim() : '';
        if (phoneValue && !/^\(\d{3}\)\s\d{3}-\d{4}$/.test(phoneValue)) {
            phoneError.textContent = 'Phone must be in (123) 456-7890 format';
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

        if (!hasErrors) {
            console.log('No errors, submitting form to server');
            const formData = new FormData(document.getElementById('contactForm'));
            const formObject = Object.fromEntries(formData);
            formObject.termsOfUse = formObject.termsOfUse === 'on'; // Convert checkbox to boolean

            console.log('Form Data (JSON):', formObject);

            // Use absolute URL for local testing; adjust if deployed
            const apiUrl = 'http://localhost:3000/api/submit-form';

            fetch(apiUrl, {
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
                    // Redirect to success page instead of alert
                    window.location.href = '/success.html';
                })
                .catch(error => {
                    console.error('Error submitting form:', error);
                    alert('Failed to submit form: ' + error.message);
                });
            return true;
        } else {
            console.log('Errors found, form submission halted');
            return false;
        }
    }

    const form = document.getElementById('contactForm');
    if (form) {
        console.log('Form found, attaching submit event listener');
        form.addEventListener('submit', validateForm);
    } else {
        console.error('Form with ID "contactForm" not found');
    }
});