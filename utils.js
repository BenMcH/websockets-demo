import { dirname } from 'path';
import { fileURLToPath } from 'url';

export const __dirname = dirname(fileURLToPath(import.meta.url));

export const adjectives = [
	'Funny',
	'Fuzzy',
	'Big',
	'Squirrley',
	'Fiesty',
	'Gnarly',
	'Wicked',
	'Transformative',
	'Master',
	'Squishy',
	'Small',
	'Clever',
	'Curious',
	'Adventurous',
	'Dangerous',
	'Enchanting',
]

export const nouns = [
	'Dog',
	'Cat',
	'Bird',
	'Cheetah',
	'Snail',
	'Groundhog',
	'Octopus',
	'Whale',
	'Tuna',
	'Salmon',
	'Aligator',
	'Flamingo',
	'Squirrel',
	'Frog',
	'Llama',
	'Bear',
	'Snake',
	'Butterfly',
	'Tortoise',
]

export const randomName = () => {
	return `${random(adjectives)}${random(nouns)}`;
}

export const random = (array) => array[Math.floor(Math.random() * array.length)];
