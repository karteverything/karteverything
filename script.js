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

/* handle form input data */
emailjs.init("zZuWx1PcPMwGuBQYn");

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("contact-form");

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      emailjs.sendForm("service_7ouy9fv", "template_chz5zq8", this)
        .then(() => {
          alert("Message sent successfully!");
          form.reset(); //clear form after submitting
        }, (err) => {
          alert("Failed to send message: " + JSON.stringify(err));
        });
    });
  }
});

// script for gallery slideshow
let slideIndex = 1
showSlides(slideIndex);

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


