const axios = require('axios');

async function testCompiler() {
    try {
        console.log('Testing compiler connection to http://127.0.0.1:3001/health...');
        const health = await axios.get('http://127.0.0.1:3001/health');
        console.log('Health Check:', health.data);

        console.log('\nTesting compilation with internal key...');
        const compile = await axios.post('http://127.0.0.1:3001/api/compile', {
            code: 'console.log("Hello from Test")',
            language: 'javascript',
            input: ""
        }, {
            headers: { 'compiler-internal-key': 'secret' }
        });
        console.log('Compile Result:', compile.data);
    } catch (err) {
        console.error('Test Failed!');
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', err.response.data);
        } else {
            console.error('Message:', err.message);
        }
    }
}

testCompiler();
