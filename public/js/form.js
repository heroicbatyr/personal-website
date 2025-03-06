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

        // If no errors, redirect to success.html
        if (!hasErrors) {
            console.log('No errors, redirecting to success.html');
            form.reset(); // Clear form
            window.location.href = 'success.html'; // Direct redirect
        } else {
            console.log('Errors found, submission halted');
        }
    });
});

// Commented out validation for other fields
/*
const termsInput = document.getElementById('termsOfUse');
if (termsInput && !termsInput.checked) {
    const termsError = document.querySelector('#termsOfUse + .field-error');
    termsError.textContent = 'You must agree to the Terms of Use';
    termsError.style.display = 'block';
    termsInput.parentElement.classList.add('error-highlight');
    hasErrors = true;
} else if (termsInput) {
    termsError.textContent = '';
    termsError.style.display = 'none';
    termsInput.parentElement.classList.remove('error-highlight');
}
*/