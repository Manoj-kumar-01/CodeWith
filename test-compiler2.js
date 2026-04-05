const run = async () => {
    try {
        const payload = {
            code: "print('Hello From Python Docker')",
            language: "python",
            input: ""
        };

        // Node 22 built-in fetch
        const resp = await fetch('http://localhost:3001/api/compile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'compiler-internal-key': 'secret'
            },
            body: JSON.stringify(payload)
        });
        const data = await resp.json();
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch(e) {
        console.error("Error:", e);
    }
};

run();
