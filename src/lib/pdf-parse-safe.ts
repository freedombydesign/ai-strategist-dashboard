// Safe wrapper for pdf-parse that prevents debug mode execution
export async function safePdfParse(buffer: Buffer) {
  try {
    // Temporarily set module.parent to trick the debug detection
    const originalModule = require.main;
    if (originalModule) {
      // Create a fake parent to prevent debug mode
      (originalModule as any).parent = {};
    }
    
    const pdfParse = require('pdf-parse');
    const result = await pdfParse(buffer);
    
    // Restore original state
    if (originalModule) {
      delete (originalModule as any).parent;
    }
    
    return result;
  } catch (error) {
    throw error;
  }
}