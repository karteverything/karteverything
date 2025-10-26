// initialize emailjs
(function() {
  emailjs.init("zZuWx1PcPMwGuBQYn");
})();

// function to send email
function sendEmail(templateParams) {
  return emailjs.send("service_7ouy9fv", "template_chz5zq8", templateParams)
    .then((response) => {
      console.log("Success!", response.status, response.text);
    }, (error) => {
      console.error("Failed...", error);
    });
}
