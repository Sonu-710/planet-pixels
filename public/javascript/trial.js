const optionSelected = (button, correctAnswer) => {
    const selectedOption = button.value;
    
    if (correctAnswer === selectedOption) {
        // Change button style to green for correct answer
        button.style.backgroundColor = 'green';
        // alert("Correct answer!");
    } else {
        // Change button style to red for incorrect answer
        button.style.backgroundColor = 'red';
    }

    // Disable the button after an answer is selected
    button.disabled = true;
}
