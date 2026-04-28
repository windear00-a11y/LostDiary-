import fs from 'fs';
import path from 'path';

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        if (file === 'node_modules' || file === '.next' || file === '.git') return;
        const filePath = path.resolve(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(filePath));
        } else {
            if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.css') || filePath.endsWith('.js')) {
                results.push(filePath);
            }
        }
    });
    return results;
}

const files = walkDir('./');
let count = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let newContent = content
        .replace(/indigo-600/g, 'amber-600')
        .replace(/indigo-500/g, 'amber-500')
        .replace(/indigo-400/g, 'amber-400')
        .replace(/indigo-300/g, 'amber-300')
        .replace(/indigo-200/g, 'amber-200')
        .replace(/indigo-100/g, 'amber-100')
        .replace(/indigo-50/g, 'amber-50')
        .replace(/indigo-900/g, 'amber-900')
        .replace(/indigo-950/g, 'amber-950')
        .replace(/purple-800/g, 'amber-950')
        .replace(/purple-700/g, 'amber-900')
        .replace(/purple-600/g, 'amber-800')
        .replace(/purple-500/g, 'amber-700')
        .replace(/violet-700/g, 'amber-800')
        .replace(/bg-white\s+dark:bg-\[#0a0a0a\]/g, 'glass-surface')
        .replace(/bg-white\s+dark:bg-\[#111\]/g, 'glass-surface bg-black/20')
        .replace(/bg-white\s+dark:bg-\[#121212\]/g, 'glass-surface bg-black/40')
        .replace(/bg-\[#1A1A1A\]/g, 'bg-white/5')
        .replace(/bg-\[#0d0d0d\]/g, 'bg-[var(--color-bg-dark)]')
        // Replacing text
        .replace(/text-slate-900\s+dark:text-white/g, 'text-[var(--color-primary-text-dark)]')
        .replace(/text-slate-800\s+dark:text-slate-200/g, 'text-[var(--color-primary-text-dark)]')
        .replace(/text-slate-600\s+dark:text-slate-400/g, 'text-[var(--color-secondary-text-dark)]')
        .replace(/text-slate-500\s+dark:text-slate-400/g, 'text-[var(--color-secondary-text-dark)]');

    if (content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log('Updated:', file);
        count++;
    }
});

console.log('Total files updated:', count);
