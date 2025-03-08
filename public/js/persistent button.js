document.getElementById('contact-btn').addEventListener('click', function() {
    var contactOptions = document.getElementById('contact-options');
    contactOptions.style.display = (contactOptions.style.display === 'flex') ? 'none' : 'flex';
});

document.getElementById('businessOwnerBtn').addEventListener('click', function() {
    window.location.href = "business-guest.html";
});

document.getElementById('hrManagerBtn').addEventListener('click', function() {
    window.location.href = "hr-guest.html";
});
