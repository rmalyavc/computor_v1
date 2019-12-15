// 30 - 8 * X^1 - X^1 / 5 +  0   * X^2 - X^1 * 11.2 / 5.6 / X^3 * 3 / 15 * X^2 / 1.12 = 3 * X^0
// 30 - 8 * X^1 - X^1  +  0   * X^2 - X^1 * 11.2 / 5.6 / X^3 * 3 / 15 * X^2 / 1.12 - X^1 * 6 = 3 * X^1 - 5 * X^2 + 100
var g_change = false;

function show_errors(on_submit = false, error = false) {
	let message = document.getElementById('validation_message');
	let input = document.getElementById('input_text');
	let results = document.getElementById('results');
	
	message.innerHTML = error || 'Invalid Format';
	message.classList.remove('hidden');
	results.classList.add('hidden');
	if (on_submit) {
		input.classList.add("field_error");
		setTimeout(() => {
			input.classList.remove("field_error");
		}, 500);
	}
}

function show_result(res) {
	let results = document.getElementById('results');
	let index = results.getElementsByClassName('result_string').length + 1;

	results.classList.remove('hidden');
	results.innerHTML += `<h4 class="result_string hidden" id="result_string_${index}">${res}</h4>`;
	document.getElementById(`result_string_${index}`).classList.remove('hidden');
}

function hide_errors() {
	let message = document.getElementById('validation_message');
	let input = document.getElementById('input_text');

	input.classList.remove("field_error");
	message.classList.add('hidden');
}

function normalize_input(str) {
	let operators = ['+', '-', '*', '/', '='];
	let output = [];
	str = str.replace(/\ /g, '');
	for (let i = 0; i < str.length; i++) {
		if (/(\-|\+|\*|\/|\=)/.test(str[i])) {
			if (str[i - 1] != '^')
				output.push(' ');
			output.push(str[i]);
			if (str[i - 1] && !/(\-|\+|\*|\/|\=)/.test(str[i - 1]) && str[i - 1] != '^')
				output.push(' ');
		}
		else {
			output.push(str[i]);
		}
	}

	return output.join('').split(' ').filter(check_empty).join(' ');
}

function check_empty(el) {
	return el !== '';
}

function clean_regex(str) {
	// console.log("STR\n", str);
	let patterns = [
		{
			pattern: /x/g,
			repl: 'X'
		},
		{
			pattern: /(\ |^)X(\ |$)/g,
			repl: ' X^1 '
		},
		{
			pattern: /\-X/g,
			repl: '-1 * X'
		},
		{
			pattern: /X\^0/g,
			repl: '1'
		},
		{
			pattern: /\ (\*|\/)\ 1 /g,
			repl: ' '
		},
		{
			pattern: /\ (\*|\/)\ 1$/g,
			repl: ''
		},
		{
			pattern: /^1\ \*/g,
			repl: ''
		},
		{
			pattern: / 1\ \*/g,
			repl: ' '
		},
		{
			pattern: /((^| )([^ ])* \* 0( |$))/g,
			repl: ' 0 '
		},
		{
			pattern: /((^| )0 (\*|\/) ([^ ])*( |$))/g,
			repl: ' 0 '
		},
		{
			pattern: /(^|((\+|\-) ))0 \-/g,
			repl: ' - '
		},
		{
			pattern: /(^|((\+|\-) ))0 \+/g,
			repl: ' + '
		},
		{
			pattern: /\- 0$/g,
			repl: ' -'
		},
		{
			pattern: /\+ 0$/g,
			repl: ' +'
		}
	];
	patterns.forEach(el => {
		if (el.pattern.test(str)) {
			g_change = true;
		}
		str = str.trim().replace(el.pattern, el.repl).replace(/[ ]{2,}/g, ' ').trim();
	});
	for (let i = 0; i < patterns.length; i++) {
		if (patterns[i].pattern.test(str)) {
			return (clean_regex(str));
		}
	}
	return (str);
}

function validate_input(str, on_submit = false, count = 0) {
	let pattern = /^[\d|\.|\=|\-|\+| |\*|\/|\^|X|x]*$/;
	let operators = ['*', '/', '+', '-'];
	let parts = false;

	g_change = false;
	hide_errors();
	str = normalize_input(str);
	if (!str || !pattern.test(str)) {
		show_errors(on_submit);
		return false;
	}
	let eq = clean_regex(str);
	if (/\/\ 0(\ |$)/.test(eq)) {
		show_errors(on_submit, `Division by 0 detected! ${eq}`);
		return false;
	}
	if (!(parts = get_parts(eq))) {
		if (on_submit)
			show_errors(on_submit);
		return false;
	}
	else {
		let reduced = reduce_eq(parts);
		if (reduced.join(' ') != parts.join(' '))
			show_result(reduced.join(' '));
		let x_parts = reduce_x(reduced);
		if (x_parts.join(' ') != reduced.join(' '))
			show_result(x_parts.join(' '));
		let tmp = x_parts.join(' ');
		x_parts = clean_regex(x_parts.join(' '));
		if (tmp != x_parts)
			show_result(x_parts);
		if (/\/\ 0(\ |$)/.test(x_parts)) {
			show_errors(on_submit, `Division by 0 detected! ${x_parts}`);
			return false;
		}
		let no_divs = remove_divisions(x_parts.split(' '));
		if (no_divs.join(' ') != x_parts)
			show_result(no_divs.join(' '));
		let final = reduce_final(no_divs.slice(0, no_divs.indexOf('='))).concat(['=', 0]);
		if (final.join(' ') != no_divs.join(' '))
			show_result(final.join(' '));
		console.log(final);
		if (g_change && count < 10)
			return validate_input(final.join(' '), on_submit, ++count);
		console.log(`COUNT = (${count})`);

		show_result('Final reduced form:');
		show_result(final.join(' '));
		return final;
	}
	
}

function reduce_final(parts) {
	let found1 = false;
	let found2 = false;
	let new_parts = [];
	let pow = -1;
	for (let pow = 0; pow < 3; pow++) {
		if ((found1 = get_x_part(parts, pow, 0)) && (found2 = get_x_part(parts, pow, found1.end + 1))) {
			let factor1 = get_x_factor(found1.part);
			let factor2 = get_x_factor(found2.part);
			let op = parts[found2.start - 1];
			if (parts[found1.start - 1] == '-') {
				op = op == '-' ? '+' : '-';
			}
			let res = eval(`${factor1} ${op} ${factor2}`)
			new_parts = parts.slice(0, found1.start);
			new_parts = new_parts.concat(pow == 0 ? [res] : [res, '*', `X^${pow}`]);
			new_parts = new_parts.concat(parts.slice(found1.end, found2.start - 1)).concat(parts.slice(found2.end, parts.length + 1));
			g_change = true;
			return reduce_final(new_parts);
		}
	}
	return parts;
}

function get_x_factor(part) {
	for (let i = 0; i < part.length; i++) {
		if (!isNaN(part[i]))
			return (parseFloat(part[i]));
	}
	return 1;
}

function get_x_part(parts, pow, index) {
	let operators = ['+', '-', '*', '/', '='];
	let start = index;
	for (let i = index; i < parts.length; i++) {
		if (operators.indexOf(parts[i]) === -1 && div_mult_around(parts, i) < 1) {
			let found = -1;
			if (pow == 0) {
				found = parts.slice(start, i + 1).findIndex((el) => {
					return String(el).indexOf('X^') !== -1;
				});
				if (found !== -1) {
					i++;
					start = i + 1;
					continue ;
				}
				else {
					return {
						part: parts.slice(start, i + 1),
						start: start,
						end: i + 1
					}
				}
			}
			else {
				found = parts.slice(start, i + 1).indexOf(`X^${pow}`);
				if (found === -1) {
					i++;
					start = i + 1;
					continue ;
				}
				else {
					return {
						part: parts.slice(start, i + 1),
						start: start,
						end: i + 1
					}
				}
			}
		}
	}
	return false;
}

function remove_divisions(parts) {
	for (let i = 0; i < parts.length; i++) {
		if (parts[i] == '/') {
			g_change = true;
			parts = add_mults(parts, parts[i + 1]);
			parts = clean_regex(reduce_nums(reduce_x(parts)).join(' ')).split(' ');
			return remove_divisions(parts);
		}
		else if (String(parts[i]).indexOf('X^') !== -1) {
			let pow = parseInt(parts[i].substr(2));
			if (pow < 0) {
				pow *= -1;
				g_change = true;
				parts = add_mults(parts, `X^${pow}`);
				parts = clean_regex(reduce_nums(reduce_x(parts)).join(' ')).split(' ');
				return remove_divisions(parts);
			}
		}
	}
	return parts;
}

function add_mults(parts, to_mult) {
	let operators = ['+', '-', '='];
	let new_parts = [];

	for (let i = 0; i < parts.length; i++) {
		new_parts.push(parts[i])
		if (!parts[i + 1] || operators.indexOf(parts[i + 1]) !== -1) {
			new_parts = new_parts.concat(['*', to_mult])
			// break ;
		}
	}
	return new_parts;
}

function reduce_eq(parts) {
	let index = parts.indexOf('=');
	let first_part = reduce_spare(parts.slice(0, index++));
	let second_part = reduce_spare(parts.slice(index, parts.length));
	if (second_part.length > 1 || second_part[0] != 0) {
		for (let i = 0; i < second_part.length; i++) {
			if (i == 0) {
				first_part.push('-');
			}
			if (second_part[i] == '-' || second_part[i] == '+') {
				g_change = true;
				first_part.push(second_part[i] == '-' ? '+' : '-');
			}
			else {
				g_change = true;
				first_part.push(second_part[i]);
			}
		}
	}
	let reduced = reduce_spare(first_part).concat(['=', 0]);

	return reduced;
}

function reduce_nums(parts) {
	let operators = ['*', '/', '+', '-', '='];
	let start = 0;
	let end = 1;
	let new_parts = [];
	let x_part = [];
	let changed = false;

	for (let i = 0; i < parts.length; i++) {
		if (operators.indexOf(parts[i]) === -1 && div_mult_around(parts, i) < 1) {
			end = i + 1;
			x_part = reduce_x_part(parts.slice(start, end));
			new_parts = new_parts.concat(x_part);
			if (parts[++i])
				new_parts.push(parts[i]);
			start = i + 1;
		}
	}
	return new_parts;
}

function reduce_x(parts, found = -1, x_parts = []) {
	let operators = ['+', '-', '='];
	let start = -1;
	let end = -1;
	let changed = false;
	let new_parts = [];
	let x_part = [];

	found = parts.findIndex((el, index) => {
		return index > found && String(el).indexOf('X^') != -1;
	});
	start = found;
	if (found !== -1) {
		for (start = found; start >= 0; start--) {
			if (operators.indexOf(parts[start - 1]) != -1)
				break ;
		}
		for (end = found; end < parts.length; end++) {
			if (operators.indexOf(parts[end]) != -1)
				break ;
		}
		if (start < 0)
			start = 0;
		x_part = reduce_x_part(parts.slice(start, end));
		changed = true;
		parts = new_parts.concat(parts.slice(0, start)).concat(x_part).concat(parts.slice(end, parts.length));
		x_parts.push(parts.slice(start, end).join(' '));
	}
	if (changed)
		return reduce_x(parts, found, x_parts);

	return parts;
}

function reduce_x_part(parts) {
	let to_reduce = {
		'nums': {},
		'vars': {}
	};
	for (let i = 0; i < parts.length; i++) {
		if (!isNaN(parts[i])) {
			to_reduce.nums[i] = parts[i];
		}
		else if (String(parts[i]).indexOf('X^') != -1) {
			to_reduce.vars[i] = parts[i];
		}
	}
	let n_keys = Object.keys(to_reduce.nums);
	let x_keys = Object.keys(to_reduce.vars);
	for (let i = 0; i < n_keys.length; i++) {
		let key = n_keys[i];
		let prev_key = n_keys[i - 1];
		let val = to_reduce.nums[key];
		if (i > 0) {
			let op = parts[key - 1];
			if (parts[n_keys[0] - 1] == '/') {
				op = op == '/' ? '*' : '/';
			}
			let nb1 = parseFloat(parts[n_keys[0]]);
			let nb2 = parseFloat(parts[key]);
			if (op != '/' || nb2 != 0) {
				parts[n_keys[0]] = eval(`${nb1} ${op} ${nb2}`);
				parts[key] = '';
				parts[key - 1] = '';
				g_change = true;
			}
		}
	}
	for (let i = 0; i < x_keys.length; i++) {
		let key = x_keys[i];
		let val = to_reduce.vars[key];
		if (i > 0) {
			let op = parts[key - 1] == '*' ? '+' : '-';
			if (parts[x_keys[0] - 1] == '/') {
				op = op == '-' ? '+' : '-';
			}
			let nb1 = parseInt(parts[x_keys[0]].replace('X^', ''));
			let nb2 = parseInt(to_reduce.vars[key].replace('X^', ''));
			parts[x_keys[0]] = 'X^' + eval(`${nb1} ${op} ${nb2}`);
			parts[key] = '';
			parts[key - 1] = '';
			g_change = true;
		}
	}
	parts = clean_regex(parts.join(' ')).split(' ');
	parts = reduce_spare(parts);
	return parts;
}

function reduce_spare(parts) {
	let reduced = [];
	let changed = false;
	for (let i = 0; i < parts.length; i++) {
		if (parts[i] === '') {
			changed = true;
			continue ;
		}
		else if (!isNaN(parts[i]) && !div_mult_around(parts, i)) {
			let found = parts.findIndex((el, index) => {
				return (el !== '' && !isNaN(el) && index != i && !div_mult_around(parts, index));
			});
			if (found != -1) {
				if (found > i && parts[found - 1] != '=') {
				changed = true;
					let op = parts[found - 1];
					reduced.push(eval(`${parts[i]} ${op} ${parts[found]}`));
					parts[found] = '';
					parts[found - 1] = '';
				}
			}
			else
				reduced.push(parts[i]);
		}
		else {
			reduced.push(parts[i]);
		}
	}
	if (changed) {
		return reduce_spare(reduced);
	}
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
	console.log(parts);
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
		console.log(part, nb);
		// if (nb >= 0)
			return `X^${nb}`;
	}
	else if (!isNaN(part)) {
		return parseFloat(part);
	}
	return false;
}

function on_keyup(event){
	// console.log(g_change);
	let input = document.getElementById('input_text');
	if (event.keyCode == 13)
		solve_eq();
	else
		validate_input(input.value);
}


function solve_eq() {
	let input = document.getElementById('input_text');
	let parts = false;
	let found = false;
	let results = [];
	let a = 0;
	let b = 0;
	let c = 0;

	document.getElementById('results').innerHTML = '<h2>Results:</h2>';
	if (!(parts = validate_input(input.value, true))) {
		console.log('Validation is not passed');
		return results;
	}
	if ((found = get_x_part(parts, 2, 0))) {
		a = get_x_factor(found.part);
		if (parts[found.start - 1] == '-')
			a *= -1;
	}
	if ((found = get_x_part(parts, 1, 0))) {
		b = get_x_factor(found.part);
		if (parts[found.start - 1] == '-')
			b *= -1;
	}
	if ((found = get_x_part(parts, 0, 0))) {
		c = get_x_factor(found.part);
		if (parts[found.start - 1] == '-')
			c *= -1;
	}
	let degree = get_degree(parts);
	show_result(`Polynomial degree: ${degree}`);
	if (degree < 0 || degree > 2) {
		let message_part = degree < 0 ? 'less than 0' : 'greater than 2';
		show_result(`The polynomial degree is stricly ${message_part}, I can't solve.`);
		return false;
	}
	if (a != 0) {
		let discr = b * b - 4 * a * c;
		if (discr == 0) {
			results.push(b * -1 / 2 * a);
		}
		else if (discr > 0) {
			results.push(((b * -1) + Math.sqrt(discr)) / (2 * a));
			results.push(((b * -1) - Math.sqrt(discr)) / (2 * a));
		}
	}
	else if (b != 0) {
		let found1 = get_x_part(parts, 0, 0); 
		let found2 = get_x_part(parts, 1, 0);
		b = get_x_factor(found2.part);
		c = get_x_factor(found1.part);
		if (parts[found2.start - 1] == '-')
			b *= -1;
		if (found1 && parts[found1.start - 1] != '-')
			c *= -1;
		results.push(c / b);
	}
	else if (c == 0) {
		results.push('Any real number');
	}
	if (!results.length) {
		show_result('The equation has no solution');
	}
	else {
		show_result(results.length == 1 ? 'The solution is:' : 'The solutions are:');
		results.forEach((el) => {
			show_result(el);
		});
		// show_result('The equation has no solution');
	}
	console.log('RESULTS!!!', results);
	// return results;
}

function get_degree(parts) {
	// console.log(parts);
	let degree = 0;
	for (let i = 0; i < parts.length; i++) {
		if (String(parts[i]).indexOf('X^') !== -1) {
			let pow = parseInt(parts[i].substr(2, 4));
			if (pow < 0)
				return pow;
			else if (pow > degree)
				degree = pow;
		}
	}
	return degree;
}
