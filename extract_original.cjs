const fs = require('fs');

try {
    const logPath = 'C:\\\\Users\\\\YCK\\\\.gemini\\\\antigravity\\\\brain\\\\c183fff0-6f71-45c7-946f-f5f7298b4ba9\\\\.system_generated\\\\logs\\\\overview.txt';
    const logContent = fs.readFileSync(logPath, 'utf8');

    // Find the original index.html content
    // We are looking for the content when it was viewed, or when it was generated
    const htmlAnchor = '<!DOCTYPE html>';
    let lastIndex = 0;
    let foundHtml = '';
    
    // Scan all occurrences of <!DOCTYPE html>
    while (true) {
        const startIndex = logContent.indexOf(htmlAnchor, lastIndex);
        if (startIndex === -1) break;
        
        const endIndex = logContent.indexOf('</html>', startIndex);
        if (endIndex !== -1) {
            const possibleHtml = logContent.substring(startIndex, endIndex + 7);
            // If the size is close to ~70KB, it's the full thing!
            if (possibleHtml.length > 50000 && possibleHtml.length < 80000) {
                // If it has 'showNativeChat' or other missing functions, this is the one!
                if (possibleHtml.includes('function showNativeChat')) {
                    foundHtml = possibleHtml;
                    break;
                }
            }
        }
        lastIndex = startIndex + htmlAnchor.length;
    }
    
    // Try to see if maybe the edit was logged so we can reconstruct it
    if (foundHtml) {
        // Strip out any line numbers if it came from view_file tool output
        // "1: <!DOCTYPE html>" -> "<!DOCTYPE html>"
        const lines = foundHtml.split('\\n');
        const cleanLines = lines.map(line => {
             return line.replace(/^\\s*\\d+:\\s/, '');
        });
        const cleanHtml = cleanLines.join('\\n');
        
        fs.writeFileSync('C:\\\\Users\\\\YCK\\\\Desktop\\\\claude\\\\YCK-Agent\\\\src\\\\web\\\\public\\\\index.html', cleanHtml);
        console.log('Restored index.html successfully, length:', cleanHtml.length);
    } else {
        console.log('Could not find full original index.html with showNativeChat in the log');
    }
} catch (e) {
    console.error(e);
}
