import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function TempRemover() {
  const folderPath = path.join(__dirname, '../tmp'); // Specify the absolute path to the "temp" folder

  try {
    if (fs.existsSync(folderPath)) {
      // Check if the folder exists
      await fs.promises.rm(folderPath, { recursive: true }); // Recursively delete the folder and its contents
      console.log(`Folder "${folderPath}" has been deleted.`);
    } else {
      console.log(`Folder "${folderPath}" does not exist.`);
    }
  } catch (err) {
    console.error(`Error deleting folder "${folderPath}": ${err.message}`);
  }
}

export default TempRemover;
