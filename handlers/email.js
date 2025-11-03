// initialize emailjs 
emailjs.init("9zNP_beerJm18CHZq");

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
