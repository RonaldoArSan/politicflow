try {
  const resolve = require('enhanced-resolve');
  console.log('Successfully required enhanced-resolve:', typeof resolve);
} catch (err) {
  console.error('Failed to require enhanced-resolve:', err.message);
  process.exit(1);
}
