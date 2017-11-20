'use strict';

const firstletter = require('./dict/firstletter');

function pyfl (str) {
	if(!str || /^ +$/g.test(str)) return '';
		var result = [];
		for(var i=0; i<str.length; i++)
		{
			var unicode = str.charCodeAt(i);
			var ch = str.charAt(i);
			if(unicode >= 19968 && unicode <= 40869)
				ch = firstletter.charAt(unicode-19968);
			result.push(ch);
		}
		return result.join('');
}

module.exports = pyfl