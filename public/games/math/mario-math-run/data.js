/**
 * Mario Math Run — Question Generator & Data Module
 */
window.GAME_DATA = {
  /**
   * Generate a question based on operation type and pseudo-random function rng
   * @param {string} opType 'add' | 'sub' | 'mul' | 'div' | 'mixed'
   * @param {function} rng Random number generator (0..1)
   */
  generateQuestion: function(opType, rng) {
    var rand = rng || Math.random;
    var type = opType;
    if (type === 'mixed') {
      var types = ['add', 'sub', 'mul', 'div'];
      type = types[Math.floor(rand() * types.length)];
    }

    var num1, num2, answer, questionText, opSymbol;

    if (type === 'add') {
      num1 = Math.floor(rand() * 20) + 1;
      num2 = Math.floor(rand() * 20) + 1;
      answer = num1 + num2;
      opSymbol = '+';
      questionText = num1 + ' + ' + num2 + ' = ?';
    } else if (type === 'sub') {
      num1 = Math.floor(rand() * 20) + 5;
      num2 = Math.floor(rand() * num1) + 1; // ensure positive answer
      answer = num1 - num2;
      opSymbol = '-';
      questionText = num1 + ' - ' + num2 + ' = ?';
    } else if (type === 'mul') {
      num1 = Math.floor(rand() * 11) + 2; // 2..12
      num2 = Math.floor(rand() * 9) + 2;  // 2..10
      answer = num1 * num2;
      opSymbol = '×';
      questionText = num1 + ' × ' + num2 + ' = ?';
    } else { // div
      num2 = Math.floor(rand() * 9) + 2;  // 2..10
      answer = Math.floor(rand() * 10) + 1; // 1..10
      num1 = answer * num2;
      opSymbol = '÷';
      questionText = num1 + ' ÷ ' + num2 + ' = ?';
    }

    // Generate 3 choices (1 correct, 2 distractors)
    var choicesSet = new Set();
    choicesSet.add(answer);

    var maxAttempts = 20;
    var attempts = 0;
    while (choicesSet.size < 3 && attempts < maxAttempts) {
      attempts++;
      var offset = (Math.floor(rand() * 7) - 3); // -3 to +3
      if (offset === 0) offset = (rand() < 0.5 ? 1 : -1);
      var distractor = answer + offset;
      if (distractor >= 0 && distractor !== answer) {
        choicesSet.add(distractor);
      }
    }

    // Convert set to array and shuffle using rng
    var choices = Array.from(choicesSet);
    for (var i = choices.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1));
      var temp = choices[i];
      choices[i] = choices[j];
      choices[j] = temp;
    }

    return {
      text: questionText,
      answer: answer,
      choices: choices,
      opSymbol: opSymbol
    };
  }
};
