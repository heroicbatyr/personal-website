

document.addEventListener('DOMContentLoaded', (event) => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.className = savedTheme;
        setLogoAndSwitcher(savedTheme);
        currentTheme = themes.indexOf(savedTheme);
    }
    highlightElement(); // Run highlight function when the page loads
    setActiveMenuItem(); // Set active menu item when the page loads
});

let currentTheme = 0;
const themes = ['day-mode', 'night-mode', 'batyr-mode'];
const logo = document.getElementById('logo');
const switcherIcon = document.getElementById('switcher-icon');
const instagramIcon = document.getElementById('instagramicon'); // Add Instagram icon element

function toggleTheme() {
    currentTheme = (currentTheme + 1) % themes.length;
    const newTheme = themes[currentTheme];
    document.body.className = newTheme;
    setLogoAndSwitcher(newTheme);
    localStorage.setItem('theme', newTheme);
}

function setLogoAndSwitcher(theme) {
    if (theme === 'night-mode') {
        logo.src = 'white-b.png';
        switcherIcon.src = 'batyr-mode-switcher.png';
        instagramIcon.src = 'instagram-logo-aq.png'; // Change to white Instagram icon
    } else if (theme === 'batyr-mode') {
        logo.src = 'black-b.png';
        switcherIcon.src = 'white-mode-switcher.png';
        instagramIcon.src = 'instagram-logo.png'; // Change to black Instagram icon
    } else {
        logo.src = 'black-b.png';
        switcherIcon.src = 'night-mode-switcher.png';
        instagramIcon.src = 'instagram-logo.png'; // Change to black Instagram icon
    }
}

function toggleNav() {
    var sidebar = document.getElementById("mySidebar");
    if (sidebar.style.width === "250px") {
        sidebar.style.width = "0";
    } else {
        sidebar.style.width = "250px";
    }
}

// Highlight element function
function highlightElement() {
    if (window.location.hash) {
        var element = document.querySelector(window.location.hash);
        if (element) {
            element.classList.add("highlight");
            setTimeout(function() {
                element.classList.remove("highlight");
            }, 1234); // Highlight for 1,234 milliseconds
        }
    }
}

// Run the highlight function when the hash changes
window.onhashchange = highlightElement;

// Set active menu item function
function setActiveMenuItem() {
    const sidebarLinks = document.querySelectorAll('.sidebar a');
    const currentPath = window.location.pathname.split("/").pop();
    sidebarLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

let lastScrollY = window.scrollY;
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
    if (window.scrollY > lastScrollY) {
        // Scrolling down
        header.classList.add('hidden');
    } else {
        // Scrolling up
        header.classList.remove('hidden');
    }
    lastScrollY = window.scrollY;
});

document.addEventListener("DOMContentLoaded", function() {
    const nextButton = document.querySelector(".next-button");
    const prevButton = document.querySelector(".prev-button");
    const photos = document.querySelectorAll(".photo");
    let currentIndex = 0;

    nextButton.addEventListener("click", function() {
        photos[currentIndex].style.display = "none";
        currentIndex = (currentIndex + 1) % photos.length;
        photos[currentIndex].style.display = "block";
    });

    prevButton.addEventListener("click", function() {
        photos[currentIndex].style.display = "none";
        currentIndex = (currentIndex - 1 + photos.length) % photos.length;
        photos[currentIndex].style.display = "block";
    });

    // Initially show only the first photo
    photos.forEach((photo, index) => {
        if (index !== 0) {
            photo.style.display = "none";
        }
    });
});