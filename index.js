const { Memify } = require('./memify');
const { writeFileSync } = require('fs');

const memify = new Memify();

// buffer is png buffer.
memify.add_text_to_image('https://i.ibb.co/8mcW270/upload-by-tembaksajabot.jpg', '', 'apa tuh').then((buffer) => writeFileSync('./tes.png', buffer))