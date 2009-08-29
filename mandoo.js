var mandoo = function (s, c) { return new u.Start(s, c) };

(function (u) {
u.version = 1;

/* Mandoo JavaScript Library
 * Copyright (c) 2009 Evandro Myller (emyller.net)
 * Mandoo is licensed under the LGPL license.
 *
 * Visit mandoojs.com for more information.
 */

u.Start = function (sel, context) {
	if (sel && sel.__mandoo)
		return sel;

	else if (!sel)
		return;

	// set the default context to the document object
	context = context || document;

	// handles css selector strings
	if (typeof sel == 'string') {
		context = u(context)[0];
		if (!context)
			return;
		Array.prototype.push.apply(this, u.grab(sel, context));
	} else {
		// handles DOM elements
		sel.nodeType && (this[0] = sel) && (this.length = 1)
		||
		// handles collections
		sel.length !== undefined &&
			Array.prototype.push.apply(this, sel instanceof Array? sel : u.array(sel));
	}
};

u.create = function (sel, text, attrs) {
//>> creates a new DOM element
	// if it's already an mandoo object, return itself
	if (sel.__mandoo)
		return sel;

	else
	// if it's a DOM node, return it in a new mandoo object
	if (sel.nodeType)
		return u(sel);

	// creates a text node, if selector is empty
	if (sel == '')
		return u(document.createTextNode(text || ''));

	attrs = attrs || {};
	var el,
	// parses the css selector
	type, step; while (sel) {
		type = sel.charAt(0);
		step = u.grab.selectors.match[
			type = type == '#'? 'ID' :
			type == '.'? 'CLASS' :
			type == '['? 'ATTR' :
   'TAG'
		].exec(sel);
		// removes the processed part
		sel = sel.slice(step[0].length);

		// handles the new element
		type == 'TAG'?
			el = u(document.createElement(step[1])) :
		type == 'ID'?
			attrs.id = step[1] :
		type == 'CLASS'?
			el.addClass(step[1]) :
		//type == 'ATTR'?
			attrs[step[1]] = step[4];
	}

	// adds the attributes
	el.attr(attrs);

	// add text
	el.text(text);

	return el;
};

u.append = function (sel, text, attrs) {
	return u(document.getElementsByTagName('body')[0] || document).append(
		u.create(sel, text, attrs)
	);
};

u.Start.prototype = u.methods = {
	// indicates that this object is an mandoo set
	__mandoo: true,

	// trick: make the object available for native Array's methods
	length: 0,

	merge: function () {
	//>> merges mandoo sets into the current one
		for (var i = -1; arguments[++i];)
			this.push.apply(this, u.array(u(arguments[i])));
		return u.clean(this);
	},

	push: function () {
		Array.prototype.push.apply(this, Array.prototype.slice.call(arguments));
		return this;
	},

	splice: function (index, n) {
		var l = this.length,
			s = u(Array.prototype.splice.apply(this, Array.prototype.slice.call(arguments)));

		// the applied .splice doesn't really remove items from the custom object
		for (var i = l; i > l - n + (arguments.length - 3); i--)
			delete this[i];

		return s;
	},

	each: function (fn) {
	//>> executes 'fn' for each item in the mandoo object
		for (var i = -1; this[++i];)
			fn.call(this[i], i);
		return this;
	},

	has: function (els) {
		els = u(els);
		for (var i = -1; els[++i];) if (u.index(this, els[i]) < 0)
			return false;
		return true;
	},

	hasClass: function (cls) {
	//>> checks if the elements have a class name
		cls = cls.split(/\s+/);
		for (var i = -1; this[++i];)
			for (var j = -1; cls[++j];)
			if ((' '+this[i].className+' ').indexOf(' '+cls[j]+' ') < 0)
				return false;
		return true;
	},

	addClass: function (cls, overwrite) {
	//>> adds class names
		cls = cls.split(/\s+/);
		for (var i = -1; this[++i];) {
			if (overwrite) this[i].className = '';

			for (var j = -1; cls[++j];)
			if ((' '+this[i].className+' ').indexOf(' '+cls[j]+' ') < 0)
				this[i].className += (this[i].className ? ' ' : '') + cls[j];
		}
		return this;
	},

	rmClass: function (cls) {
	//>> removes class names
		var cls = cls.split(/\s+/);
		for (var i = -1; this[++i];)
			for (var j = -1; cls[++j];)
				this[i].className = u.clean((' '+this[i].className+' ')
				                    .replace(' '+cls[j]+' ', ' '));
		return this;
	},

	is: function (sel) {
	//>> check if this element match the criteria
		return sel && u.grab.filter(sel, this).length == this.length;
	},

	not: function (sel) {
	//>> check if this element doesn't match the criteria
		return !this.is(sel);
	},

	isChildOf: function (el)
	{
		el = u(el)[0];

		main:
		for (var i = -1, is = 0, node; node = this[++i];)
		{
			while (node = node.parentNode)
			if (node == el)
			{
				is = 1;
				continue main;
			}
			else if (!node)
			{
				is = 0;
				break main;
			}
			is = 0;
		}

		return !!is;
	},

	filter: function (sel) {
	//>> performs an element filtering
		return u(u.grab.matches(sel, this));
	},

	children: function (crit) {
	//>> looks for the children
		for (var i = -1, els = u(); this[++i];)
			els.merge(u.grab.filter(crit || '*', this[i].childNodes));

		return els;
	},

	neighbors: function (sel) {
	//>> grab all the neighbor elements
		for (var i = -1, els = u(); this[++i];)
			els.merge(u(this[i].parentNode).children(sel));

		els = u.clean(els);

		for (var i = -1; this[++i];)
			for (var j = -1; els[++j];) if (this[i] == els[j])
				els.splice(j, 1);

		return els;
	},

	all: function (sel) {
	//>> gets all elements inside the current
		for (var i = -1, els = u(); this[++i];)
			els.merge(u(sel || '*', this[i]));
		return u.clean(els);
	},

	nav: function (direction, crit) {
	//>> walks dinamically in the DOM tree
		crit = crit || 1;

		for (var i = -1, els = u(); this[++i];)
		{
			var el = this[i],
				walk = 0;

			typeof crit == 'string' && (crit = u.grab(crit));

			do {
				(el =
					direction == 'prev' ? el.previousSibling :
					direction == 'next' ? el.nextSibling :
					direction == 'up' ? el.parentNode :
					direction == 'down' ? u(':first', el)[0] :
					direction == 'first' ? (!walk ? u(':first', el)[0] : el.nextSibling) :
					direction == 'last' ? (!walk ? u(':last', el)[0] : el.previousSibling) :
				null) && el.nodeType != 3 && walk++;
			} while (
				el && (crit?
					// walk by limit number
					typeof crit == 'number'? walk < crit :
					// walk till find an element type
					u.index(crit, el) < 0 :
					// or just go to the nearest element
					el.nodeType == 1)
			);

			el && els.push(el);
		}

		return u.clean(els);
	},

	// shorcuts to .nav()
	prev: function (crit) {
		return this.nav('prev', crit);
	},

	next: function (crit) {
		return this.nav('next', crit);
	},

	up: function (crit) {
		return this.nav('up', crit);
	},

	down: function (crit) {
		return this.nav('down', crit);
	},

	first: function (crit) {
		return this.nav('first', crit);
	},

	last: function (crit) {
		return this.nav('last', crit);
	},

	clone: function (deep) {
		for (var i = -1, els = u(); this[++i];)
			els.push(u.clone(this[i], deep));

		return els;
	},

	append: function (sel, text, attrs) {
	//>> appends elements into existing ones
		for (var i = -1, all = u(), els; this[++i];)
		{
			all.merge(els = u.create(sel, text, attrs).remove());

			for (var i2 = -1, els; els[++i2];)
				this[i].appendChild(els[i2]);
		}
		return els;
	},

	prepend: function (sel, text, attrs) {
	//>> prepends elements into existing ones
		for (var i = -1, all = u(), els; this[++i];)
		{
			all.merge(els = u.create(sel, text, attrs).remove());

			for (var i2 = -1; els[++i2];)
			{
				this[i].firstChild ?
					this[i].insertBefore(els[i2], this[i].firstChild) :
					this[i].appendChild(els[i2]);
			}
		}
		return all;
	},

	add: function (sel, text, attrs) {
	//>> appends elements into existing ones and stay in their parent
		this.append(sel, text, attrs);
		return this;
	},

	appendTo: function (obj) {
	//>> appends created elements to existing ones
		u(obj).append(this);
		return this;
	},

	before: function (sel, text, attrs) {
	//>> inserts elements before another one
		for (var i = -1, all = u(), els; this[++i];)
		{
			all.merge(els = u.create(sel, text, attrs).remove());

			for (var i2 = -1; els[++i2];)
				this[i].parentNode.insertBefore(els[i2], this[i]);
		}
		return all;
	},

	after: function (sel, text, attrs) {
	//>> inserts elements after another one
		for (var i = -1, all = u(), els; this[++i];)
		{
			all.merge(els = u.create(sel, text, attrs).remove());

			for (var i2 = -1; els[++i2];)
			this[i].nextSibling ?
				this[i].parentNode.insertBefore(els[i2], this[i].nextSibling) :
				this[i].parentNode.appendChild(els[i2]);
		}
		return all;
	},

	attr: function (name, value, style) {
		var attrs = name;
	//>> gets an attribute
		if (typeof name == 'string') {
			name = u.support.attrName(name);
			if (value === undefined)
				return (
					// returns the opacity
					name == 'opacity' ?
						u.gfx.opacity(this[0]) :
					// or other style attribute
					style ?
						this[0].style[name] ||
						(this[0].currentStyle ?
							this[0].currentStyle[name] :
							this[0].ownerDocument.defaultView.getComputedStyle(this[0], null)[name]) :
						this[0].getAttribute(name) || this[0][name]
				);
			else {
				attrs = {};
				attrs[name] = value;
			}
		}
	//>> sets attributes
		for (var i = -1; this[++i];) for (var name in attrs)
		// set css properties
		style?
			this[i].style[u.support.attrName(name)] =
				// sets opacity
				name == 'opacity'? u.gfx.opacity(this[i], attrs[name]) :
				(typeof attrs[name] == 'number' && !(!name.indexOf('zoom') || !name.indexOf('index')))?
				// handles numbers
					Math.floor(attrs[name]) + 'px' :
				// or any other value
					attrs[name] :
			// set common attributes
			this[i].setAttribute(u.support.attrName(name), attrs[name]);
		return this;
	},

	css: function (name, value) {
	//>> gets/sets style attributes
		return this.attr(name, value, true);
	},

	focus: function () {
		this[0] && this[0].focus(); return this;
	},

	empty: function () {
	//>> removes every child node
		for (var i = -1; this[++i];) {
			while (this[i].firstChild)
				this[i].removeChild(this[i].firstChild);
		}
		return this;
	},

	text: function (text, add) {
	//>> gets text content
		if (text === undefined && this[0])
			return this[0].textContent || this[0].innerText || this[0].text;

	//>> sets text content
		if (!add)
			this.empty();

		for (var i = -1; this[++i];) {
			u.support.ua.ie && this[i].nodeName == "SCRIPT" ?
				this[i].text = text :
				this[i].appendChild(this[i].ownerDocument.createTextNode('' + text));
		}

		return this;
	},

	val: function (val, add) {
	//>> gets value attribute
		if (val === undefined && this[0])
			return this[0].value;
		else {
	//>> sets value attribute
			for (var i = -1; this[++i];) {
				if (!add)
					this[i].value = '';
				this[i].value += '' + val;
			}
			return this;
		}
	},

	serialize: function () {
	//>> gets the values of all the input elements
		var data = {};
		for (var i = -1; this[++i];) {
			var inputs = u(':input', this[i]);
			for (var i2 = -1; inputs[++i2];) {
				var input = u(inputs[i2]),
					id = input.attr('id') || input.attr('name');
				id && (data[id] = input.val());
			}
		}
		return data;
	},

	remove: function (perm) {
	//>> removes elements from DOM tree and/or from the memory
		for (var i = -1; this[++i];) {
			this[i].parentNode && this[i].parentNode.removeChild(this[i]);
			if (perm) {
				delete this[i];
				this.length--;
			}
		}
		return this;
	},

	// shortcuts to events
	listen: function (type, handler, bubble) {
		return u.event.add(this, type, handler, bubble);
	},

	unlisten: function (type, handler, bubble) {
		return u.event.remove(this, type, handler, bubble);
	},

	fire: function (type, handler, event) {
		return u.event.fire(this, type, handler, event);
	},

	pos: function (coords) {
	//>> handles positions
		if (coords === undefined) {
		// get
			var el = this[0],
			    pos = { left:0, right: el.offsetWidth, top: 0, bottom: el.offsetHeight  };
			while (el.offsetParent) {
				// adds values to the new offset
				pos.left += el.offsetLeft;
				pos.right += el.offsetLeft;
				pos.top += el.offsetTop;
				pos.bottom += el.offsetTop;

				// goes up to the parent offset
				el = el.offsetParent;
			}
			return pos;
		} else {
		// set
			arguments[1] != undefined && (coords = Array.prototype.slice.call(arguments));

			if (typeof coords == 'string') {
				coords = coords.split(/s+/);
				if (coords.length < 2)
					coords[1] = coords[0];
			} else
				coords = [
					coords.left || coords[0] || 0,
					coords.top  || coords[1] || 0
				];

			var viewportSize = u.size(true),
			    evalpos = function (pos, size, x) {
					return (
						pos == 'center' && x && viewportSize.width / 2 - size.width / 2 ||
						pos == 'center' && viewportSize.height / 2 - size.height / 2 ||
						pos == 'right' && viewportSize.width - size.width ||
						pos == 'bottom' && viewportSize.height - size.height
					);
				};

			for (var i = -1, size; this[++i];) {
				size = u.size(this[i]);
				u(this[i]).css({
					left:
					typeof coords[0] == 'number'?
						coords[0] :
						eval(coords[0].replace(/[a-z]+/g, function (pos) { return evalpos(pos, size, 1) })),
					top:
					typeof coords[1] == 'number'?
						coords[1] :
						eval(coords[1].replace(/[a-z]+/g, function (pos) { return evalpos(pos, size) }))
				});
			}
			return this;
		}
	},

	size: function (scrolls)
	{
		return u.size(this, scrolls);
	}
};

u.extend = function (obj, data) {
//>> extends some object
	for (var key in data) if (data.hasOwnProperty(key))
		obj[key] = data[key];
	return obj;
};

u.Class = function (inherit, data) {
// Class abstraction support
	!data && (data = inherit) && (inherit = undefined);

	// the "class" itself (constructor)
	var cls = data.__construct = typeof data.__construct == 'function' ?
		data.__construct : function () {};

	// set the constructor property
	cls.prototype.constructor = cls;

	// inheritance
	inherit && (cls.prototype = new inherit) && (cls.prototype.__parent = inherit);

	// adds defined stuff
	for (var key in data)
		// static
		if (!key.indexOf('__'))
			cls[key.slice(2)] = data[key];
		// dynamic
		else
			cls.prototype[key] = data[key];

	cls.__construct = cls;
	cls.__extend = function (data) {
		u.extend(this.prototype, data);
		return this;
	};

	return cls;
};


u.Request = u.Class({
	__construct: function (url, options, data) {
		// handles options
		options = this.options = u.extend({
			async: true,
			cache: false,
			method: 'GET'
		}, options || {});
		options.method = options.method.toUpperCase();
		if (options.method == 'JSON') {
			options.json = true;
			options.method = 'GET';
		}

		this.data = data;

		// handles data parameters
		if (typeof data != 'string') {
			var params = [];
			for (var key in data)
				params.push(key + '=' + encodeURIComponent(data[key]));
			data = params.join('&');
		}

		// the xhr object
		var xhr = this.XMLHttpRequest = u.Request.create();

		url += data && options.method == 'GET'? '?' + data : '';
		this.url = url;

		// open the socket
		options.username ?
			xhr.open(options.method, url, options.async, options.username, options.password) :
			xhr.open(options.method, url, options.async);

		// disables cache
		!options.cache &&
			this.header('If-Modified-Since', 'Wed, 01 Jan 1997 00:00:00 GMT');

		// special header for POST requests
		options.method == 'POST' &&
			this.header('Content-Type', 'application/x-www-form-urlencoded');

		xhr.send(options.method == 'POST' ? data : null);

		// creates a pointer to the instance so that we can use it in internal scopes
		var _this = this;

		// handles the request process
		options.async ?
			xhr.onreadystatechange = function () { _this.handle(); } :
			this.handle();
	},

	handle: function ()
	{
		var xhr = this.XMLHttpRequest,
			o = this.options;

		o.async && u.event.fire(xhr, 'readystatechange');

		if (!o.async || xhr.readyState == 4) {
			this.text = xhr.responseText;
			this.xml = xhr.responseXML;
			this.json = null;
			if (o.json || !this.text.indexOf('[') || !this.text.indexOf('{')) try {
				this.json = eval('('+(this.text || [])+')');
			} catch (e) {}

			this.failure = !(xhr.status == 200 || xhr.status == 304);

			// callbacks
			!this.failure ?
				u.event.fire(this, 'success') :
				u.event.fire(this, 'failure');
			u.event.fire(this, 'finish');
		}
	},

	abort: function () {
		delete this.XMLHttpRequest.onreadystatechange;
		this.XMLHttpRequest.abort();
		return this;
	},

	header: function (h, v) {
		if (v)
		{
			this.XMLHttpRequest.setRequestHeader(h, v);
			return this;
		}
		else
			return this.XMLHttpRequest.getResponseHeader(h);
	},

	__create: function () {
		return window.ActiveXObject ? new ActiveXObject("Microsoft.XMLHTTP") : new XMLHttpRequest;
	},

	__common: function (url, opt, type, data) {
		var fn;

		typeof opt == 'function' &&
			(fn = opt) && (opt = {}) ||
		typeof opt == 'boolean' &&
			(opt = { async: opt });

		opt = opt || {};
		opt.method = type;

		// do the request
		var req = new u.Request(url, opt, data);

		fn && req.onfinish(function () {
			fn.call(this, type == 'json'? this.json : this.text);
		});

		return req;
	}
});

u.get = function (url, opt, data) {
	return u.Request.common(url, opt, 'get', data);
};
u.getJSON = function (url, opt, data) {
	return u.Request.common(url, opt, 'json', data);
};
u.post = function (url, data, opt) {
	return u.Request.common(url, opt, 'post', data);
};
u.load = function (url) {
	var r = u.get(url, false),
	    ok = !r.failure;
	return !!(ok && u.append('script[type=text/javascript]', r.text).remove());
};

// adds event shortcuts
'failure,finish,readystatechange,success'
.replace(/\w+/g, function (type) {
	u.Request.prototype['on' + type] = function (fn) {
		return u.event.add(this, type, fn)[0];
	}
});


/********************
 * mandoo module system
 ********************/
u.file = function (url) {
//>> loads and provide data about a file
	var req = u.get(url, false);
	req.failure && u.error('unable to open file.');

	return {
		modified: req.header('Last-Modified'),
		name: u.fileName(url),
		path: u.fileDir(url),
		size: req.text.length,
		text: req.text,
		type: req.header('Content-Type'),
		xml: req.xml
	};
};

u.fileName = function (str) {
//>> (string) extracts the filename from a path
	return str.slice(str.lastIndexOf('/') + 1);
};

u.fileDir = function (str) {
//>> (string) removes the filename from a path
	return str.slice(0, str.lastIndexOf('/') + 1);
};

u.path = (function () {
//>> just finds where is the mandoo core script
	var all = document.getElementsByTagName('script'),
	i = all.length; while (i--) if (all[i].src.indexOf('mandoo') >= 0)
		return u.fileDir(all[i].src);

	return '';
})();

// collection of loaded modules
u.modules = {};

u.require = function () {
//>> loads an mandoo module
	for (var i = -1; arguments[++i];) {
		// cancels
		if (u.modules[arguments[i]])
			continue;

		try
		{
			u.append('script[type=text/javascript]', u.file(u.path+'plugins/'+arguments[i]+'/module.js').text).remove();
		}
		catch(e)
		{
			u.error('module "'+arguments[i]+'" not found.');
		}
	}
	return mandoo;
};

u.mod = function (info, deps, core, methods)
{//>> adds a module to the mandoo core
	if (typeof info == 'string')
		return u.modules[name] || null;

	else {
		// adds a new module
		u.modules[info.name] = info;

		// adds the stylesheet
		u.get(u.path+'plugins/'+info.name+'/media/s.css').onsuccess(function ()
		{
			u('head').append('link#mandoo-'+info.name+'-style', undefined, {
				rel: 'stylesheet', type: 'text/css', href: this.url
			});
		});

		// adds the necessary dependencies
		for (var i = -1; deps[++i];) !u.modules[deps[i]] && u.require(deps[i]);

		// adds new functionalities
		u.extend(mandoo, core);
		u.extend(u.methods, methods);
	}
	return mandoo;
};


u.event = {
/**********************
 * mandoo event handlers
 **********************/
	special: {
		mouseenter: function (el, handler)
		{
			u.event.add(el, 'mouseover', function (e)
			{
				if (e.relatedTarget != this && !u(e.relatedTarget).isChildOf(this))
					u.event.fire(this, 'mouseenter', undefined, e);
			});
		},
		mouseleave: function (el, handler)
		{
			u.event.add(el, 'mouseout', function (e)
			{
				if (e.relatedTarget != this && !u(e.relatedTarget).isChildOf(this))
					u.event.fire(this, 'mouseleave', undefined, e);
			});
		}
	},

	add: function (els, type, handler, bubble) {
		var _els = u(els); els = _els.length ? _els : [els];

		// split multiple types
		type = type.split(/\s*,\s*/);

		// adds the event handlers
		for (var i = -1; els[++i];) {
			els[i].events = els[i].events || {};

			for (var t = -1; type[++t];) {
				// store the handlers
				(els[i].events[type[t]] = els[i].events[type[t]] || {})[handler] = handler;

				// checks if there's a special type for this handler
				if (u.event.special[type[t]] &&
					u.event.special[type[t]](els[i], handler, !!bubble))0;

				else
				// try to use the standard event model method
				if (els[i].addEventListener)
					els[i].addEventListener(type[t], handler, !!bubble);

				else
				// some bytes of code specially written for IE
				if (els[i].attachEvent)
				(function (el) {
					el.attachEvent('on'+type[t],
					(el.events[type[t]].callers = el.events[type[t]].callers || {})[handler] = function () {
						// standardize the event object
						var e = window.event;
						u.extend(e, {
							charCode: e.type == 'keypress' ? e.keyCode : 0,
							eventPhase: 2,
							isChar: e.keyCode > 0,
							pageX: e.clientX + document.body.scrollLeft,
							pageY: e.clientY + document.body.scrollTop,
							target: e.srcElement,
							relatedTarget: e.type == 'mouseover' ? e.fromElement : e.toElement,
							timeStamp: +new Date,
							preventDefault: function () { this.returnValue = false; },
							stopPropagation: function () { this.cancelBubble = true; }
						});

						// sets bubbling
						e.cancelBubble = !bubble;

						// call the handler
						try {
							el.events[e.type][handler].call(el, e);
						} catch (e) {}
					});
				})(els[i]);
			}
		}

		return els;
	},

	remove: function (els, type, handler, bubble) {
		var _els = u(els); els = _els.length ? _els : [els];

		// split multiple types
		type = type.split(/\s+,?\s+/);

		// removes the event handlers
		for (var i = -1; els[++i];)
			for (var t = -1; type[++t];) if (els[i].events) {
				// remove the handler from event collection
				delete els[i].events[type[t]][handler];

				// the standard event model method
				if (els[i].removeEventListener)
					els[i].removeEventListener(type[t], handler, !!bubble);

				else
				// more few bytes of code for IE
				if (els[i].detachEvent)
					els[i].detachEvent('on' + type[t], els[i].events[type[t]].callers[handler]);
			}

		return els;
	},

	fire: function (els, type, handler, event) {
		var _els = u(els); els = _els.length ? _els : [els];

		// split multiple types
		type = type.split(/\s+,?\s+/);

		for (var i = -1; els[++i];)
			if (!els[i].events)
				continue;
			else
			for (var t = -1; type[++t];) {
				event = event || {};

				// force the custom event type
				if (event.type != type[t])
				{
					event = u.clone(event);
					event.type = type[t];
				}

				if (handler && els[i].events[type[t]][handler])
// 					handler.call(els[i], event);
					console.log(handler);
				else
					for (handler in els[i].events[type[t]]) if (handler != 'callers')
						els[i].events[type[t]][handler].call(els[i], event);
			}

		return els;
	}
};
// adds event shortcuts
('blur,change,click,dblclick,focus,keydown,keypress,keyup,load,mousedown,mouseenter,'+
'mouseleave,mousemove,mouseout,mouseover,mouseup,paste,reset,scroll,submit')
.replace(/\w+/g, function (type) {
	u.methods['on' + type] = function (fn) { return this.listen(type, fn); }
});

/****************
 * gfx utilities
 ****************/
u.size = function (el, scrolls) {
	if (el === undefined || typeof el == 'boolean' && (scrolls = el))
		el = document.documentElement;

	el = u(el)[0];

	return {
		width:
		scrolls?
			Math.max(el.scrollWidth, el.clientWidth, el.offsetWidth) :
			Math.max(el.clientWidth, el.offsetWidth),
		height:
		scrolls?
			Math.max(el.scrollHeight, el.clientHeight) :
			Math.max(el.clientHeight, el.offsetHeight)
	};
};

u.gfx = {
	color: {
		websafe: {
			aqua: [0,255,255],
			azure: [240,255,255],
			beige: [245,245,220],
			black: [0,0,0],
			blue: [0,0,255],
			brown: [165,42,42],
			cyan: [0,255,255],
			darkblue: [0,0,139],
			darkcyan: [0,139,139],
			darkgrey: [169,169,169],
			darkgreen: [0,100,0],
			darkkhaki: [189,183,107],
			darkmagenta: [139,0,139],
			darkolivegreen: [85,107,47],
			darkorange: [255,140,0],
			darkorchid: [153,50,204],
			darkred: [139,0,0],
			darksalmon: [233,150,122],
			darkviolet: [148,0,211],
			fuchsia: [255,0,255],
			gold: [255,215,0],
			green: [0,128,0],
			indigo: [75,0,130],
			khaki: [240,230,140],
			lightblue: [173,216,230],
			lightcyan: [224,255,255],
			lightgreen: [144,238,144],
			lightgrey: [211,211,211],
			lightpink: [255,182,193],
			lightyellow: [255,255,224],
			lime: [0,255,0],
			magenta: [255,0,255],
			maroon: [128,0,0],
			navy: [0,0,128],
			olive: [128,128,0],
			orange: [255,165,0],
			pink: [255,192,203],
			purple: [128,0,128],
			violet: [128,0,128],
			red: [255,0,0],
			silver: [192,192,192],
			white: [255,255,255],
			yellow: [255,255,0]
		},
		random: function () {
			var color = [], i = 3;
			while (i-- && color.push(Math.floor(Math.random() * 255)));
			return 'rgb(' + color + ')';
		},
		rgb: function (color) {
			var parsed, hex;

			// IE doesn't parse the color
			if (u.gfx.color.websafe[color])
				return u.gfx.color.websafe[color];

			// rgb format
			if (!color.indexOf('rgb'))
				parsed = color.match(/(\d+)/g);
			else
			// hex format
			if (hex = /^#/.test(color)) {
				// removes the #
				color = color.slice(1);
				// handles reduced hex color
				color.length == 3 && (color = color.replace(/(.)/g, '$1$1'));
				// splits channels
				parsed = color.match(/(.{2})/g);
			}

			// convert all items to numbers
			for (var i = -1; typeof parsed[++i] != 'undefined';)
				parsed[i] = parseInt(parsed[i], hex? 16 : null);

			if (parsed.length == 3)
				return parsed;
			else
				u.error('invalid color.');
		}
	},
	bezier: {
		n: function () {
			var p = Array.prototype.slice.call(arguments),
			    t = p.pop(),
				n = p.length - 1,
			    value = 0;

			for (var i = 0; i < p.length; i++)
				value += (i && i != n? n : 1) * Math.pow(1 - t, n - i) * Math.pow(t, i) * p[i];

			return value;
		}
	},
	opacity: function (els, value) {
	//>> handles the opacity
		els = u(els);

		if (value === undefined && els[0]) return (
		// get
			// the IE way
			u.support.ua.ie ?
				els[0].style.filter && els[0].style.filter.indexOf('opacity=') >= 0 ?
					+els[0].style.filter.match(/opacity=([^)]*)/)[1] / 100 : 1 :
			// and the normal one
				+els[0].ownerDocument.defaultView.getComputedStyle(els[0], null).opacity
		); else {
		// set
			if (u.support.ua.ie) {
				for (var i = -1; els[++i];) {
					els[i].style.zoom = 1;
					els[i].style.filter = (els[i].style.filter || '').replace(/alpha\([^)]*\)/, '') + 'alpha(opacity=' + (value * 100) + ')';
				}
			} else {
				for (var i = -1; els[++i];)
					els[i].style.opacity = value;
			}

			return this;
		}
	}
};

u.Animation = u.Class({
	__construct: function (el, attrs, options) {
		// if more than one element was given, creates one instance for each one
		el = u(el);

		if (!el.length)
			return this;

		else if (el.length > 1) {
			for (var i = -1, anims = []; el[++i];)
				anims.push(new u.Animation(el[i], u.clone(attrs), options));
			return anims;
		}

		el = el[0];

		// handles given options
		this.options = u.extend({
			easing: 'smooth',
			reverse: false,
			queue: false,
			cancelable: false,
			relative: false,
			proportional: false,
			hide: false,
			destroy: false
		}, options || {});

		// set animation properties
		u.extend(this, {
			startTime: +new Date,
			target: el,
			duration: options.duration || u.Animation.speeds[options.speed || 'normal'],
			attributes: attrs,
			callback: options.callback
		});

		// create a instance pointer so we can use it in internal scopes
		var anim = this;

		// element running animations collection
		el.animations = el.animations || [];

		// looks for conflicting attributes
		for (var n = el.animations.length; el.animations[--n];) {
			// handles queuing
			if (this.options.queue)
				return this.queue();

			for (var a in attrs) if (a in el.animations[n].attributes) {
				// cancels this animation
				if (this.options.cancelable)
					delete attrs[a];
				else
				// stops the animation of this attribute from other animation
					delete el.animations[n].attributes[a];
			}
		}

		var props = {}, from = [], to = [];
		for (var a in attrs) {
			// cache the values for later use
			props[a] = {
				from: this.value(a),
				to: parseFloat(attrs[a]) || attrs[a],
				scroll: !a.indexOf('scroll'),
				color: a.indexOf('olor') > -1
			};

			// reverse values
			if (this.options.reverse) {
				var aux = props[a].from;
				props[a].from = props[a].to; props[a].to = aux;
				delete aux;
			}

			// handles propotional and relative values
			if (!props[a].color) {
				this.options.proportional && (props[a].to *= props[a].from / 100);
				this.options.relative && (props[a].to += props[a].from);
			}

			// collect the values to calculate the number of frames later
			from.push(props[a].color ? 0 : props[a].from);
			to.push(props[a].color ? 100 : props[a].to);
		}

		// get the average of all the values
		for (var i = 0, f = 0, t = 0; i < from.length; i++) {
			f += Math.abs(from[i]);
			t += Math.abs(to[i]);
		}

		// then calculates the number of frames
		this.frames = Math.ceil(Math.abs(t - f) / Math.max(f, t) * this.duration / 10);

		// frame counter
		var frame = 1;

		if (!this.frames)
			this.stop();

		else {
			// adds the current animation to the element
			el.animations.push(this);

			// fire the animationstart custom event
			u.event.fire(el, 'animationstart', undefined, anim);

			// build the animation steps
			this.steps = setInterval(function () { if (!anim.paused) {
				for (var a in attrs) {
					// just a shortcut
					var p = props[a];

					// calculate the new value
					var value = p.color ?
						// used in color animations
						u.Animation.easing.gradient(p.from, p.to, anim.frames, frame) :
						// or normal number based ones
						p.from + u.Animation.easing[anim.options.easing](p.to - p.from, anim.frames, frame);

					// and set it
					p.scroll ? el[a] = value : u(el).css(a, value);
				}

				// animation ending
				if (anim.frames == frame) {
					if (anim.options.hide)
						el.style.display = 'none';
					else
					if (anim.options.destroy)
						u(el).remove(true);

					// stops the animation
					anim.stop();
				}

				// fire animation custom event
				u.event.fire(el, 'animation', undefined, anim);

				frame++;
			} }, this.duration / this.frames);
		}
	},

	__speeds: {
		slowest: 5000,
		slower: 3000,
		slow: 2000,
		normal: 700,
		fast: 400,
		faster: 250,
		fastest: 100
	},

	value: function (attr) {
		return (
			// scroll values
			!attr.indexOf('scroll')?
				this.target[attr] :
			// color values
			attr.indexOf('olor') > -1?
				u(this.target).css(attr) :
			// other values
			parseFloat(u(this.target).css(attr)) || (attr == 'width' || attr == 'height') && this.target[u.camelCase('offset-'+attr)] || 0
		);
	},

	__easing: {
		linear: function (diff, frames, step) {
			return diff / frames * step;
		},
		smooth: function (diff, frames, step) {
			return diff * u.gfx.bezier.n(0, 0, 1, 1, step/frames);
		},
		accelerated: function (diff, frames, step) {
			return diff * u.gfx.bezier.n(0, 0, 0, 1, step/frames);
		},
		impulse: function (diff, frames, step) {
			return diff * u.gfx.bezier.n(0, 0, -1, 1, step/frames);
		},
		splash: function (diff, frames, step) {
			return diff * u.gfx.bezier.n(0, 0, 2, 1, step/frames);
		},
		bounce: function (diff, frames, step) {
			return diff * u.gfx.bezier.n(0, 0, 1, 1, 1 - Math.exp(-2 * step / frames) * Math.abs(Math.cos(4.5 * Math.PI * (step / frames) * Math.sqrt(step / frames))));
		},
		gradient: function (from, to, frames, step) {
			from = u.gfx.color.rgb(from); to = u.gfx.color.rgb(to);

			for (var i = 0, value = []; i < 3; i++)
				value.push(from[i] + Math.round((to[i] - from[i]) / frames * step));

			return 'rgb('+value+')';
		}
	},

	// controls
	stop: function () {
		clearInterval(this.steps);

		// get the time when the animation ended
		this.endTime = +new Date;

		// removes the animation instance from the element
		this.target.animations.splice(u.index(this.target.animations, this), 1);

		// fire animfinish event
		u.event.fire(this.target, 'animationfinish', undefined, this);

		// executes the callback
		if (typeof this.callback == 'function')
			this.callback.call(this.target, this);

		// process queue
		if (this.target.animations.queued && this.target.animations.queued.length) {
			var anim = this.target.animations.queued.shift();
			new u.Animation(this.target, anim.attributes, anim.options);
		}

		return this;
	},

	queue: function () {
		(this.target.animations.queued = this.target.animations.queued || []).push(this);
		return this;
	},

	pause: function () {
		this.paused = true;
		return this;
	},

	play: function () {
		this.paused = false;
		return this;
	}
});

// animations shortcuts
u.extend(u.methods, {
	anim: function (attrs, options) {
		new u.Animation(this, attrs, options || {});
		return this;
	},

	isAnimating: function (attr)
	{
		for (var is = 0, i = -1; this[++i];) if (this[i].animations)
			if (!attr)
				is = this[i].animations.length;
			else
			for (var a = -1; this[i].animations[++a];) if (attr in this[i].animations[a].attributes)
			{
				is = 1;
				break;
			}
		return !!is;
	},

	backup: function () {
		for (var a = -1; arguments[++a];)
			for (var i = -1; this[++i];) {
				// creates an object to store original values
				this[i]._style = this[i]._style || {};

				var v = u(this[i]).css(arguments[a]);
				v == 'auto' && (v = 0);

				this[i]._style[u.camelCase(arguments[a])] = typeof v == 'string' && v.slice(-2) == 'px' || !isNaN(+v) ? parseFloat(v) : v;
			}
		return this;
	},

	show: function () {
		return this.css('display', '');
	},

	hide: function () {
		return this.css('display', 'none');
	},

	hover: function (attrs, options) {
		for (var a in attrs) this.backup(a);

		return this.listen('mouseenter,mouseleave', function (e) {
			var attrs_ = u.clone(attrs), options_ = u.clone(options || {});

			if (e.type == 'mouseleave') for (var a in attrs_)
			{
				if (options_.proportional)
					options_.proportional = 0;

				attrs_[a] = this._style[u.camelCase(a)];
			}

			u(this).anim(attrs_, options_);
		});
	},

	toggle: function (attr, options) {
		for (var i = -1; this[++i];) {
			// TODO!
		}
		return this;
	},

	fade: function (opacity, options) {
		return this.anim({ opacity:  opacity }, options);
	},

	fadeIn: function (options) {
		// sets opacity to 0 if it's 100%
		var i = this.length; while(i--)
			u.gfx.opacity(this[i]) == 1 && u.gfx.opacity(this[i], 0);

		return this.anim({ opacity: 1 }, options);
	},

	fadeOut: function (options) {
		if (options === true)
			options = { hide: true };

		return this.anim({ opacity: 0 }, options);
	},

	pulsate: function (times, options) {
		// default values
		times = times || 3;
		options = options || {};

		// put the fading effects in queue
		options.queue = true;

		// run the animations
		while (times--)
			this.anim({opacity: .5}, options).anim({opacity: 1}, options);

		return this;
	},

	slideDown: function (options) {
		this.backup('overflow').css('overflow', 'hidden');
		return this.anim(
			{ height: 0 },
			u.extend(options || {}, {
				reverse: true,
				callback: function ()
				{
					u(this).css('overflow', this._style.overflow);
				}
			}));
	},

	resize: function (w, h, options) {
		return this.anim(
			{ width: w, height: h },
			options
		);
	},

	puff: function (speed) {
		return this.anim(
			{ width: 200, height: 200, marginLeft: -200, marginTop: -200, opacity: 0 },
			{ speed: speed, proportional: true, hide: true }
		)
	},

	move: function (x, y, options) {
		return this.anim(
			{ 'margin-left': x, 'margin-top': y },
			options
		);
	},

	moveBy: function (x, y, options) {
		options = options || {};
		options.relative = true;
		return this.move(x, y, options);
	},

	shake: function (times, options) {
		// default values
		times = times || 3;

		options = u.extend(options || {}, {
			queue: true,
			relative: true
		});

		// run the animations
		this.move(-10, 0, options);
		while (times--)
			this.move(20, 0, options).move(-20, 0, options);
		this.move(10, 0, options);

		return this;
	},

	color: function (color, options) {
		return this.anim(
			{ 'background-color': color },
			options
		);
	},

	highlight: function(color) {
		return this.anim(
			{ 'background-color': color || '#ff9' },
			{ reverse: true, cancelable: true }
		);
	}
});

// adds event shortcuts
('animation,animationfinish,animationstart')
.replace(/\w+/g, function (type) {
	u.methods['on' + type] = function (fn) { return this.listen(type, fn); }
});

/*******************
 * static utilities
 *******************/

u.trim = function (str) {
//>> removes trailing spaces from strings
	return (''+str || '').replace(/^\s+|\s+$/g, '');
};

u.clean = function (str) {
//>> removes consecutive and trailing spaces on strings
	if (typeof str == 'string')
		return u.trim(str).replace(/\s{2,}/g, ' ');
	else {
//>> removes repeated items from collections
		var array = [],
		    __mandoo = str.__mandoo;

		for (var i = 0, l = str.length; i < l; i++)
			if (u.index(array, str[i]) < 0)
				array.push(str[i]);

		return __mandoo? u(array) : array;
	}
};

u.index = function (col, item) {
//>> universal indexOf
	if (col.indexOf)
		return col.indexOf(item);

	for (var i = 0, l = col.length; i < l; i++)
		if (col[i] === item)
			return i;
	return -1;
};

u.shuffle = function (col) {
//>> shuffles a collection of items
	var u = col.__mandoo;

	!(col instanceof Array) && (col = u.array(col));

	// protect the array from being overwritten and shuffle it
	col = col.slice().sort(function () { return .5 - Math.random() });

	return u? u(col) : col;
};

u.array = function () {
//>> turns indexable objects into one array
	var array = [];
	for (var i = -1; arguments[++i];) {
		if (arguments[i] instanceof Array)
			Array.prototype.push.apply(array, arguments[i]);
		else
		for (var a = -1; arguments[i][++a];)
			array.push(arguments[i][a]);
	}
	return array;
};

u.clone = function (obj, deep) {
	// if it's an 'pure' array, do the slice trick
	if (obj instanceof Array)
		return obj.slice();

	if (obj.nodeType)
		return obj.cloneNode(!!deep);

	var _obj = {};
	for (var key in obj) if (obj.hasOwnProperty(key)) {
		_obj[key] = deep && typeof obj[key] == 'object' ?
			u.clone(obj[key]) :
			obj[key];
	}
	return _obj;
};

u.camelCase = function (str) {
	return str.replace(/\W([a-z])/g, function (s, m) {
		return m.toUpperCase();
	});
};

u.mult = function (str, n) {
//>> repeats a string n times
	return new Array(n + 1).join(str);
};

u.percent = function (total, n) {
//>> calculates a percentage
	return total * n / 100;
};

u.average = function () {
	var sum = 0;
	for (var i = 0; i < arguments.length; i++)
		sum += arguments[i];

	return sum / arguments.length ;
};

// some useful information of what we're dealing with
u.support = {
	ua: {
		ie: window.attachEvent && !window.opera,
		iphone: navigator.userAgent.indexOf('iPhone') > -1,
		opera: window.opera
	}
};
u.support.fix = {
	'cellspacing': 'cellSpacing',
	'class': u.support.ua.ie? 'className' : 'class',
	'for': 'htmlFor',
	'float': u.support.ua.ie? 'styleFloat' : 'cssFloat',
	'maxlength': 'maxLength',
	'readonly': 'readOnly',
	'rowspan': 'rowSpan'
};
u.support.attrName = function (str) {
	return u.camelCase(u.support.fix[str] || str);
};

u.error = function (msg) {
	throw new Error('Mandoo: ' + msg);
};

/*!
 * Sizzle CSS Selector Engine - v1.0
 *  Copyright 2009, The Dojo Foundation
 *  Released under the MIT, BSD, and GPL Licenses.
 *  More information: http://sizzlejs.com/
 */
(function(){

var chunker = /((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^[\]]*\]|['"][^'"]*['"]|[^[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?/g,
	done = 0,
	toString = Object.prototype.toString,
	hasDuplicate = false;

var Sizzle = function(selector, context, results, seed) {
	results = results || [];
	var origContext = context = context || document;

	if ( context.nodeType !== 1 && context.nodeType !== 9 ) {
		return [];
	}

	if ( !selector || typeof selector !== "string" ) {
		return results;
	}

	var parts = [], m, set, checkSet, check, mode, extra, prune = true, contextXML = isXML(context);

	// Reset the position of the chunker regexp (start from head)
	chunker.lastIndex = 0;

	while ( (m = chunker.exec(selector)) !== null ) {
		parts.push( m[1] );

		if ( m[2] ) {
			extra = RegExp.rightContext;
			break;
		}
	}

	if ( parts.length > 1 && origPOS.exec( selector ) ) {
		if ( parts.length === 2 && Expr.relative[ parts[0] ] ) {
			set = posProcess( parts[0] + parts[1], context );
		} else {
			set = Expr.relative[ parts[0] ] ?
				[ context ] :
				Sizzle( parts.shift(), context );

			while ( parts.length ) {
				selector = parts.shift();

				if ( Expr.relative[ selector ] )
					selector += parts.shift();

				set = posProcess( selector, set );
			}
		}
	} else {
		// Take a shortcut and set the context if the root selector is an ID
		// (but not if it'll be faster if the inner selector is an ID)
		if ( !seed && parts.length > 1 && context.nodeType === 9 && !contextXML &&
				Expr.match.ID.test(parts[0]) && !Expr.match.ID.test(parts[parts.length - 1]) ) {
			var ret = Sizzle.find( parts.shift(), context, contextXML );
			context = ret.expr ? Sizzle.filter( ret.expr, ret.set )[0] : ret.set[0];
		}

		if ( context ) {
			var ret = seed ?
				{ expr: parts.pop(), set: makeArray(seed) } :
				Sizzle.find( parts.pop(), parts.length === 1 && (parts[0] === "~" || parts[0] === "+") && context.parentNode ? context.parentNode : context, contextXML );
			set = ret.expr ? Sizzle.filter( ret.expr, ret.set ) : ret.set;

			if ( parts.length > 0 ) {
				checkSet = makeArray(set);
			} else {
				prune = false;
			}

			while ( parts.length ) {
				var cur = parts.pop(), pop = cur;

				if ( !Expr.relative[ cur ] ) {
					cur = "";
				} else {
					pop = parts.pop();
				}

				if ( pop == null ) {
					pop = context;
				}

				Expr.relative[ cur ]( checkSet, pop, contextXML );
			}
		} else {
			checkSet = parts = [];
		}
	}

	if ( !checkSet ) {
		checkSet = set;
	}

	if ( !checkSet ) {
		throw "Syntax error, unrecognized expression: " + (cur || selector);
	}

	if ( toString.call(checkSet) === "[object Array]" ) {
		if ( !prune ) {
			results.push.apply( results, checkSet );
		} else if ( context && context.nodeType === 1 ) {
			for ( var i = 0; checkSet[i] != null; i++ ) {
				if ( checkSet[i] && (checkSet[i] === true || checkSet[i].nodeType === 1 && contains(context, checkSet[i])) ) {
					results.push( set[i] );
				}
			}
		} else {
			for ( var i = 0; checkSet[i] != null; i++ ) {
				if ( checkSet[i] && checkSet[i].nodeType === 1 ) {
					results.push( set[i] );
				}
			}
		}
	} else {
		makeArray( checkSet, results );
	}

	if ( extra ) {
		Sizzle( extra, origContext, results, seed );
		Sizzle.uniqueSort( results );
	}

	return results;
};

Sizzle.uniqueSort = function(results){
	if ( sortOrder ) {
		hasDuplicate = false;
		results.sort(sortOrder);

		if ( hasDuplicate ) {
			for ( var i = 1; i < results.length; i++ ) {
				if ( results[i] === results[i-1] ) {
					results.splice(i--, 1);
				}
			}
		}
	}
};

Sizzle.matches = function(expr, set){
	return Sizzle(expr, null, null, set);
};

Sizzle.find = function(expr, context, isXML){
	var set, match;

	if ( !expr ) {
		return [];
	}

	for ( var i = 0, l = Expr.order.length; i < l; i++ ) {
		var type = Expr.order[i], match;

		if ( (match = Expr.match[ type ].exec( expr )) ) {
			var left = RegExp.leftContext;

			if ( left.substr( left.length - 1 ) !== "\\" ) {
				match[1] = (match[1] || "").replace(/\\/g, "");
				set = Expr.find[ type ]( match, context, isXML );
				if ( set != null ) {
					expr = expr.replace( Expr.match[ type ], "" );
					break;
				}
			}
		}
	}

	if ( !set ) {
		set = context.getElementsByTagName("*");
	}

	return {set: set, expr: expr};
};

Sizzle.filter = function(expr, set, inplace, not){
	var old = expr, result = [], curLoop = set, match, anyFound,
		isXMLFilter = set && set[0] && isXML(set[0]);

	while ( expr && set.length ) {
		for ( var type in Expr.filter ) {
			if ( (match = Expr.match[ type ].exec( expr )) != null ) {
				var filter = Expr.filter[ type ], found, item;
				anyFound = false;

				if ( curLoop == result ) {
					result = [];
				}

				if ( Expr.preFilter[ type ] ) {
					match = Expr.preFilter[ type ]( match, curLoop, inplace, result, not, isXMLFilter );

					if ( !match ) {
						anyFound = found = true;
					} else if ( match === true ) {
						continue;
					}
				}

				if ( match ) {
					for ( var i = 0; (item = curLoop[i]) != null; i++ ) {
						if ( item ) {
							found = filter( item, match, i, curLoop );
							var pass = not ^ !!found;

							if ( inplace && found != null ) {
								if ( pass ) {
									anyFound = true;
								} else {
									curLoop[i] = false;
								}
							} else if ( pass ) {
								result.push( item );
								anyFound = true;
							}
						}
					}
				}

				if ( found !== undefined ) {
					if ( !inplace ) {
						curLoop = result;
					}

					expr = expr.replace( Expr.match[ type ], "" );

					if ( !anyFound ) {
						return [];
					}

					break;
				}
			}
		}

		// Improper expression
		if ( expr == old ) {
			if ( anyFound == null ) {
				throw "Syntax error, unrecognized expression: " + expr;
			} else {
				break;
			}
		}

		old = expr;
	}

	return curLoop;
};

var Expr = Sizzle.selectors = {
	order: [ "ID", "NAME", "TAG" ],
	match: {
		ID: /#((?:[\w\u00c0-\uFFFF_-]|\\.)+)/,
		CLASS: /\.((?:[\w\u00c0-\uFFFF_-]|\\.)+)/,
		NAME: /\[name=['"]*((?:[\w\u00c0-\uFFFF_-]|\\.)+)['"]*\]/,
		ATTR: /\[\s*((?:[\w\u00c0-\uFFFF_-]|\\.)+)\s*(?:(\S?=)\s*(['"]*)(.*?)\3|)\s*\]/,
		TAG: /^((?:[\w\u00c0-\uFFFF\*_-]|\\.)+)/,
		CHILD: /:(only|nth|last|first)-child(?:\((even|odd|[\dn+-]*)\))?/,
		POS: /:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^-]|$)/,
		PSEUDO: /:((?:[\w\u00c0-\uFFFF_-]|\\.)+)(?:\((['"]*)((?:\([^\)]+\)|[^\2\(\)]*)+)\2\))?/
	},
	attrMap: {
		"class": "className",
		"for": "htmlFor"
	},
	attrHandle: {
		href: function(elem){
			return elem.getAttribute("href");
		}
	},
	relative: {
		"+": function(checkSet, part, isXML){
			var isPartStr = typeof part === "string",
				isTag = isPartStr && !/\W/.test(part),
				isPartStrNotTag = isPartStr && !isTag;

			if ( isTag && !isXML ) {
				part = part.toUpperCase();
			}

			for ( var i = 0, l = checkSet.length, elem; i < l; i++ ) {
				if ( (elem = checkSet[i]) ) {
					while ( (elem = elem.previousSibling) && elem.nodeType !== 1 ) {}

					checkSet[i] = isPartStrNotTag || elem && elem.nodeName === part ?
						elem || false :
						elem === part;
				}
			}

			if ( isPartStrNotTag ) {
				Sizzle.filter( part, checkSet, true );
			}
		},
		">": function(checkSet, part, isXML){
			var isPartStr = typeof part === "string";

			if ( isPartStr && !/\W/.test(part) ) {
				part = isXML ? part : part.toUpperCase();

				for ( var i = 0, l = checkSet.length; i < l; i++ ) {
					var elem = checkSet[i];
					if ( elem ) {
						var parent = elem.parentNode;
						checkSet[i] = parent.nodeName === part ? parent : false;
					}
				}
			} else {
				for ( var i = 0, l = checkSet.length; i < l; i++ ) {
					var elem = checkSet[i];
					if ( elem ) {
						checkSet[i] = isPartStr ?
							elem.parentNode :
							elem.parentNode === part;
					}
				}

				if ( isPartStr ) {
					Sizzle.filter( part, checkSet, true );
				}
			}
		},
		"": function(checkSet, part, isXML){
			var doneName = done++, checkFn = dirCheck;

			if ( !part.match(/\W/) ) {
				var nodeCheck = part = isXML ? part : part.toUpperCase();
				checkFn = dirNodeCheck;
			}

			checkFn("parentNode", part, doneName, checkSet, nodeCheck, isXML);
		},
		"~": function(checkSet, part, isXML){
			var doneName = done++, checkFn = dirCheck;

			if ( typeof part === "string" && !part.match(/\W/) ) {
				var nodeCheck = part = isXML ? part : part.toUpperCase();
				checkFn = dirNodeCheck;
			}

			checkFn("previousSibling", part, doneName, checkSet, nodeCheck, isXML);
		}
	},
	find: {
		ID: function(match, context, isXML){
			if ( typeof context.getElementById !== "undefined" && !isXML ) {
				var m = context.getElementById(match[1]);
				return m ? [m] : [];
			}
		},
		NAME: function(match, context, isXML){
			if ( typeof context.getElementsByName !== "undefined" ) {
				var ret = [], results = context.getElementsByName(match[1]);

				for ( var i = 0, l = results.length; i < l; i++ ) {
					if ( results[i].getAttribute("name") === match[1] ) {
						ret.push( results[i] );
					}
				}

				return ret.length === 0 ? null : ret;
			}
		},
		TAG: function(match, context){
			return context.getElementsByTagName(match[1]);
		}
	},
	preFilter: {
		CLASS: function(match, curLoop, inplace, result, not, isXML){
			match = " " + match[1].replace(/\\/g, "") + " ";

			if ( isXML ) {
				return match;
			}

			for ( var i = 0, elem; (elem = curLoop[i]) != null; i++ ) {
				if ( elem ) {
					if ( not ^ (elem.className && (" " + elem.className + " ").indexOf(match) >= 0) ) {
						if ( !inplace )
							result.push( elem );
					} else if ( inplace ) {
						curLoop[i] = false;
					}
				}
			}

			return false;
		},
		ID: function(match){
			return match[1].replace(/\\/g, "");
		},
		TAG: function(match, curLoop){
			for ( var i = 0; curLoop[i] === false; i++ ){}
			return curLoop[i] && isXML(curLoop[i]) ? match[1] : match[1].toUpperCase();
		},
		CHILD: function(match){
			if ( match[1] == "nth" ) {
				// parse equations like 'even', 'odd', '5', '2n', '3n+2', '4n-1', '-n+6'
				var test = /(-?)(\d*)n((?:\+|-)?\d*)/.exec(
					match[2] == "even" && "2n" || match[2] == "odd" && "2n+1" ||
					!/\D/.test( match[2] ) && "0n+" + match[2] || match[2]);

				// calculate the numbers (first)n+(last) including if they are negative
				match[2] = (test[1] + (test[2] || 1)) - 0;
				match[3] = test[3] - 0;
			}

			// TODO: Move to normal caching system
			match[0] = done++;

			return match;
		},
		ATTR: function(match, curLoop, inplace, result, not, isXML){
			var name = match[1].replace(/\\/g, "");

			if ( !isXML && Expr.attrMap[name] ) {
				match[1] = Expr.attrMap[name];
			}

			if ( match[2] === "~=" ) {
				match[4] = " " + match[4] + " ";
			}

			return match;
		},
		PSEUDO: function(match, curLoop, inplace, result, not){
			if ( match[1] === "not" ) {
				// If we're dealing with a complex expression, or a simple one
				if ( match[3].match(chunker).length > 1 || /^\w/.test(match[3]) ) {
					match[3] = Sizzle(match[3], null, null, curLoop);
				} else {
					var ret = Sizzle.filter(match[3], curLoop, inplace, true ^ not);
					if ( !inplace ) {
						result.push.apply( result, ret );
					}
					return false;
				}
			} else if ( Expr.match.POS.test( match[0] ) || Expr.match.CHILD.test( match[0] ) ) {
				return true;
			}

			return match;
		},
		POS: function(match){
			match.unshift( true );
			return match;
		}
	},
	filters: {
		enabled: function(elem){
			return elem.disabled === false && elem.type !== "hidden";
		},
		disabled: function(elem){
			return elem.disabled === true;
		},
		checked: function(elem){
			return elem.checked === true;
		},
		selected: function(elem){
			// Accessing this property makes selected-by-default
			// options in Safari work properly
			elem.parentNode.selectedIndex;
			return elem.selected === true;
		},
		parent: function(elem){
			return !!elem.firstChild;
		},
		empty: function(elem){
			return !elem.firstChild;
		},
		has: function(elem, i, match){
			return !!Sizzle( match[3], elem ).length;
		},
		header: function(elem){
			return /h\d/i.test( elem.nodeName );
		},
		text: function(elem){
			return "text" === elem.type;
		},
		radio: function(elem){
			return "radio" === elem.type;
		},
		checkbox: function(elem){
			return "checkbox" === elem.type;
		},
		file: function(elem){
			return "file" === elem.type;
		},
		password: function(elem){
			return "password" === elem.type;
		},
		submit: function(elem){
			return "submit" === elem.type;
		},
		image: function(elem){
			return "image" === elem.type;
		},
		reset: function(elem){
			return "reset" === elem.type;
		},
		button: function(elem){
			return "button" === elem.type || elem.nodeName.toUpperCase() === "BUTTON";
		},
		input: function(elem){
			return /input|select|textarea|button/i.test(elem.nodeName);
		}
	},
	setFilters: {
		first: function(elem, i){
			return i === 0;
		},
		last: function(elem, i, match, array){
			return i === array.length - 1;
		},
		even: function(elem, i){
			return i % 2 === 0;
		},
		odd: function(elem, i){
			return i % 2 === 1;
		},
		lt: function(elem, i, match){
			return i < match[3] - 0;
		},
		gt: function(elem, i, match){
			return i > match[3] - 0;
		},
		nth: function(elem, i, match){
			return match[3] - 0 == i;
		},
		eq: function(elem, i, match){
			return match[3] - 0 == i;
		}
	},
	filter: {
		PSEUDO: function(elem, match, i, array){
			var name = match[1], filter = Expr.filters[ name ];

			if ( filter ) {
				return filter( elem, i, match, array );
			} else if ( name === "contains" ) {
				return (elem.textContent || elem.innerText || "").indexOf(match[3]) >= 0;
			} else if ( name === "not" ) {
				var not = match[3];

				for ( i = 0, l = not.length; i < l; i++ ) {
					if ( not[i] === elem ) {
						return false;
					}
				}

				return true;
			}
		},
		CHILD: function(elem, match){
			var type = match[1], node = elem;
			switch (type) {
				case 'only':
				case 'first':
					while ( (node = node.previousSibling) )  {
						if ( node.nodeType === 1 ) return false;
					}
					if ( type == 'first') return true;
					node = elem;
				case 'last':
					while ( (node = node.nextSibling) )  {
						if ( node.nodeType === 1 ) return false;
					}
					return true;
				case 'nth':
					var first = match[2], last = match[3];

					if ( first == 1 && last == 0 ) {
						return true;
					}

					var doneName = match[0],
						parent = elem.parentNode;

					if ( parent && (parent.sizcache !== doneName || !elem.nodeIndex) ) {
						var count = 0;
						for ( node = parent.firstChild; node; node = node.nextSibling ) {
							if ( node.nodeType === 1 ) {
								node.nodeIndex = ++count;
							}
						}
						parent.sizcache = doneName;
					}

					var diff = elem.nodeIndex - last;
					if ( first == 0 ) {
						return diff == 0;
					} else {
						return ( diff % first == 0 && diff / first >= 0 );
					}
			}
		},
		ID: function(elem, match){
			return elem.nodeType === 1 && elem.getAttribute("id") === match;
		},
		TAG: function(elem, match){
			return (match === "*" && elem.nodeType === 1) || elem.nodeName === match;
		},
		CLASS: function(elem, match){
			return (" " + (elem.className || elem.getAttribute("class")) + " ")
				.indexOf( match ) > -1;
		},
		ATTR: function(elem, match){
			var name = match[1],
				result = Expr.attrHandle[ name ] ?
					Expr.attrHandle[ name ]( elem ) :
					elem[ name ] != null ?
						elem[ name ] :
						elem.getAttribute( name ),
				value = result + "",
				type = match[2],
				check = match[4];

			return result == null ?
				type === "!=" :
				type === "=" ?
				value === check :
				type === "*=" ?
				value.indexOf(check) >= 0 :
				type === "~=" ?
				(" " + value + " ").indexOf(check) >= 0 :
				!check ?
				value && result !== false :
				type === "!=" ?
				value != check :
				type === "^=" ?
				value.indexOf(check) === 0 :
				type === "$=" ?
				value.substr(value.length - check.length) === check :
				type === "|=" ?
				value === check || value.substr(0, check.length + 1) === check + "-" :
				false;
		},
		POS: function(elem, match, i, array){
			var name = match[2], filter = Expr.setFilters[ name ];

			if ( filter ) {
				return filter( elem, i, match, array );
			}
		}
	}
};

var origPOS = Expr.match.POS;

for ( var type in Expr.match ) {
	Expr.match[ type ] = new RegExp( Expr.match[ type ].source + /(?![^\[]*\])(?![^\(]*\))/.source );
}

var makeArray = function(array, results) {
	array = Array.prototype.slice.call( array );

	if ( results ) {
		results.push.apply( results, array );
		return results;
	}

	return array;
};

// Perform a simple check to determine if the browser is capable of
// converting a NodeList to an array using builtin methods.
try {
	Array.prototype.slice.call( document.documentElement.childNodes );

// Provide a fallback method if it does not work
} catch(e){
	makeArray = function(array, results) {
		var ret = results || [];

		if ( toString.call(array) === "[object Array]" ) {
			Array.prototype.push.apply( ret, array );
		} else {
			if ( typeof array.length === "number" ) {
				for ( var i = 0, l = array.length; i < l; i++ ) {
					ret.push( array[i] );
				}
			} else {
				for ( var i = 0; array[i]; i++ ) {
					ret.push( array[i] );
				}
			}
		}

		return ret;
	};
}

var sortOrder;

if ( document.documentElement.compareDocumentPosition ) {
	sortOrder = function( a, b ) {
		var ret = a.compareDocumentPosition(b) & 4 ? -1 : a === b ? 0 : 1;
		if ( ret === 0 ) {
			hasDuplicate = true;
		}
		return ret;
	};
} else if ( "sourceIndex" in document.documentElement ) {
	sortOrder = function( a, b ) {
		var ret = a.sourceIndex - b.sourceIndex;
		if ( ret === 0 ) {
			hasDuplicate = true;
		}
		return ret;
	};
} else if ( document.createRange ) {
	sortOrder = function( a, b ) {
		var aRange = a.ownerDocument.createRange(), bRange = b.ownerDocument.createRange();
		aRange.selectNode(a);
		aRange.collapse(true);
		bRange.selectNode(b);
		bRange.collapse(true);
		var ret = aRange.compareBoundaryPoints(Range.START_TO_END, bRange);
		if ( ret === 0 ) {
			hasDuplicate = true;
		}
		return ret;
	};
}

// Check to see if the browser returns elements by name when
// querying by getElementById (and provide a workaround)
(function(){
	// We're going to inject a fake input element with a specified name
	var form = document.createElement("div"),
		id = "script" + (new Date).getTime();
	form.innerHTML = "<a name='" + id + "'/>";

	// Inject it into the root element, check its status, and remove it quickly
	var root = document.documentElement;
	root.insertBefore( form, root.firstChild );

	// The workaround has to do additional checks after a getElementById
	// Which slows things down for other browsers (hence the branching)
	if ( !!document.getElementById( id ) ) {
		Expr.find.ID = function(match, context, isXML){
			if ( typeof context.getElementById !== "undefined" && !isXML ) {
				var m = context.getElementById(match[1]);
				return m ? m.id === match[1] || typeof m.getAttributeNode !== "undefined" && m.getAttributeNode("id").nodeValue === match[1] ? [m] : undefined : [];
			}
		};

		Expr.filter.ID = function(elem, match){
			var node = typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");
			return elem.nodeType === 1 && node && node.nodeValue === match;
		};
	}

	root.removeChild( form );
	root = form = null; // release memory in IE
})();

(function(){
	// Check to see if the browser returns only elements
	// when doing getElementsByTagName("*")

	// Create a fake element
	var div = document.createElement("div");
	div.appendChild( document.createComment("") );

	// Make sure no comments are found
	if ( div.getElementsByTagName("*").length > 0 ) {
		Expr.find.TAG = function(match, context){
			var results = context.getElementsByTagName(match[1]);

			// Filter out possible comments
			if ( match[1] === "*" ) {
				var tmp = [];

				for ( var i = 0; results[i]; i++ ) {
					if ( results[i].nodeType === 1 ) {
						tmp.push( results[i] );
					}
				}

				results = tmp;
			}

			return results;
		};
	}

	// Check to see if an attribute returns normalized href attributes
	div.innerHTML = "<a href='#'></a>";
	if ( div.firstChild && typeof div.firstChild.getAttribute !== "undefined" &&
			div.firstChild.getAttribute("href") !== "#" ) {
		Expr.attrHandle.href = function(elem){
			return elem.getAttribute("href", 2);
		};
	}

	div = null; // release memory in IE
})();

if ( document.querySelectorAll ) (function(){
	var oldSizzle = Sizzle, div = document.createElement("div");
	div.innerHTML = "<p class='TEST'></p>";

	// Safari can't handle uppercase or unicode characters when
	// in quirks mode.
	if ( div.querySelectorAll && div.querySelectorAll(".TEST").length === 0 ) {
		return;
	}

	Sizzle = function(query, context, extra, seed){
		context = context || document;

		// Only use querySelectorAll on non-XML documents
		// (ID selectors don't work in non-HTML documents)
		if ( !seed && context.nodeType === 9 && !isXML(context) ) {
			try {
				return makeArray( context.querySelectorAll(query), extra );
			} catch(e){}
		}

		return oldSizzle(query, context, extra, seed);
	};

	for ( var prop in oldSizzle ) {
		Sizzle[ prop ] = oldSizzle[ prop ];
	}

	div = null; // release memory in IE
})();

if ( document.getElementsByClassName && document.documentElement.getElementsByClassName ) (function(){
	var div = document.createElement("div");
	div.innerHTML = "<div class='test e'></div><div class='test'></div>";

	// Opera can't find a second classname (in 9.6)
	if ( div.getElementsByClassName("e").length === 0 )
		return;

	// Safari caches class attributes, doesn't catch changes (in 3.2)
	div.lastChild.className = "e";

	if ( div.getElementsByClassName("e").length === 1 )
		return;

	Expr.order.splice(1, 0, "CLASS");
	Expr.find.CLASS = function(match, context, isXML) {
		if ( typeof context.getElementsByClassName !== "undefined" && !isXML ) {
			return context.getElementsByClassName(match[1]);
		}
	};

	div = null; // release memory in IE
})();

function dirNodeCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
	var sibDir = dir == "previousSibling" && !isXML;
	for ( var i = 0, l = checkSet.length; i < l; i++ ) {
		var elem = checkSet[i];
		if ( elem ) {
			if ( sibDir && elem.nodeType === 1 ){
				elem.sizcache = doneName;
				elem.sizset = i;
			}
			elem = elem[dir];
			var match = false;

			while ( elem ) {
				if ( elem.sizcache === doneName ) {
					match = checkSet[elem.sizset];
					break;
				}

				if ( elem.nodeType === 1 && !isXML ){
					elem.sizcache = doneName;
					elem.sizset = i;
				}

				if ( elem.nodeName === cur ) {
					match = elem;
					break;
				}

				elem = elem[dir];
			}

			checkSet[i] = match;
		}
	}
}

function dirCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
	var sibDir = dir == "previousSibling" && !isXML;
	for ( var i = 0, l = checkSet.length; i < l; i++ ) {
		var elem = checkSet[i];
		if ( elem ) {
			if ( sibDir && elem.nodeType === 1 ) {
				elem.sizcache = doneName;
				elem.sizset = i;
			}
			elem = elem[dir];
			var match = false;

			while ( elem ) {
				if ( elem.sizcache === doneName ) {
					match = checkSet[elem.sizset];
					break;
				}

				if ( elem.nodeType === 1 ) {
					if ( !isXML ) {
						elem.sizcache = doneName;
						elem.sizset = i;
					}
					if ( typeof cur !== "string" ) {
						if ( elem === cur ) {
							match = true;
							break;
						}

					} else if ( Sizzle.filter( cur, [elem] ).length > 0 ) {
						match = elem;
						break;
					}
				}

				elem = elem[dir];
			}

			checkSet[i] = match;
		}
	}
}

var contains = document.compareDocumentPosition ?  function(a, b){
	return a.compareDocumentPosition(b) & 16;
} : function(a, b){
	return a !== b && (a.contains ? a.contains(b) : true);
};

var isXML = function(elem){
	return elem.nodeType === 9 && elem.documentElement.nodeName !== "HTML" ||
		!!elem.ownerDocument && elem.ownerDocument.documentElement.nodeName !== "HTML";
};

var posProcess = function(selector, context){
	var tmpSet = [], later = "", match,
		root = context.nodeType ? [context] : context;

	// Position selectors must be done after the filter
	// And so must :not(positional) so we move all PSEUDOs to the end
	while ( (match = Expr.match.PSEUDO.exec( selector )) ) {
		later += match[0];
		selector = selector.replace( Expr.match.PSEUDO, "" );
	}

	selector = Expr.relative[selector] ? selector + "*" : selector;

	for ( var i = 0, l = root.length; i < l; i++ ) {
		Sizzle( selector, root[i], tmpSet );
	}

	return Sizzle.filter( later, tmpSet );
};

// EXPOSE

u.grab = Sizzle;

})();

// selector engine add-ins
u.extend(u.grab.selectors.filters, {
	visible: function (elem) {
		return elem.offsetWidth || elem.offsetHeight;
	},
	hidden: function (elem) {
		return !elem.offsetWidth || !elem.offsetHeight;
	}
});

// mandoo shortcut
window.u = u;

})(mandoo);
