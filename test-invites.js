const puppeteer = require('puppeteer');

(async () => {
    console.log('Launching browser Context 1 (Host - alexchen)...');
    const browser1 = await puppeteer.launch({ headless: 'new' });
    const page1 = await browser1.newPage();
    
    console.log('Launching browser Context 2 (Guest)...');
    const browser2 = await puppeteer.launch({ headless: 'new' });
    const page2 = await browser2.newPage();

    let success = false;
    
    try {
        console.log('Navigating Host to Room 101...');
        await page1.goto('http://localhost:3000/custom/room/101', { waitUntil: 'networkidle2' });
        
        console.log('Navigating Guest to Homepage...');
        await page2.goto('http://localhost:3000?guest=true', { waitUntil: 'networkidle2' });

        console.log('Host: Opening friends panel and inviting Guest Player...');
        // Click friends icon
        await page1.click('[data-friends-toggle]');
        await page1.waitForSelector('.friends-panel:not(.hidden)');
        
        // Wait a bit for transition
        await new Promise(r => setTimeout(r, 1000));
        
        // Find invite button for guest_user
        const inviteBtn = await page1.evaluateHandle(() => {
            const btns = Array.from(document.querySelectorAll('button[title="Invite to Match"]'));
            // Since we added guest_user, click the one corresponding to guest_user
            return btns[btns.length - 1]; // or find by parent text
        });
        
        if (inviteBtn) {
            await inviteBtn.click();
            console.log('Host: Invite sent successfully.');
        } else {
            console.error('Host: Could not find guest user invite button.');
        }

        console.log('Guest: Waiting for invite toast to appear...');
        const toast = await page2.waitForSelector('div[id^="invite-toast-"]', { timeout: 10000 });
        console.log('Guest: Toast appeared! Clicking Accept & Join...');
        
        // Click accept
        await page2.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('div[id^="invite-toast-"] button'));
            const acceptBtn = btns.find(b => b.innerText.includes('Accept & Join'));
            if(acceptBtn) acceptBtn.click();
        });

        console.log('Guest: Waiting for redirect to room...');
        await page2.waitForNavigation({ timeout: 10000 });
        console.log('Guest URL:', page2.url());
        
        if (page2.url().includes('/custom/room/101')) {
            console.log('SUCCESS: Internal real-time invite flowed nicely!');
            success = true;
        } else {
            console.error('FAILED: Guest did not redirect to room.');
        }

    } catch (e) {
        console.error('Error during test:', e);
    } finally {
        await browser1.close();
        await browser2.close();
        process.exit(success ? 0 : 1);
    }
})();
