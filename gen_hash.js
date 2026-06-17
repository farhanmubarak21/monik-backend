// gen_hash.js
const bcrypt = require('bcryptjs');

if (process.argv.length < 3) {
  console.error('Usage: node gen_hash.js <plainPassword>');
  process.exit(1);
}

const plain = process.argv[2];

(async () => {
  try {
    const hash = await bcrypt.hash(plain, 10); // saltRounds = 10
    console.log(hash);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
