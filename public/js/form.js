document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded, form element:', document.getElementById('contactForm'));

    const form = document.getElementById('contactForm');
    if (!form) {
        console.error('Form with ID "contactForm" not found');
        alert('Form not found! Check HTML.');
        return;
    }

    console.log('Form found, attaching submit event listener');

    // Use data-endpoint attribute to determine the API endpoint
    const apiEndpoint = form.getAttribute('data-endpoint') || '/api/submit-form';
    const isContactForm = apiEndpoint === '/api/submit-contact';

    console.log('Using API endpoint:', apiEndpoint);

    form.addEventListener('submit', function(event) {
        event.preventDefault();
        console.log('Form submission triggered');

        let hasErrors = false;

        if (isContactForm) {
            const fields = {
                name: { input: document.getElementById('name'), error: document.querySelector('#name + .field-error') || { textContent: '', style: {} } },
                email: { input: document.getElementById('email'), error: document.querySelector('#email + .field-error') || { textContent: '', style: {} } },
                subject: { input: document.getElementById('subject'), error: document.querySelector('#subject + .field-error') || { textContent: '', style: {} } },
                message: { input: document.getElementById('message'), error: document.querySelector('#message + .field-error') || { textContent: '', style: {} } }
            };
            for (const [fieldName, { input, error }] of Object.entries(fields)) {
                if (!input) continue;
                const value = input.value.trim();
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
        } else {
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

            for (const [fieldName, { input, error }] of Object.entries(fields)) {
                if (!input) continue;
                const value = input.value.trim();
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

            const phoneValue = phone ? phone.value.trim() : '';
            if (phoneValue && !/^\d{11,12}$/.test(phoneValue)) {
                phoneError.textContent = 'Phone must be 11 or 12 digits';
                phoneError.style.display = 'block';
                phone.classList.add('error-highlight');
                hasErrors = true;
            } else {
                phoneError.textContent = '';
                phoneError.style.display = 'none';
                phone.classList.remove('error-highlight');
            }

            if (termsInput && !termsInput.checked) {
                termsError.textContent = 'You must agree to the Terms of Use';
                termsError.style.display = 'block';
                termsInput.parentElement.classList.add('error-highlight');
                hasErrors = true;
            } else {
                termsError.textContent = '';
                termsError.style.display = 'none';
                termsInput.parentElement.classList.remove('error-highlight');
            }
        }

        if (!hasErrors) {
            console.log('No errors, submitting form to server');
            const formData = new FormData(form);
            const formObject = Object.fromEntries(formData);
            if (!isContactForm) {
                formObject.termsOfUse = formObject.termsOfUse === 'on';
            }

            console.log('Form Data (JSON):', formObject);

            fetch(apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formObject)
            })
                .then(response => {
                    console.log('Response Status:', response.status);
                    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                    return response.json();
                })
                .then(data => {
                    console.log('Server Response:', data);
                    form.reset();
                    window.location.href = 'success.html';
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