// Unit test: Quiz scoring logic
const { calculateQuizScore } = require('../../utils/quizScorer');

describe('Quiz Scoring', () => {
  const questions = [
    { id: 'q1', correctOptionId: 'a' },
    { id: 'q2', correctOptionId: 'b' },
    { id: 'q3', correctOptionId: 'c' },
    { id: 'q4', correctOptionId: 'd' },
  ];

  test('should return 100% score when all answers correct', () => {
    const answers = { q1: 'a', q2: 'b', q3: 'c', q4: 'd' };
    const result = calculateQuizScore(questions, answers);
    expect(result.score).toBe(100);
    expect(result.correctCount).toBe(4);
    expect(result.incorrectQuestions).toHaveLength(0);
  });

  test('should return 0% score when all answers wrong', () => {
    const answers = { q1: 'x', q2: 'x', q3: 'x', q4: 'x' };
    const result = calculateQuizScore(questions, answers);
    expect(result.score).toBe(0);
    expect(result.correctCount).toBe(0);
    expect(result.incorrectQuestions).toHaveLength(4);
  });

  test('should return 50% score when half correct', () => {
    const answers = { q1: 'a', q2: 'x', q3: 'c', q4: 'x' };
    const result = calculateQuizScore(questions, answers);
    expect(result.score).toBe(50);
    expect(result.correctCount).toBe(2);
    expect(result.incorrectQuestions).toHaveLength(2);
  });

  test('should include incorrect question details', () => {
    const answers = { q1: 'z', q2: 'b', q3: 'c', q4: 'd' };
    const result = calculateQuizScore(questions, answers);
    expect(result.incorrectQuestions[0].questionId).toBe('q1');
    expect(result.incorrectQuestions[0].studentAnswer).toBe('z');
    expect(result.incorrectQuestions[0].correctAnswer).toBe('a');
  });

  test('should handle missing answers (treat as wrong)', () => {
    const answers = { q1: 'a' };
    const result = calculateQuizScore(questions, answers);
    expect(result.score).toBe(25);
    expect(result.incorrectQuestions).toHaveLength(3);
  });
});
