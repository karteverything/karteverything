// initialize emailjs
(function() {
  emailjs.init("zZuWx1PcPMwGuBQYn");
})();

// Optional: You can also add functions here to send emails, e.g.
function sendEmail(templateParams) {
  return emailjs.send("service_7ouy9fv", "template_chz5zq8", templateParams)
    .then((response) => {
      console.log("SUCCESS!", response.status, response.text);
    }, (error) => {
      console.error("FAILED...", error);
    });
}
