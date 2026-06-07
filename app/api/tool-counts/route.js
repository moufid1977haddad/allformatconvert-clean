import fs from 'fs';
import path from 'path';

export async function GET() {
  const toolsDir = path.join(process.cwd(), 'app', 'tools');
  const counts = {};
  
  fs.readdirSync(toolsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .forEach(dir => {
      const catPath = path.join(toolsDir, dir.name);
      counts[dir.name] = fs.readdirSync(catPath, { withFileTypes: true })
        .filter(d => d.isDirectory()).length;
    });

  return Response.json(counts);
}
