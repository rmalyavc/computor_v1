function show_errors(on_submit = false) {
	let message = document.getElementById('validation_message');
	let input = document.getElementById('input_text');

	message.classList.remove('hidden');
	if (on_submit) {
		input.classList.add("field_error");
		setTimeout(() => {
			input.classList.remove("field_error");
		}, 500);
	}
}

function hide_errors() {
	let message = document.getElementById('validation_message');
	let input = document.getElementById('input_text');

	input.classList.remove("field_error");
	message.classList.add('hidden');
}

function validate_input(on_submit = false) {
	let input = document.getElementById('input_text');
	let pattern = /^[\d|\.|\=|\-|\+| |\*|\/|\^|X|x]*$/;
	let operators = ['*', '/', '+', '-'];
	let parts = false;

	hide_errors();
	if (!input || !input.value || !pattern.test(input.value)) {
		show_errors(on_submit);
		return false;
	}
	else if (!(parts = get_parts(input.value))) {
		if (on_submit)
			show_errors(on_submit);
		return false;
	}
	else {
		let reduced = reduce_eq(parts);
		console.log(reduced.join(' '));
	}
}

function reduce_eq(parts) {
	let index = parts.indexOf('=');
	let first_part = reduce_spare(parts.slice(0, index++));
	let second_part = reduce_spare(parts.slice(index, parts.length));
	let len = 1;
	for (let i = second_part.length - 1; i >= 0; i--) {
		if (second_part[i] == '-' || second_part[i] == '+') {
			first_part.push(second_part[i] == '-' ? '+' : '-');
			len = 1;
		}
		else if (isNaN(second_part[i])) {
			len++;
		}
		else if ((i > 1 && (second_part[i - 1] == '+' || second_part[i - 1] == '-')) || i == 0) {
			let op = (i == 0 || second_part[i - 1] == '+') ? '-' : '+';
			first_part.push(op);
			first_part = first_part.concat(second_part.slice(i, i + len));
			i--;
			len = 1;
		}
	}
	let reduced = reduce_spare(first_part).concat(['=', 0]);

	return reduced;
	// console.log(reduced);
}

function reduce_spare(parts) {
	let reduced = [];
	let changed = false;
	console.log(parts);
	for (let i = 0; i < parts.length; i++) {
		if (parts[i] === '') {
			changed = true;
			continue ;
		}
		else if (parts[i] == 'X^0') {
			reduced.push(1);
			changed = true;
		}
		else if (i < parts.length - 2 && parts[i + 1] == '*' && (parts[i] === 0 || parts[i + 2] === 0)) {
			reduced.push(0);
			changed = true;
			i += 2;
		}
		else if (i < parts.length - 2 && (parts[i + 1] == '*' || parts[i + 1] == '/') && !isNaN(parts[i]) && !isNaN(parts[i + 2])) {
			reduced.push(eval(`${parts[i]}${parts[i + 1]}${parts[i + 2]}`));
			changed = true;
			i += 2;
		}
		else if (i < parts.length - 2 && (parts[i + 1] == '*' || (parts[i + 1] == '/' && parts[i + 2] == 1)) && (parts[i] == 1 || parts[i + 2] == 1)) {
			let to_push = parts[i] == 1 ? parts[i + 2] : parts[i];
			if (to_push == 'X^0')
				to_push = 1;
			reduced.push(to_push);
			changed = true;
			i += 2;
		}
		else if (i < parts.length - 2 && (parts[i + 1] == '*' || parts[i + 1] == '/') && isNaN(parts[i]) && isNaN(parts[i + 2]) &&
				parts[i].indexOf('X^') == 0 && parts[i + 2].indexOf('X^') == 0) {
			let op = parts[i + 1] == '*' ? '+' : '-';
			let nb1 = parseInt(parts[i].substr(2, parts[i].length));
			let nb2 = parseInt(parts[i + 2].substr(2, parts[i + 2].length));
			reduced.push('X^' + eval(`${nb1}${op}${nb2}`));
			changed = true;
			i += 2;
		}
		else if (!isNaN(parts[i]) && !div_mult_around(parts, i)) {
			let found = parts.findIndex((el, index) => {
				return (el !== '' && !isNaN(el) && index != i && !div_mult_around(parts, index));
			});
			if (found != -1) {
				console.log(`CURRENT = (${parts[i]}) FOUND = (${parts[found]})`, parts);
				changed = true;
				if (found > i) {
					reduced.push(eval(`${parts[i]}${parts[found - 1]}${parts[found]}`));
					parts[found] = '';
					parts[found - 1] = '';
					if (found + 1 < parts.length)
						parts[found + 1] = '';
				}
			}
			else
				reduced.push(parts[i]);
		}
		// else if (isNaN(parts[i]) && parts[i].indexOf('X^') != -1) {
		// 	let div_mults = div_mult_around(parts, i);
		// 	let mults = mult_around(parts, i);

		// 	if (div_mults == 2 && parts[i - 1] == '*') {
		// 		reduced[reduced.length - 2] = eval(`${reduced[reduced.length - 2]}${parts[i + 1]}${parts[i + 2]}`);
		// 		parts[i + 2] = 1;
		// 		changed = true;
		// 		i += 2;
		// 	}
		// 	else {
		// 		let found = parts[i].findIndex((el, index) => {
		// 			return (el == parts[i] && i != index && div_mult_around(parts, index) != 0 && div_mult_around(parts, index) != 2); 
		// 		});
		// 		if (found != -1) {
		// 			changed = true;
		// 			let factor1 = 1;
		// 			if (mults == -1)
		// 				factor1 = parts[i - 2];
		// 			else if (mults == 1)
		// 				factor1 = parts[i + 2];
		// 		}
		// 	}
		// }
		else {
			reduced.push(parts[i]);
		}
	}
	// if (reduced.join(' ').indexOf('* 1 ') != -1 || reduced.join(' ').indexOf(' 1 * ') != -1 ||
	// 	reduced.join(' ').indexOf('* 1') == reduced.join(' ').length - 3 ||
	// 	reduced.join(' ').indexOf('1 *') == 0) {
		
	// 	return reduce_spare(reduced);	
	// }
	if (changed)
		return reduce_spare(reduced);
	else
		return reduced;
}

function div_mult_around(arr, i) {
	if ((arr[i - 1] == '*' || arr[i - 1] == '/') && (arr[i + 1] == '*' || arr[i + 1] == '/'))
		return 2;
	else if (arr[i - 1] == '*' || arr[i - 1] == '/')
		return -1;
	else if (arr[i + 1] == '*' || arr[i + 1] == '/')
		return 1;
	else
		return 0;
}
function mult_around(arr, i) {
	if (arr[i - 1] == '*' && arr[i + 1] == '*')
		return 2;
	else if (arr[i - 1] == '*')
		return -1;
	else if (arr[i + 1] == '*')
		return 1;
	else
		return 0;
}
// "5 - 6 / x * 5x = 2"
function get_parts(str) {
	str = str.toUpperCase();
	let parts = str.split(' ');
	if (parts.indexOf('=') < 1 || parts.indexOf('=') != parts.lastIndexOf('=') || parts.length < 3) {
		return false;
	}
	for (let i = 0; i < parts.length; i++) {
		let part = validate_part(parts[i].replace(' ', ''));
		if (part === false) {
			return false;
		}
		parts[i] = part;
	}
	return parts;
}

function validate_part(part) {
	let operators = ['*', '/', '+', '-', '='];

	if (operators.indexOf(part) !== -1 || part === '')
		return part;
	else if (part.indexOf('X^') == 0 && part.indexOf('.') == -1) {
		let nb = parseInt(part.substr(2, part.length));
		if (nb >= 0 && nb <= 2)
			return `X^${nb}`;
	}
	else if (!isNaN(part)) {
		return parseFloat(part);
	}
	else
		return false;
}

function on_keyup(event){
	if (event.keyCode == 13)
		solve_eq();
	else
		validate_input();
}

function solve_eq() {
	let parts = false;
	if (!(parts = validate_input(true)))
		return ;
}