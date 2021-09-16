export function tagDataMap(): Map<string, string[]> {
	let map = new Map();

	map.set(
		'assign',
		[
			'Assign tag is used to assign a value to a variable.\n\n',
			'When you assign a value to a variable, you will create a string.'
		]
	);
	map.set(
		'if',
		[
			'The if statement checks whether a condition is true or false.\n\n',
			'If the condition is true, the code within the if statement gets executed.'
		]
	);

	return map;
}