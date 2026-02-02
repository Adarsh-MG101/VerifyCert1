require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const TestResult = require('../models/TestResult');

async function runTests() {
    console.log('🚀 Starting Industrial Grade Test Runner...');

    // Connect to DB
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB for logging results.');
    } catch (err) {
        console.error('❌ MongoDB Connection Failed:', err.message);
        process.exit(1);
    }

    const casesDir = path.join(__dirname, 'cases');
    const outputsDir = path.join(__dirname, 'outputs');
    const testFiles = fs.readdirSync(casesDir).filter(f => f.endsWith('.test.js'));

    const summary = {
        total: 0,
        passed: 0,
        failed: 0,
        results: []
    };

    for (const file of testFiles) {
        console.log(`\n--- Running Suite: ${file} ---`);
        const testSuite = require(path.join(casesDir, file));

        try {
            const results = await testSuite.run();
            summary.total += results.length;

            for (const res of results) {
                const statusIcon = res.status === 'passed' ? '\x1b[32m✔\x1b[0m' : '\x1b[31m✘\x1b[0m';
                const statusText = res.status === 'passed' ? '\x1b[32mPASSED\x1b[0m' : '\x1b[31mFAILED\x1b[0m';

                console.log(`  ${statusIcon} ${res.name.padEnd(50)} [${statusText}] (${res.duration}ms)`);

                if (res.status === 'failed' && res.error) {
                    console.log(`    \x1b[31mDetails: ${res.error}\x1b[0m`);
                }

                if (res.status === 'passed') summary.passed++;
                else summary.failed++;

                // Save to DB
                await TestResult.create({
                    testName: res.name,
                    category: file.split('.')[0],
                    status: res.status,
                    details: res.details,
                    error: res.error,
                    duration: res.duration
                });
            }

            // Save to Output JSON
            const outputFileName = file.replace('.test.js', '-output.json');
            fs.writeFileSync(
                path.join(outputsDir, outputFileName),
                JSON.stringify(results, null, 2)
            );

            summary.results.push({ suite: file, results });
            console.log(`✅ Completed ${file}`);
        } catch (err) {
            console.error(`❌ Error running suite ${file}:`, err.message);
            summary.failed++;
        }
    }

    // Print Final Summary
    console.log('\n' + '='.repeat(30));
    console.log('FINAL TEST SUMMARY');
    console.log('='.repeat(30));
    console.log(`Total Tests:  ${summary.total}`);
    console.log(`Passed:       \x1b[32m${summary.passed}\x1b[0m`);
    console.log(`Failed:       \x1b[31m${summary.failed}\x1b[0m`);
    console.log('='.repeat(30));

    await mongoose.disconnect();
    process.exit(summary.failed > 0 ? 1 : 0);
}

runTests();
