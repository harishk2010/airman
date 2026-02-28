const calculateQuizScore = (questions, answers) => {
  let correctCount = 0;
  const incorrectQuestions = [];

  for (const q of questions) {
    const studentAnswer = answers[q.id] || null;
    if (studentAnswer === q.correctOptionId) {
      correctCount++;
    } else {
      incorrectQuestions.push({
        questionId: q.id,
        question: q.question,
        studentAnswer,
        correctAnswer: q.correctOptionId,
        explanation: q.explanation || null,
      });
    }
  }

  const score = questions.length > 0
    ? parseFloat(((correctCount / questions.length) * 100).toFixed(2))
    : 0;

  return { score, correctCount, totalQuestions: questions.length, incorrectQuestions };
};

module.exports = { calculateQuizScore };
