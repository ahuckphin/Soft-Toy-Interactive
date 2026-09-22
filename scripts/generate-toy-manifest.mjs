// scripts/generate-toy-manifest.mjs
import { readdir, writeFile } from 'node:fs/promises';

const directory = 'assets/toys';
const files = (await readdir(directory))
  .filter((file) => /\.(png|jpe?g|webp|gif)$/i.test(file));

const toys = files.map((file) => {
  const slug = file.replace(/\.[^.]+$/, '');
  const name = slug
    .split('-')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');

  return {
    name,
    detail: '',
    image: `${directory}/${file}`
  };
});

await writeFile('data/toys.json', JSON.stringify(toys, null, 2));