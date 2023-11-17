// called when any of the options are clicked in the frontend
var value;
var result=0;
console.log("Call");

const optionSelected = (event, correctAnswer) => {
    // event -> this is the button object which called this method
    console.log(event);
    console.log(result);
    value = event.value;
    if(correctAnswer === value) {
        result=10;
        alert("correct answer")
    }
    console.log(result);
}


document.addEventListener('DOMContentLoaded', function () {
    const sendDataBtn = document.getElementById('sendDataBtn');
  
    sendDataBtn.addEventListener('click', function () {
      // Sample data to be sent to the backend
      const dataToSend = {
        result : result
      };
  
      // Send data to the backend using Fetch API
      fetch('/sendData', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      })
      .then(response => response.text())
      .then(data => {
        console.log('Response from backend:', data);
      })
      .catch(error => {
        console.error('Error sending data:', error);
      });
    });
  });
  