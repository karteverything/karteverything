// menu toggle
    const menuToggle = document.getElementById("menu-toggle");
    const menuClose = document.getElementById("menu-close");
    const curtainNav = document.getElementById("curtain-nav");

    menuToggle.addEventListener("click", () => {
      curtainNav.style.height = "100%";
    });
    
    menuClose.addEventListener("click", () => {
      curtainNav.style.height = "0";
    });
    
document.addEventListener("DOMContentLoaded", function () {
    // blog "read more" functionality
    document.querySelectorAll('.read-more-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const para = btn.previousElementSibling;
            const expanded = para.getAttribute('data-expanded') === 'true';

            if (expanded) {
                para.innerText = para.innerText.slice(0, 100) + '...';
                para.setAttribute('data-expanded', 'false');
                btn.innerText = 'Read More';
            } else {
                para.innerText = "They say life has no formula—but what if that's only half true? Perfection isn't about control; it's about care. When you treat every detail—with respect—every word, every silence, every gesture, every breath, every choice, every relationship, every failure, and every attempt to begin again, you start to understand something deeper: mastery. It's not about chasing flawlessness, but about honoring every layer of living. Because when nothing is dismissed as insignificant, everything becomes meaningful.";
                para.setAttribute('data-expanded', 'true');
                btn.innerText = 'Read Less';
            }
        });
    });
});

// script for gallery slideshow
let slideIndex = 1
//showSlides(slideIndex);

// next/previous controls
function plusSlides(n) {
  showSlides(slideIndex += n);
}

// image controls
function currentSlide(n) {
  showSlides(slideIndex = n);
}

function showSlides(n) {
  let i;
  let slides = document.getElementsByClassName("mySlides");
  let dots = document.getElementsByClassName("dot");

  if (n > slides.length) {slideIndex = 1}
  if (n < 1) {slideIndex = slides.length}

  for (i = 0; i <slides.length; i++) {
    slides[i].style.display = "none";
  }

  for (i = 0; i <dots.length; i++) {
    dots[i].className = dots[i].className.replace( " active", "");
  }
  slides[slideIndex - 1].style.display = "block";
  //dots[slideIndex - 1].className += " active";
}

// slideshow fullscreen button
const fullscreenBtn = document.getElementById("fullscreenToggle");
const slideshow = document.querySelector(".slideshow-container");

fullscreenBtn.addEventListener("click", () => {
  if (!document.fullscreenElement) {
    // enter fullscreen
    if (slideshow.requestFullscreen) {
      slideshow.requestFullscreen();
    } else if (slideshow.webkitRequestFullscreen) { 
      slideshow.webkitRequestFullscreen();
    } else if (slideshow.msRequestFullscreen) { 
      slideshow.msRequestFullscreen();
    }
  } else {
    // exit fullscreen
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }
});


