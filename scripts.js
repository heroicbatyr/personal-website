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
    } else if (theme === 'batyr-mode') {
        logo.src = 'black-b.png';
        switcherIcon.src = 'white-mode-switcher.png';
    } else {
        logo.src = 'black-b.png';
        switcherIcon.src = 'night-mode-switcher.png';
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