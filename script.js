document.addEventListener("DOMContentLoaded", function () {
    // menu toggle
    const toggle = document.getElementById("menu-toggle");
    const closeBtn = document.getElementById("menu-close");
    const nav = document.getElementById("nav");

    if (toggle && closeBtn && nav) {
        toggle.addEventListener("click", () => {
            nav.classList.add("open");
            toggle.style.display = "none";
            closeBtn.style.display = "block";
        });

        closeBtn.addEventListener("click", () => {
            nav.classList.remove("open");
            toggle.style.display = "block";
            closeBtn.style.display = "none";
        });
    }

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
                para.innerText = "They say life has no formula—but what if that’s only half true? Perfection isn’t about control; it’s about care. When you treat every detail—with respect—every word, every silence, every gesture, every breath, every choice, every relationship, every failure, and every attempt to begin again, you start to understand something deeper: mastery. It’s not about chasing flawlessness, but about honoring every layer of living. Because when nothing is dismissed as insignificant, everything becomes meaningful.";
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

