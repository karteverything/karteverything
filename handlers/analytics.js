// Load Google Analytics script
const gtagScript = document.createElement('script');
gtagScript.async = true;
gtagScript.src = "https://www.googletagmanager.com/gtag/js?id=G-NMCJXXWRWB";
document.head.appendChild(gtagScript);

// Initialize Google Analytics
window.dataLayer = window.dataLayer || [];
function gtag(){ dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', 'G-NMCJXXWRWB');
