const lessons = [
  {
    order: 1,
    id: 'intro-select',
    level: 'beginner',
    title: 'Getting Started with SELECT',
    topic: 'SELECT, FROM, ORDER BY',
    summary: 'Read rows from a table and sort results.',
    explanation: 'SELECT chooses columns, FROM chooses a table, and ORDER BY sorts the output.'
  },
  {
    order: 2,
    id: 'filtering',
    level: 'beginner',
    title: 'Filtering Rows with WHERE',
    topic: 'WHERE, AND, OR, IN, BETWEEN',
    summary: 'Learn how to narrow down results.',
    explanation: 'WHERE applies boolean conditions to each row before results are returned.'
  },
  {
    order: 3,
    id: 'joins',
    level: 'intermediate',
    title: 'Joining Tables',
    topic: 'INNER JOIN, LEFT JOIN',
    summary: 'Combine data from multiple tables.',
    explanation: 'JOINs match related records across tables using key columns.'
  },
  {
    order: 4,
    id: 'window-functions',
    level: 'advanced',
    title: 'Window Functions',
    topic: 'ROW_NUMBER, RANK, OVER',
    summary: 'Compute analytics without collapsing rows.',
    explanation: 'Window functions calculate values across a set of rows while preserving each row.'
  }
]

const quizzes = [
  {
    order: 1,
    id: 'quiz-select',
    lessonId: 'intro-select',
    question: 'Which clause sorts result rows?',
    options: ['GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT'],
    answerIndex: 1,
    explanation: 'ORDER BY is used to sort query results.'
  },
  {
    order: 2,
    id: 'quiz-join',
    lessonId: 'joins',
    question: 'Which JOIN keeps all rows from the left table?',
    options: ['INNER JOIN', 'RIGHT JOIN', 'LEFT JOIN', 'CROSS JOIN'],
    answerIndex: 2,
    explanation: 'LEFT JOIN preserves every row from the left side.'
  }
]

module.exports = { lessons, quizzes }
