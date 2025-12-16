const fs = require('fs');
const path = require('path');

const conflictingDir = path.join(__dirname, 'views', 'AddListingStepOne');

if (fs.existsSync(conflictingDir)) {
    console.log('Found conflicting directory, removing...');
    
    // Remove directory and all contents
    fs.rmSync(conflictingDir, { recursive: true, force: true });
    
    console.log('Successfully removed conflicting directory');
} else {
    console.log('No conflicting directory found');
}