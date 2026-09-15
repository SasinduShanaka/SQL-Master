const curriculum = require('../../shared/curriculum.json')

const regions = ['North', 'South', 'East', 'West', 'Central', 'Coastal', 'Highland', 'Metro', 'Valley', 'Lakes']
const departments = ['Engineering', 'Sales', 'Finance', 'Support', 'Operations']
const table = (name, description, rows) => ({ name, description, columns: Object.keys(rows[0]), rows })

function buildDatasets() {
  const customers = regions.flatMap((region, r) => Array.from({ length: 24 }, (_, i) => ({
    id: r * 24 + i + 1, name: `${region} Customer ${i + 1}`, region,
    segment: ['consumer', 'business', 'enterprise'][i % 3], email: `${region.toLowerCase()}${Math.floor(i / 2)}@example.test`
  })))
  const products = Array.from({ length: 30 }, (_, i) => ({ id: i + 1, name: `Product ${i + 1}`, category: ['software', 'hardware', 'services'][i % 3], price: 25 + i * 15 }))
  const orders = regions.flatMap((region, r) => Array.from({ length: 12 }, (_, m) => Array.from({ length: 20 }, (_, i) => ({
    id: r * 240 + m * 20 + i + 1, customer_id: r * 24 + i + 1, product_id: (i + m) % 30 + 1,
    region, order_month: `2025-${String(m + 1).padStart(2, '0')}`, amount: 50 + ((i * 83 + m * 47 + r * 31) % 1950),
    quantity: i % 5 + 1, status: ['completed', 'completed', 'pending', 'cancelled'][i % 4]
  })))).flat()
  const employees = regions.flatMap((region, r) => Array.from({ length: 20 }, (_, i) => ({
    id: r * 20 + i + 1, name: `${region} Employee ${i + 1}`, region, department_id: i % 5 + 1,
    salary: 40000 + i * 3500 + r * 1000, manager_id: i < 5 ? null : r * 20 + i % 5 + 1
  })))
  return [
    table('customers', 'Customer accounts, including duplicate emails and customers without orders.', customers),
    table('products', 'Product catalog. Order amount is the recorded order value; it need not equal current catalog price.', products),
    table('orders', '2,400 orders across ten regions and twelve months. Amount is the full order value.', orders),
    table('departments', 'Department reference for employee joins.', departments.map((name, i) => ({ id: i + 1, name }))),
    table('employees', 'Employees, salaries, and nullable manager relationships.', employees)
  ]
}

function buildQuestions() {
  const questions = curriculum.exercises.map(q => ({ ...q, track: 'practice' }))
  function add(id, track, level, topic, lessonId, question, solutionSql, tableNames, hint, role = '') {
    questions.push({ id, order: questions.length + 1, track, level, topic, lessonId, question,
      goal: track === 'interview' ? 'Explain your approach, run your query, and compare with the reference solution.' : `Practice ${topic} with business data.`,
      solutionSql, tableNames, hints: [hint], starterSql: `-- ${question}\nSELECT\nFROM ${tableNames[0]};`, role,
      estimatedMinutes: level === 'advanced' ? 20 : level === 'intermediate' ? 12 : 7 })
  }
  for (const region of regions) {
    for (let month = 1; month <= 12; month++) {
      const period = `2025-${String(month).padStart(2, '0')}`
      const scope = `region = '${region}' AND order_month = '${period}'`
      const label = `${region}, ${period}`
      const templates = [
        ['beginner', 'WHERE', 'filtering', `List all completed orders for ${label}.`, `SELECT * FROM orders WHERE ${scope} AND status = 'completed';`, ['orders'], 'Combine the region, month, and status conditions with AND.'],
        ['beginner', 'ORDER BY', 'sorting', `Return id and amount for the five largest orders for ${label}, amount descending and id ascending for ties.`, `SELECT id, amount FROM orders WHERE ${scope} ORDER BY amount DESC, id ASC LIMIT 5;`, ['orders'], 'Filter first, then sort by amount DESC and id ASC and apply LIMIT 5.'],
        ['beginner', 'DISTINCT', 'distinct', `Return distinct customer_id values with orders for ${label}.`, `SELECT DISTINCT customer_id FROM orders WHERE ${scope};`, ['orders'], 'DISTINCT applies to the selected customer_id.'],
        ['beginner', 'WHERE', 'filtering', `Return id, amount, and status for orders between 300 and 1200 inclusive for ${label}.`, `SELECT id, amount, status FROM orders WHERE ${scope} AND amount BETWEEN 300 AND 1200;`, ['orders'], 'BETWEEN includes both boundary values.'],
        ['intermediate', 'GROUP BY', 'aggregates', `Return status, order_count, and revenue for ${label}, grouped by status.`, `SELECT status, COUNT(*) AS order_count, SUM(amount) AS revenue FROM orders WHERE ${scope} GROUP BY status;`, ['orders'], 'SUM(amount) totals recorded order values within each status group.'],
        ['intermediate', 'HAVING', 'having', `For ${label}, return status and average_amount for status groups averaging more than 500.`, `SELECT status, AVG(amount) AS average_amount FROM orders WHERE ${scope} GROUP BY status HAVING AVG(amount) > 500;`, ['orders'], 'Use HAVING for the aggregate condition, after GROUP BY.'],
        ['intermediate', 'JOINs', 'joins', `Return order_id, customer_name, and amount for ${label}. Include every order in that region and month.`, `SELECT o.id AS order_id, c.name AS customer_name, o.amount FROM orders o JOIN customers c ON c.id = o.customer_id WHERE o.region = '${region}' AND o.order_month = '${period}';`, ['orders', 'customers'], 'Join orders.customer_id to customers.id and qualify the region column.'],
        ['intermediate', 'CASE', 'case', `For ${label}, return id and value_band: high for amount at least 1000, otherwise standard.`, `SELECT id, CASE WHEN amount >= 1000 THEN 'high' ELSE 'standard' END AS value_band FROM orders WHERE ${scope};`, ['orders'], 'Use CASE WHEN with an ELSE branch and name the result value_band.'],
        ['advanced', 'Subqueries', 'subqueries', `Return all orders for ${label} whose amount exceeds the average order amount for that same region and month.`, `SELECT * FROM orders WHERE ${scope} AND amount > (SELECT AVG(amount) FROM orders WHERE ${scope});`, ['orders'], 'Apply the same region and month filter inside the average subquery.'],
        ['advanced', 'CTEs', 'ctes', `Use a CTE named scoped_orders for ${label}. Return product_id and revenue for completed orders, highest revenue first, product_id ascending for ties.`, `WITH scoped_orders AS (SELECT * FROM orders WHERE ${scope}) SELECT product_id, SUM(amount) AS revenue FROM scoped_orders WHERE status = 'completed' GROUP BY product_id ORDER BY revenue DESC, product_id ASC;`, ['orders'], 'Build the scoped CTE, filter completed orders, and aggregate by product_id.']
      ]
      templates.forEach((t, i) => add(`business-${region.toLowerCase()}-${period}-${i + 1}`, 'practice', ...t))
    }
    const scope = `region = '${region}'`
    const interview = [
      ['intermediate', 'Subqueries', 'subqueries', `Salary screening: return second_highest_salary, the second-highest distinct salary among ${region} employees.`, `SELECT MAX(salary) AS second_highest_salary FROM employees WHERE ${scope} AND salary < (SELECT MAX(salary) FROM employees WHERE ${scope});`, ['employees'], 'Exclude the highest salary, then find the maximum remaining salary.', 'SQL developer'],
      ['intermediate', 'LEFT JOIN', 'left-joins', `Customer retention: return id and name for ${region} customers who have never placed an order.`, `SELECT c.id, c.name FROM customers c LEFT JOIN orders o ON c.id = o.customer_id WHERE c.region = '${region}' AND o.id IS NULL;`, ['customers', 'orders'], 'Use a LEFT JOIN and test for a missing order ID.', 'Data analyst'],
      ['intermediate', 'HAVING', 'having', `Data quality: find duplicate customer emails in ${region}. Return email and duplicate_count for emails appearing more than once.`, `SELECT email, COUNT(*) AS duplicate_count FROM customers WHERE ${scope} GROUP BY email HAVING COUNT(*) > 1;`, ['customers'], 'Group by email and filter the groups using COUNT(*).', 'Data engineer'],
      ['advanced', 'JOINs', 'analytics', `Revenue interview: return the three ${region} customers with the most completed-order revenue in 2025. Return id, name, and revenue, revenue descending and id ascending for ties.`, `SELECT c.id, c.name, SUM(o.amount) AS revenue FROM customers c JOIN orders o ON o.customer_id = c.id WHERE c.region = '${region}' AND o.status = 'completed' GROUP BY c.id, c.name ORDER BY revenue DESC, c.id ASC LIMIT 3;`, ['customers', 'orders'], 'Filter completed orders before aggregating. Use a deterministic tie-breaker.', 'Data analyst'],
      ['advanced', 'CTEs', 'ctes', `Compensation review: return id, name, and salary for ${region} employees earning above their department average within that region. Use a CTE for the department averages.`, `WITH averages AS (SELECT department_id, AVG(salary) AS average_salary FROM employees WHERE ${scope} GROUP BY department_id) SELECT e.id, e.name, e.salary FROM employees e JOIN averages a ON a.department_id = e.department_id WHERE e.region = '${region}' AND e.salary > a.average_salary;`, ['employees'], 'Calculate one average per department, then join it back to individual employees.', 'SQL developer'],
      ['advanced', 'CASE', 'analytics', `Operations report: for each order_month in ${region}, return order_count and cancelled_count. Count all orders and count cancelled orders with conditional aggregation. Sort by order_month ascending.`, `SELECT order_month, COUNT(*) AS order_count, SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_count FROM orders WHERE ${scope} GROUP BY order_month ORDER BY order_month;`, ['orders'], 'SUM a CASE expression that returns 1 for cancelled orders and 0 otherwise.', 'Data engineer']
    ]
    interview.forEach((t, i) => add(`interview-${region.toLowerCase()}-${i + 1}`, 'interview', ...t))
  }
  return questions
}

module.exports = { buildDatasets, buildQuestions }
