// initialize emailjs
(function(){
      emailjs.init({
        publicKey: "9zNP_beerJm18CHZq",
      });
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
