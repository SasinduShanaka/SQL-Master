// Original teaching notes and self-checks for the guided SQL curriculum.
export const lessonNotes = {
  'intro-select': {
    minutes: 4,
    objective: 'Choose the columns you need from a table.',
    explanation: 'Think of a table as a spreadsheet: each row describes one record, and each column describes one property. SELECT chooses the properties you want to see. FROM tells the database which table to read. Running a SELECT query leaves the stored data unchanged.',
    example: 'SELECT name, score\nFROM students;',
    walkthrough: 'This returns two columns for every student. The result contains only name and score, in that order. Use an asterisk when you want to inspect all available columns.',
    takeaways: ['Separate column names with commas.', 'Choose explicit columns when building a report.', 'A query result is a view of data; SELECT does not edit the table.'],
    pitfall: 'Column names must match the schema. A space between two names does not replace the comma.',
    hints: ['Decide whether the task asks for a few columns or the whole record.', 'An asterisk represents every column in the table.'],
    check: { question: 'Which part of a SELECT query names the table to read?', options: ['SELECT', 'FROM', 'AS'], answer: 1, explanation: 'FROM names the source table. SELECT names the columns or expressions in the output.' }
  },
  filtering: {
    minutes: 5,
    objective: 'Keep only the rows that answer your question.',
    explanation: 'A WHERE condition is a test applied to each row. A row appears in the result only when that test is true. Combine tests with AND when both must be true, or OR when either can be true. Parentheses make mixed conditions easier to read.',
    example: 'SELECT name, score\nFROM students\nWHERE score < 80;',
    walkthrough: 'The database checks each student’s score and returns only students below 80. Changing the comparison changes the rows returned without changing the columns you selected.',
    takeaways: ['Use =, <, >, <=, >=, or <> for comparisons.', "Wrap text values in single quotes, such as cohort = 'A'.", 'Use IS NULL to find missing values; = NULL does not work.'],
    pitfall: '“At least” includes the boundary value. A strict greater-than comparison would exclude it.',
    hints: ['Identify the column and the boundary in the question.', 'Choose a comparison that includes a score equal to the boundary.'],
    check: { question: 'Which condition includes scores of exactly 80 as well as higher scores?', options: ['score > 80', 'score = 80', 'score >= 80'], answer: 2, explanation: '>= means greater than or equal to. It includes the boundary value as well as all larger values.' }
  },
  sorting: {
    minutes: 5,
    objective: 'Make rankings predictable and return only the rows you need.',
    explanation: 'Tables do not promise a natural row order. ORDER BY gives your result an explicit order; ASC places smaller values first and DESC places larger values first. LIMIT then keeps the requested number of rows from that ordered result.',
    example: 'SELECT name, score\nFROM students\nORDER BY score ASC, name ASC\nLIMIT 3;',
    walkthrough: 'This finds three students starting with the lowest score. If two scores match, name breaks the tie alphabetically. Tie breakers help make repeated reports consistent.',
    takeaways: ['ASC is the default when no direction is given.', 'List a second sort column to resolve ties.', 'Place LIMIT after ORDER BY.'],
    pitfall: 'LIMIT without ORDER BY does not reliably return the highest or lowest values.',
    hints: ['Sort the score column so the highest values appear first.', 'Once the rows are in order, restrict the result to the requested number.'],
    check: { question: 'How do you put the highest scores at the top?', options: ['ORDER BY score DESC', 'ORDER BY score ASC', 'LIMIT score'], answer: 0, explanation: 'DESC sorts values from largest to smallest. LIMIT controls the number of rows, not their order.' }
  },
  distinct: {
    minutes: 4,
    objective: 'Find the different values represented in your data.',
    explanation: 'DISTINCT removes duplicate result rows after the selected values are calculated. With one selected column, it returns each different value once. With several columns, it returns each different combination once.',
    example: 'SELECT DISTINCT cohort, score\nFROM students\nORDER BY cohort, score;',
    walkthrough: 'Two students with the same cohort and score produce one result row. Students in the same cohort with different scores still produce separate rows because the selected combinations differ.',
    takeaways: ['DISTINCT applies to the entire selected row.', 'Select only the columns that define the uniqueness you want.', 'Use ORDER BY if the unique values must appear in a particular order.'],
    pitfall: 'Adding an identifier such as id usually makes every row unique, so duplicates may appear to remain.',
    hints: ['The question asks for different cohorts, not different students.', 'Choose only the cohort column before removing duplicate results.'],
    check: { question: 'What does SELECT DISTINCT cohort, score return?', options: ['One arbitrary student per cohort', 'Every unique combination of cohort and score', 'Only scores that occur once'], answer: 1, explanation: 'DISTINCT compares all selected columns together. Repeated pairs are removed, even if either value appears in other pairs.' }
  },
  aggregates: {
    minutes: 7,
    objective: 'Turn individual records into a useful summary.',
    explanation: 'An aggregate combines several rows into one value. COUNT counts records, SUM adds values, and AVG calculates an average. GROUP BY divides rows into groups first, so the database can calculate a separate summary for each group.',
    example: 'SELECT cohort, COUNT(*) AS student_count\nFROM students\nGROUP BY cohort;',
    walkthrough: 'The database puts students with the same cohort into one group, counts the rows in each group, then returns one row per cohort. AS gives the calculated column a useful name.',
    takeaways: ['Group by each selected column that is not aggregated.', 'COUNT(*) counts rows, while COUNT(column) excludes missing values.', 'AVG ignores NULL values rather than treating them as zero.'],
    pitfall: 'Selecting an ungrouped, non-aggregated column can be rejected by a database or produce an arbitrary value.',
    hints: ['You need one result row per cohort, so decide which column defines each group.', 'Apply the average function to score and name the result as requested.'],
    check: { question: 'What happens when you GROUP BY cohort?', options: ['Every student stays on a separate result row', 'The table is permanently sorted by cohort', 'Rows with the same cohort are summarized together'], answer: 2, explanation: 'GROUP BY creates groups for aggregate calculations. It does not change the stored table or guarantee result ordering.' }
  },
  having: {
    minutes: 6,
    objective: 'Filter an aggregate report at the right stage.',
    explanation: 'WHERE decides which individual rows enter a calculation. HAVING decides which completed groups belong in the final report. This distinction matters when a question refers to an average, a total, or a count for a whole group.',
    example: 'SELECT cohort, COUNT(*) AS student_count\nFROM students\nGROUP BY cohort\nHAVING COUNT(*) > 1;',
    walkthrough: 'First, all students are grouped by cohort. The database then counts each group and keeps only cohorts with more than one student. No individual student is removed before the count.',
    takeaways: ['Use WHERE for conditions about individual rows.', 'Use HAVING for conditions about aggregate values.', 'A query can contain both WHERE and HAVING when both stages need filtering.'],
    pitfall: 'Filtering individual scores before calculating an average changes the population and can change the answer.',
    hints: ['Calculate each cohort’s average using all of its students.', 'Keep or discard a cohort after its aggregate has been calculated.'],
    check: { question: 'Where should a condition about COUNT(*) appear in a grouped query?', options: ['HAVING', 'WHERE', 'ORDER BY'], answer: 0, explanation: 'HAVING tests a group after its aggregate values are available. WHERE runs before those groups are calculated.' }
  },
  joins: {
    minutes: 8,
    objective: 'Combine related records without losing track of what each row means.',
    explanation: 'Related information often lives in separate tables. An INNER JOIN pairs rows when its ON condition is true. Table aliases keep column references short and make it clear which table a value comes from.',
    example: 'SELECT s.name, e.course\nFROM students AS s\nINNER JOIN enrollments AS e\n  ON s.id = e.studentId\nWHERE s.score >= 90;',
    walkthrough: 'Each matching enrollment becomes a result row for a high-scoring student. A student enrolled in two courses appears twice. A student without an enrollment has no match and is excluded.',
    takeaways: ['Join a referenced identifier to the matching identifier.', 'Qualify shared column names with a table name or alias.', 'A one-to-many relationship can produce several rows for one record.'],
    pitfall: 'A missing or incorrect matching condition can create many unintended combinations of rows.',
    hints: ['Find the student identifier in both table schemas.', 'Return the name from students and the course from enrollments for matching records.'],
    check: { question: 'A student has three matching enrollments. How many rows does a simple INNER JOIN return for that student?', options: ['One', 'Three', 'Zero'], answer: 1, explanation: 'Each matching pair becomes one result row. Three matching enrollments produce three rows for that student.' }
  },
  'left-joins': {
    minutes: 8,
    objective: 'Include records even when related data is missing.',
    explanation: 'A LEFT JOIN preserves every row from the table on its left. Matching rows from the right are added where they exist. When no match exists, the right-side columns contain NULL. This is useful when a report must include zero activity.',
    example: 'SELECT s.name, COUNT(e.studentId) AS course_count\nFROM students AS s\nLEFT JOIN enrollments AS e\n  ON s.id = e.studentId\nGROUP BY s.id, s.name;',
    walkthrough: 'Every student appears, even without an enrollment. Counting a right-side identifier ignores the NULL introduced for an unmatched student, producing a count of zero.',
    takeaways: ['Place the records you must preserve on the left.', 'Count a non-null right-side key to report zero matches.', 'Consider whether a right-table condition belongs in ON or WHERE.'],
    pitfall: 'A WHERE condition requiring a right-side value can remove unmatched rows and undo the purpose of a LEFT JOIN.',
    hints: ['Use the courses table as the left side so an empty course can still appear.', 'Count a right-side enrollment column instead of counting the placeholder row.'],
    check: { question: 'How can you count zero enrollments for an unmatched course?', options: ['COUNT(*)', 'SUM(c.title)', 'COUNT(e.studentId)'], answer: 2, explanation: 'COUNT(e.studentId) ignores the NULL from an unmatched right-side row. COUNT(*) would count that placeholder row as one.' }
  },
  subqueries: {
    minutes: 7,
    objective: 'Use the result of one query inside another.',
    explanation: 'A subquery is a query nested inside another SQL statement. A scalar subquery produces a single value, which can be used in a comparison. It is helpful when a threshold should come from the data rather than from a hard-coded number.',
    example: 'SELECT name, score\nFROM students\nWHERE score = (\n  SELECT MAX(score) FROM students\n);',
    walkthrough: 'The inner query determines the highest score. The outer query returns every student with that score, including ties. Conceptually, you can read the inner query first and substitute its result into the comparison.',
    takeaways: ['Wrap a subquery in parentheses.', 'A scalar comparison expects a single value.', 'Aggregates such as MAX or AVG can produce a single comparison value.'],
    pitfall: 'A subquery returning many rows is not interchangeable with a scalar value. Use a suitable set comparison such as IN when needed.',
    hints: ['Find the overall average with a separate aggregate query first.', 'Use that single calculated value as the threshold for the outer row filter.'],
    check: { question: 'Which subquery returns a single overall average?', options: ['SELECT AVG(score) FROM students', 'SELECT score FROM students', 'SELECT cohort, AVG(score) FROM students GROUP BY cohort'], answer: 0, explanation: 'An aggregate without GROUP BY produces one overall result. Grouping by cohort would create a separate result for each cohort.' }
  },
  ctes: {
    minutes: 7,
    objective: 'Break an analysis into clear, named steps.',
    explanation: 'A common table expression, or CTE, gives a query result a name for the duration of one statement. Define it with WITH, then refer to that name as a source in the main query. CTEs help separate data preparation from the final result.',
    example: 'WITH cohort_sizes AS (\n  SELECT cohort, COUNT(*) AS student_count\n  FROM students\n  GROUP BY cohort\n)\nSELECT cohort, student_count\nFROM cohort_sizes\nORDER BY student_count DESC;',
    walkthrough: 'The named step calculates cohort sizes. The main query reads that result and orders it for the report. The name cohort_sizes exists only within this statement; it does not create a stored table.',
    takeaways: ['Define a CTE as name AS (query) after WITH.', 'Use names that describe the intermediate result.', 'Separate multiple CTE definitions with commas.'],
    pitfall: 'A semicolon ends the statement. Do not place one between the CTE definition and its main SELECT.',
    hints: ['Put the score filter inside a named query defined with WITH.', 'Read from the required CTE name in the final SELECT.'],
    check: { question: 'How long does a normal CTE name remain available?', options: ['Until you delete it', 'For the statement in which it is defined', 'For every query in the account'], answer: 1, explanation: 'A CTE is scoped to one SQL statement. It is not a persistent database table.' }
  },
  case: {
    minutes: 6,
    objective: 'Translate a business rule into a calculated column.',
    explanation: 'CASE evaluates conditions in order and returns the value for the first matching condition. ELSE supplies a fallback when no condition matches. Because CASE is an expression, it can appear alongside ordinary columns in SELECT.',
    example: "SELECT name,\n  CASE\n    WHEN score >= 90 THEN 'excellent'\n    WHEN score >= 75 THEN 'on track'\n    ELSE 'needs support'\n  END AS performance\nFROM students;",
    walkthrough: 'A score of 95 meets both numeric conditions, but receives excellent because the first matching branch wins. The alias performance names the new output column.',
    takeaways: ['Put more specific overlapping conditions first.', 'Close the expression with END.', 'Without ELSE, a row that matches no branch returns NULL.'],
    pitfall: 'Putting a broad condition first can prevent a later, more specific branch from ever being reached.',
    hints: ['Describe the condition for the high band in a WHEN branch.', 'Use a default branch for every score that does not meet that condition.'],
    check: { question: 'What happens when two WHEN conditions are both true?', options: ['Both values are returned', 'The last matching value is returned', 'The first matching value is returned'], answer: 2, explanation: 'CASE evaluates branches in order and chooses the first true condition. Branch order is part of the business rule.' }
  },
  analytics: {
    minutes: 10,
    objective: 'Build a complete report with a clear level of detail.',
    explanation: 'A useful report starts with a precise question: what should one result row represent? Then choose the measures, any row or group filters, and the final ordering. Combining familiar clauses is easier when you make those decisions before writing SQL.',
    example: 'SELECT cohort,\n  COUNT(*) AS student_count,\n  MAX(score) AS highest_score\nFROM students\nWHERE score IS NOT NULL\nGROUP BY cohort\nHAVING COUNT(*) >= 2\nORDER BY highest_score DESC;',
    walkthrough: 'This report has one row per cohort. Missing scores are filtered first, then each cohort is summarized. Only groups with at least two scored students remain, ordered by their highest score.',
    takeaways: ['Define what one result row represents before you write SELECT.', 'Read the stages as FROM, WHERE, GROUP BY, HAVING, then final ordering.', 'Name your calculated columns so the report explains itself.'],
    pitfall: 'A query can run successfully and still answer the wrong business question. Check the grouping, boundaries, and sort direction against the request.',
    hints: ['Build the cohort counts and averages before adding any group filter.', 'Apply the minimum group size after grouping, then order by the requested metric.'],
    check: { question: 'What should you establish first when designing a grouped report?', options: ['What one result row represents', 'Which color to use for the results', 'How many aliases you can add'], answer: 0, explanation: 'The meaning of one row determines the grouping and helps you choose measures that answer the actual question.' }
  }
}
