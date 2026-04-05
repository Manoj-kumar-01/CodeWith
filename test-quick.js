// Quick test: JavaScript execution
const run = async () => {
    try {
        const resp = await fetch('http://localhost:3001/api/compile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'compiler-internal-key': 'secret'
            },
            body: JSON.stringify({
                code: 'console.log("Hello from JavaScript!")',
                language: 'javascript',
                input: ''
            })
        });
        const data = await resp.json();
        console.log("Status:", resp.status);
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch(e) {
        console.error("ERROR:", e.message);
    }
};
run();
