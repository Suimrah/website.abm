//Copyright (c) 2018, 8-nines Consulting, LLC. All rights reserved. 8-nines.com

(function(global) {
	'use strict'
	function _lw8form() {}

	_lw8form.prototype.addLoadingIndicator = function(e) {
		var loading = document.createElement('div')
		loading.classList.add('loading')
		e.appendChild(loading)
	}

	_lw8form.prototype.createArray = function(key, values, isDisabled, isObject, autofill) {
		var div = document.createElement('div')
		div.classList.add('group-container', 'array-container')
		var title = document.createElement('div')
		title.innerHTML = lw8.getName(key)
		div.appendChild(title)
		if(isObject) {
			var i = 0
			for(var objKey in values) {
				values.hasOwnProperty(objKey) && div.appendChild(this.createArrayInput(key, lw8.getName(key), objKey, i++, isDisabled, true, values[objKey]))
			}
		} else {
			for(var i = 0; i < values.length; i++) {
				div.appendChild(this.createArrayInput(key, lw8.getName(key), values[i], i, isDisabled, false, undefined, autofill))
			}
		}
		var subDiv = document.createElement('div')
		var add = document.createElement('div')
		add.classList.add('icon-add')
		add.setAttribute('data-name', key)
		add.setAttribute('data-disabled', isDisabled)
		add.setAttribute('data-object', isObject)
		add.addEventListener('click', function() {
			var container = this.parentNode.parentNode
			var key = this.getAttribute('data-name')
			container.insertBefore(lw8form.createArrayInput(key, lw8.getName(key), '', container.childElementCount - 2, this.getAttribute('data-disabled') === 'true', this.getAttribute('data-object') === 'true', '', autofill), container.lastChild)
		})
		subDiv.appendChild(add)
		div.appendChild(subDiv)
		return div
	}

	_lw8form.prototype.createArrayInput = function(name, placeholder, value, index, isDisabled, isObject, value2, autofill) {
		var div = document.createElement('div')
		var attributes = {placeholder: placeholder + (isObject ? ' Name': ''), required: true}
		if(isDisabled) { attributes.disabled = true }
		var input = this.createInput(name + (isObject ? 'Keys[]' : '[]'), value, attributes)
		input.id = name+'-'+index
		div.appendChild(input)
		autofill && autofill.hasOwnProperty(name) && lw8form.setupAutofill(input, autofill[name], '-'+index)
		if(isObject) {
			attributes.placeholder = placeholder + ' Value'
			div.appendChild(this.createTextArea(name + 'Values[]', value2, 'medium', attributes))
		}
		var remove = document.createElement('div')
		remove.classList.add('icon-delete')
		remove.addEventListener('click', function() {
			this.parentNode.remove()
		})
		div.appendChild(remove)
		return div
	}

	_lw8form.prototype.createCheckbox = function(key, value, isDisabled) {
		var input = document.createElement('input')
		input.setAttribute('id', key)
		input.setAttribute('name', key)
		input.setAttribute('type', 'checkbox')
		value && input.setAttribute('checked', 'true')
		isDisabled && input.setAttribute('disabled', 'true')
		var label = this.createLabel(key, lw8.getName(key))
		label.insertBefore(input, label.firstChild)
		return label
	}

	_lw8form.prototype.createDescription = function(text, id) {
		var description = document.createElement('p')
		description.classList.add('description')
		id && description.setAttribute('id', id)
		description.innerHTML = text
		return description
	}

	_lw8form.prototype.createForm = function(obj, options, popup, success) {
		options = options || {}
		var form = document.createElement('form')
		form.setAttribute('method', 'post')
		options.action && form.setAttribute('action', options.action)
		options.files.length && form.setAttribute('data-form-data', true)
		if(popup) {
			var title = document.createElement('h3')
			title.innerHTML = 'Configure ' + options.name
			form.appendChild(title)
		}
		if(options.geo.addresses) {
			var addresses = document.createElement('div')
			addresses.classList.add('address-container')
		}
		var status = document.createElement('div')
		status.classList.add('group-container')
		var div = document.createElement('div')
		div.innerHTML = 'Status'
		status.appendChild(div)
		var type = document.createElement('div')
		type.classList.add('group-container')
		div = document.createElement('div')
		div.innerHTML = 'Type'
		type.appendChild(div)
		var label, input, enabledInput
		for(var key in obj) {
			if(obj.hasOwnProperty(key) && !(options.hiddenForm.includes(key))) {
				var isArray = Array.isArray(obj[key])
				var isDisabled = (options.disabled.includes(key)) || (obj.options.disabled && obj.options.disabled.includes(key))
				var isObject = options.objects.includes(key)
				var isLarge = options.large.includes(key)
				var isMedium = options.medium.includes(key)
				var isSmall = options.small.includes(key)
				var isNarrow = options.narrow.includes(key)
				var isWide = options.wide.includes(key)
				var isRequired = !options.nulls.includes(key)
				var attributes = {}
				var classes = []
				if(isRequired) { attributes.required = true }
				if(isDisabled) {
					attributes.disabled = true
				} else {
					enabledInput = true
				}
				if(options.numbers.includes(key) || options.percents.includes(key) || options.prices.includes(key)) {
					classes.push('narrow')
					attributes.type = 'number'
					attributes.step = options.prices.includes(key) ? '0.01' : 'any'
				} else if(isNarrow) {
					classes.push('narrow')
				} else if(isWide) {
					classes.push('wide')
				}
				if(isLarge || isMedium || isSmall) {
					var textarea = this.createTextArea(key, obj[key], isLarge ? 'large' : (isMedium ? 'medium' : 'small'), attributes)
					label = this.createLabel(key, lw8.getName(key), options.titles.hasOwnProperty(key) ? options.titles[key] : 'Tab - indent\nCtrl+d - Duplicate\nCtrl+b = HTML Bold\nCtrl+i = HTML Italic\nCtrl+Enter = HTML Break')
					options.addToIdProperties.hasOwnProperty(key) && label.addEventListener('click', function() {
						var id = this.getAttribute('for')
						document.body.appendChild(lw8form.createForm(options.addToIdProperties[id].default, options.addToIdProperties[id], true, function(res) {
							var textarea = document.querySelector('#'+id)
							var start = textarea.selectionStart
							var end = textarea.selectionEnd
							textarea.value = textarea.value.substring(0, start)+(res.data.model.mimeType.indexOf('image/') === 0 ? '!' : '')+'['+(start !== end ? textarea.value.substring(start, end) : 'Link Text')+'](/pub/'+encodeURI(res.data.model.filename)+' "Title")'+textarea.value.substring(end)
							return false
						}))
					})
					form.appendChild(this.createInputContainer(label, textarea))
					options.autofill && options.autofill.hasOwnProperty(key) && this.setupAutofill(textarea, options.autofill[key])
				} else if(isArray || isObject) {
					form.appendChild(this.createArray(key, obj[key], isDisabled, isObject, options.autofill))
				} else if(options.ids.hasOwnProperty(key)) {
					form.appendChild(this.createSelect(key, obj[key], options.ids[key], isDisabled))
					form.lastElementChild.firstElementChild.dispatchEvent(new Event('change'))
				} else if(options.files.includes(key)) {
					form.appendChild(this.createInputContainer(this.createLabel(key, lw8.getName(key), options.titles[key]), this.createInput('file', '', {type: 'file'})))
				} else if(obj[key] === true || obj[key] === false) {
					label = this.createCheckbox(key, obj[key], isDisabled)
					if(options.geo.return && options.geo.return === key && options.geo.distance) {
						label.querySelector('input').addEventListener('change', function() {
							var d = lw8form.getParentForm(this).querySelector('input[name='+options.geo.distance+']')
							if(d.value) { d.value = this.checked ? d.value * 2 : d.value / 2 }
						})
					}
					if(key.indexOf('status') === 0) {
						status.appendChild(label)
					} else if(key.indexOf('type') === 0) {
						type.appendChild(label)
					} else {
						form.appendChild(label)
					}
				} else if(typeof lw8geo === 'object' && options.geo.addresses && options.geo.addresses.includes(key)) {
					addresses.appendChild(lw8geo.createAddressInputs(obj[key], key, options.geo.distance))
					options.geo.addresses.indexOf(key) === options.geo.addresses.length - 1 && form.appendChild(addresses)
					if(options.geo.addresses.length === 2 && options.geo.addresses.indexOf(key) === 1 && key !== 'addNewAddress') {
						var swap = document.createElement('div')
						swap.classList.add('icon-swap')
						swap.addEventListener('click', function() {
							var addresses = this.parentNode.parentNode.parentNode
							var temp = addresses.firstElementChild.querySelector('div:nth-child(2):not(.icon-edit)').innerHTML
							addresses.firstElementChild.querySelector('div:nth-child(2):not(.icon-edit)').innerHTML = addresses.lastElementChild.querySelector('div:nth-child(2):not(.icon-edit)').innerHTML
							addresses.lastElementChild.querySelector('div:nth-child(2):not(.icon-edit)').innerHTML = temp
							var inputs = addresses.firstElementChild.querySelectorAll('input')
							var inputs2 = addresses.lastElementChild.querySelectorAll('input')
							for(var i = 0; i < inputs.length; i++) {
								temp = inputs[i].value
								inputs[i].value = inputs2[i].value
								inputs2[i].value = temp
							}
						})
						addresses.firstElementChild.firstElementChild.appendChild(swap)
					}
				} else if(typeof lw8geo === 'object' && options.geo.addresses && options.geo.distance === key) {
					attributes.autocomplete = 'new-password'
					input = this.createInput(key, obj[key], attributes, classes)
					options.geo.addresses.length > 1 && input.addEventListener('focus', function() {
						!this.value && lw8geo.getDistance(this, options.geo.addresses[0], options.geo.addresses[1], options.geo.return)
					})
					label = this.createLabel(key, lw8.getName(key), options.titles[key])
					options.geo.addresses.length > 1 && label.addEventListener('click', function() {
						lw8geo.getDirectionsLink(options.geo.addresses[0], options.geo.addresses[1])
					})
					options.geo.addresses.length > 1 && label.classList.add('pointer')
					form.appendChild(this.createInputContainer(label, input))
				} else if(options.images.includes(key)) {
					var img = document.createElement('img')
					img.setAttribute('src', obj[key])
					img.setAttribute('onerror', 'this.onerror=null;this.src="/imgs/missing-piece-960px.jpg";')
					form.appendChild(this.createInputContainer(this.createLabel(key, lw8.getName(key), options.titles[key]), img))
				} else {
					var isTime = options.dateTimes.includes(key)
					var val = undefined
					if((options.dates.includes(key) || options.today === key)) {
						classes.push('datepicker')
						val = !obj[key] && options.today === key && !isTime ? this.formatDateTime(new Date, false) : obj[key]
					} else {
						val = obj[key]
					}
					isTime && classes.push('timepicker')
					input = this.createInput(key, val, attributes, classes)
					form.appendChild(this.createInputContainer(this.createLabel(key, lw8.getName(key), options.titles[key]), input))
					options.autofill && options.autofill.hasOwnProperty(key) && this.setupAutofill(input, options.autofill[key])
				}
				options.descriptions.hasOwnProperty(key) && form.appendChild(this.createDescription(options.descriptions[key]))
			}
		}
		if(obj.options && obj.options.idArrays) {
			for(key in obj.options.idArrays) {
				if(obj.options.idArrays.hasOwnProperty(key) && obj.options.idArrays[key].length !== 0) {
					div = document.createElement('div')
					div.classList.add('group-container')
					title = document.createElement('div')
					title.innerHTML = lw8.getName(key.slice(0, -3))
					div.appendChild(title)
					div.appendChild(this.createIdArray(key, obj.options.idArrays[key]))
					form.appendChild(div)
				}
			}
		}
		status.querySelector('input:not([name=statusDefault])') && form.appendChild(status)
		type.querySelector('input:not([name=typeDefault])') && form.appendChild(type)
		var params = lw8.getURLParams()
		params && params.has('sortField') && form.appendChild(this.createInput('sortField', params.get('sortField'), {hidden: true}))
		params && params.has('sortDir') && form.appendChild(this.createInput('sortDir', params.get('sortDir'), {hidden: true}))
		params && params.has('filterStartDate') && form.appendChild(this.createInput('filterStartDate', params.get('filterStartDate'), {hidden: true}))
		params && params.has('filterEndDate') && form.appendChild(this.createInput('filterEndDate', params.get('filterEndDate'), {hidden: true}))
		params && params.has('asUserId') && form.appendChild(this.createInput('asUserId', params.get('asUserId'), {hidden: true}))
		for(key in options.default) {
			if(params && options.default.hasOwnProperty(key)) {
				let filter = 'filter'+key.charAt(0).toUpperCase()+key.slice(1)
				!options.hiddenTable.includes(key) && params.has(filter) && form.appendChild(this.createInput(filter, params.get(filter), {hidden: true}))
			}
		}
		attributes = {type: 'submit'}
		if(!enabledInput) { attributes.disabled = true }
		form.appendChild(this.createInput('', (lw8.isNumeric(obj.id) ? 'Update ' : 'Add ')+options.name, attributes))
		if(lw8.isNumeric(obj.id)) {
			form.appendChild(this.createInput('id', obj.id, {hidden: true}))
			if(options.canAdd && (!obj.options || obj.options.canAdd !== false)) {
				var button = this.createInput('', 'Duplicate '+options.name, {type: 'button'}, ['alt'])
				button.addEventListener('click', function() {
					var form = this.parentNode
					form.querySelector('input[name=id]').remove()
					form.querySelector('input[type=submit]').value = 'Add '+options.name
					form.querySelector('input[type=button]:last-child').remove()
					var disableds = form.querySelectorAll(':disabled')
					for(var i = 0; i < disableds.length; i++) {
						!(options.disabled.includes(disableds[i].name)) && disableds[i].removeAttribute('disabled')
					}
					this.remove()
				})
				form.appendChild(button)
			}
			if(options.canRemove && (!obj.options || obj.options.canRemove !== false)) {
				button = this.createInput('', 'Remove '+options.name, {type: 'button', 'data-id': obj.id}, ['alt'])
				button.addEventListener('click', function() {
					var e = this
					if(this.value === 'Remove') {
						this.value = 'Are you sure?'
						this.classList.remove('alt')
					} else {
						let obj = {
							id: this.getAttribute('data-id'),
							token: localStorage.getItem('8n-session-csrf')
						}
						let params = lw8.getURLParams()
						if(params && params.has('asUserId')) { obj.asUserId = params.get('asUserId') }
						lw8.ajaxJSON('delete', '', obj, function(res) {
							lw8.hideDialog(e)
							typeof lw8table === 'object' && res.data && lw8table.updateRow(res.data)
						})
					}
				})
				form.appendChild(button)
			}
		}
		this.setupForms(form, !lw8.isNumeric(obj.id), success)
		if(popup) {
			var middle = document.createElement('div')
			middle.classList.add('popup-middle')
			middle.appendChild(form)
			div = document.createElement('div')
			div.classList.add('popup', 'remove')
			div.appendChild(middle)
			lw8.setupPopups(div)
			return div
		}
		return form
	}

	_lw8form.prototype.createIdArray = function(key, array) {
		var table = document.createElement('table')
		var tr = document.createElement('tr')
		for(var header in array[0]) {
			if(array[0].hasOwnProperty(header) && header !== 'checked') {
				var th = document.createElement('th')
				if(header === 'id') {
					var input = document.createElement('input')
					input.setAttribute('type', 'checkbox')
					input.addEventListener('change', function() {
						var inputs = this.parentNode.parentNode.parentNode.querySelectorAll('input')
						for(var i = 1; i < inputs.length; i++) { inputs[i].checked = this.checked }
					})
					th.appendChild(input)
				} else {
					th.innerHTML = lw8.getName(header)
				}
				tr.appendChild(th)
			}
		}
		table.appendChild(tr)
		for(var i = 0; i < array.length; i++) {
			tr = document.createElement('tr')
			for(header in array[i]) {
				if(array[i].hasOwnProperty(header) && header !== 'checked') {
					var td = document.createElement('td')
					if(header === 'id') {
						input = document.createElement('input')
						input.setAttribute('type', 'checkbox')
						input.setAttribute('name', key+'[]')
						input.value = array[i].id
						array[i].checked && input.setAttribute('checked', 'true')
						td.appendChild(input)
					} else {
						td.innerHTML = array[i][header]
					}
					tr.appendChild(td)
				}
			}
			table.appendChild(tr)
		}
		return table
	}

	_lw8form.prototype.createInput = function(key, value, attributes, classes) {
		var input = document.createElement('input')
		key && input.setAttribute('id', key)
		key && input.setAttribute('name', key)
		for(var attribute in attributes) { attributes.hasOwnProperty(attribute) && input.setAttribute(attribute, attributes[attribute]) }
		for(var i = 0; i < (classes || []).length; i++) { input.classList.add(classes[i]) }
		if(value || value === 0) { input.value = value }
		return input
	}

	_lw8form.prototype.createInputContainer = function(label, input) {
		var div = document.createElement('div')
		div.appendChild(input)
		div.appendChild(label)
		return div
	}

	_lw8form.prototype.createLabel = function(key, value, title) {
		var label = document.createElement('label')
		label.setAttribute('for', key)
		if(value) { label.innerHTML = value }
		title && label.setAttribute('title', title)
		return label
	}

	_lw8form.prototype.createRadio = function(key, value, isDisabled, option, isChecked) {
		var input = document.createElement('input')
		input.setAttribute('id', key+option)
		input.setAttribute('name', key)
		input.setAttribute('type', 'radio')
		input.setAttribute('value', value)
		isChecked && input.setAttribute('checked', 'true')
		isDisabled && input.setAttribute('disabled', 'true')
		var label = this.createLabel(key+option, option)
		label.insertBefore(input, label.firstChild)
		return label
	}

	_lw8form.prototype.createSelect = function(key, value, options, isDisabled, index, horizontal) {
		if(options.length > 6 || horizontal) {
			var select = document.createElement('select')
			select.setAttribute('id', key)
			select.setAttribute('name', key)
			index !== undefined && index !== null && select.setAttribute('data-index', index)
			isDisabled && select.setAttribute('disabled', 'true')
			for(var i = 0; i < options.length; i++) {
				var option = document.createElement('option')
				option.setAttribute('value', options[i].id)
				option.innerHTML = options[i].name
				options[i].title && option.setAttribute('title', options[i].title)
				select.appendChild(option)
			}
			window.lw8tableOptions && select.addEventListener('change', function() {
				var next = this.parentNode.nextElementSibling
				for(var i = 0; i < window.lw8tableOptions.ids[key].length; i++) {
					if(window.lw8tableOptions.ids[key][i].id === parseInt(this.value) || window.lw8tableOptions.ids[key][i].id === this.value) {
						var description = window.lw8tableOptions.ids[key][i].title
						if(next && next.id === key+'-description') {
							if(description) {
								next.innerHTML = description
							} else {
								next.remove()
							}
						} else {
							description && this.parentNode.parentNode.insertBefore(lw8form.createDescription(description, key+'-description'), next)
						}
						break
					}
				}
			})
			value && this.setValIfInOptions(select, value)
			var div = this.createInputContainer(this.createLabel(key, lw8.getName(key.slice(0, -2))), select)
			div.classList.add('select')
			return div
		} else {
			var container = document.createElement('div')
			container.classList.add('group-container', 'radios')
			container.setAttribute('id', key)
			index !== undefined && index !== null && container.setAttribute('data-index', index)
			var label = document.createElement('div')
			label.innerHTML = lw8.getName(key.slice(0, -2))
			container.appendChild(label)
			for(var i = 0; i < options.length; i++) {
				if(!isDisabled || options[i].id === parseInt(value)) {
					container.appendChild(lw8form.createRadio(key, options[i].id, isDisabled, options[i].name, i === 0 || options[i].id === parseInt(value)))
					options[i].title && container.appendChild(lw8form.createDescription(options[i].title))
				}
			}
			return container
		}
	}

	_lw8form.prototype.createTextArea = function(key, value, size, attributes) {
		var textarea = document.createElement('textarea')
		textarea.setAttribute('id', key)
		textarea.setAttribute('name', key)
		textarea.classList.add(size)
		for(var attribute in attributes) { attributes.hasOwnProperty(attribute) && textarea.setAttribute(attribute, attributes[attribute]) }
		textarea.innerHTML = value ? value.toString().replace(/&(#\d{1,7}|[A-Za-z]{2,20});/g, function(match, match2) {return '&__'+match2+'__;';}) : ''
		textarea.addEventListener('keydown', function(ev) {
			var start = this.selectionStart
			var end = this.selectionEnd
			if(ev.key === 'Tab') {
				ev.preventDefault()
				if(start !== end && this.value.substring(start, end).indexOf('\n') !== -1) {
					this.value = this.value.substring(0, start)+this.value.substring(start, end).replace(/\n/g, '\n\t')+this.value.substring(end)
					this.selectionStart = this.selectionEnd = start
				} else {
					this.value = this.value.substring(0, start)+'\t'+this.value.substring(end)
					this.selectionStart = this.selectionEnd = start + 1
				}
			} else if(ev.ctrlKey) {
				switch(ev.key) {
					case 'b':
						ev.preventDefault()
						this.value = this.value.substring(0, start)+'<strong>'+this.value.substring(start, end)+'</strong>'+this.value.substring(end)
						this.selectionStart = this.selectionEnd = end + 17
						break
					case 'i':
						ev.preventDefault()
						this.value = this.value.substring(0, start)+'<em>'+this.value.substring(start, end)+'</em>'+this.value.substring(end)
						this.selectionStart = this.selectionEnd = end + 9
						break
					case 'd':
						ev.preventDefault()
						this.value = this.value.substring(0, start)+this.value.substring(start, end)+this.value.substring(start, end)+this.value.substring(end)
						this.selectionStart = start
						this.selectionEnd = end
						break
					case 'Enter':
						ev.preventDefault()
						this.value = this.value.substring(0, start)+'<br/>\n'+this.value.substring(start)
						this.selectionStart = this.selectionEnd = start + 6
						break
				}
			}
		})
		return textarea
	}

	_lw8form.prototype.encodeField = function(value) {
		return encodeURIComponent(value.replace(/&__(#\d{1,7}|[A-Za-z]{2,20})__;/g, function(match, match2) {return '&'+match2+';';}))
	}

	//see lw8date.formatDate
	_lw8form.prototype.formatDateTime = (date, includeTime)=>{
		includeTime = includeTime !== false
		return date.getFullYear()+'-'+('0'+(date.getMonth()+1)).slice(-2)+'-'+('0'+date.getDate()).slice(-2)+(includeTime ? ' '+('0'+date.getHours()).slice(-2)+':'+('0'+date.getMinutes()).slice(-2)+':'+('0'+date.getSeconds()).slice(-2) : '')
	}

	_lw8form.prototype.getParentForm = function(e) {
		var f = e.parentNode
		while(f.tagName !== 'FORM' && f !== document.body) { f = f.parentNode }
		return f
	}

	_lw8form.prototype.handleAjaxForm = function(e, success, error, complete) {
		var field, query = {}
		if(typeof e === 'object' && e.nodeName === 'FORM') {
			var token = localStorage.getItem('8n-session-csrf')
			if(e.getAttribute('data-form-data') === 'true') {
				query = new FormData(e)
				token && query.append('token', token)
			} else {
				for(var i = 0; i < e.elements.length; i++) {
					field = e.elements[i]
					if(field.name && !field.disabled && field.type !== 'file' && field.type !== 'reset' && field.type !== 'submit' && field.type !== 'button') {
						if(field.type === 'select-multiple') {
							query[field.name] = []
							for(var j = 0; j < field.options.length; j++) {
								field.options[j].selected && query[field.name].push(this.encodeField(field.options[j].value))
							}
						} else if(field.name.lastIndexOf('[]') === field.name.length - 2) {
							var name = field.name.slice(0, -2)
							if(!Array.isArray(query[name])) { query[name] = [] }
							((field.type !== 'checkbox' && field.type !== 'radio') || field.checked) && query[name].push(this.encodeField(field.value))
						} else if(field.classList.contains('timepicker')) {
							query[field.name] = field.value ? this.toUTC(field.value) : field.value
						} else if((field.type !== 'checkbox' && field.type !== 'radio') || field.checked) {
							query[field.name] = this.encodeField(field.value)
						}
					}
				}
			}
			if(token) { query.token = token }
		}
		//v2
		if(query['g-recaptcha-response'] === '') {
			var recaptcha = e.querySelector('.g-recaptcha')
			recaptcha && recaptcha.classList.add('invalid')
			typeof error === 'function' && error()
			typeof complete === 'function' && complete()
			return
		}
		lw8.ajaxJSON(e.method, e.action.indexOf('?') !== -1 ? e.action.substring(0, e.action.indexOf('?')) : e.action, query, success, error, complete)
	}

	_lw8form.prototype.removeLoadingIndicator = function(e) {
		e = e.querySelector('div.loading')
		e && e.remove()
	}

	_lw8form.prototype.replaceSelectOptions = function(e, options) {
		var handler = function(e, index) {
			if(index !== null) {
				var f = lw8form.getParentForm(e)
				var select = f.querySelector('#' + window.lw8formOptions[index].references)
				if(select) {
					for(var i = 0; i < window.lw8formOptions[index].options.length; i++) {
						if(window.lw8formOptions[index].options[i].id === parseInt(e.value)) {
							lw8form.replaceSelectOptions(select, window.lw8formOptions[index].options[i].options)
							return
						}
					}
					lw8form.replaceSelectOptions(select, [])
				}
			}
		}
		var value = e.value
		if(value === undefined) {
			var inputs = e.querySelectorAll('input')
			for(var i = 0; i < inputs.length; i++) {
				if(inputs[i].checked) { value = inputs[i].value }
			}
		}
		var select = lw8form.createSelect(e.id, value, options, false, e.getAttribute('data-index'), lw8form.getParentForm(e).classList.contains('horizontal'))
		if(e.tagName === 'SELECT') { e = e.parentNode }
		e.parentNode.insertBefore(select, e)
		if(select.classList.contains('select')) {
			select.firstElementChild.addEventListener('change', function() {
				handler(this, this.getAttribute('data-index'))
			})
			select.firstElementChild.dispatchEvent(new Event('change'))
		} else {
			var radios = select.querySelectorAll('input')
			for(var j = 0; j < radios.length; j++) {
				radios[j].addEventListener('change', function() {
					this.checked && handler(this, this.parentNode.parentNode.getAttribute('data-index'))
				})
				radios[j].checked && radios[j].dispatchEvent(new Event('change'))
			}
		}
		if(e.nextElementSibling && e.nextElementSibling.classList.contains('description')) { e.nextElementSibling.remove() }
		e.remove()
	}

	_lw8form.prototype.setupAutofill = function(input, options, postfix, listener) {
		input.setAttribute('autocomplete', 'off')
		input.addEventListener('blur', function() {
			var ul = this.parentNode.querySelector('ul')
			ul && setTimeout(function () { ul.remove() }, 400)
		})
		input.addEventListener('keydown', function(ev) { ev.key === 'Enter' && ev.preventDefault() })
		input.addEventListener('keyup', function(ev) {
			var ul = this.parentNode.querySelector('ul')
			if(ul) {
				var selected = ul.querySelector('.selected')
				switch(ev.key) {
					case 'ArrowDown':
						selected && selected.classList.remove('selected');
						((selected && selected.nextElementSibling) || ul.firstElementChild).classList.add('selected')
						return
					case 'ArrowUp':
						selected && selected.classList.remove('selected');
						((selected && selected.previousElementSibling) || ul.lastElementChild).classList.add('selected')
						return
					case 'Enter':
						selected && selected.firstElementChild.dispatchEvent(new Event('click'))
						return
				}
			}
		})
		input.addEventListener('input', function(ev) {
			var e = this
			var ul = this.parentNode.querySelector('ul')
			if(this.value.length > 16 || (options.minLength && this.value.length < options.minLength)) {
				ul && setTimeout(function () { ul.remove() }, 100)
				return
			}
			this.value && this.value !== this.getAttribute('data-old-value') && lw8.ajaxJSON('get', options.href + this.value, options.obj || {}, function(res) {
				if(res.data && Object.keys(res.data).length) {
					var ul = document.createElement('ul')
					for(var key in res.data) {
						if(res.data.hasOwnProperty(key)) {
							var li = document.createElement('li')
							var label = document.createElement('div')
							label.setAttribute('data-val', key)
							label.innerHTML = key
							label.setAttribute('data-prefixes', options.prefixes ? options.prefixes.join() : '')
							label.addEventListener('click', listener ? (ev)=>{listener(ev, res)} : function() {
								var val = this.getAttribute('data-val')
								var prefixes = this.getAttribute('data-prefixes')
								if(prefixes) { prefixes = prefixes.split(',') }
								for(var i = 0; i <= (prefixes || []).length; i++) {
									var target = i < (prefixes || []).length ? input.id.replace(prefixes[i], '').charAt(0).toLowerCase() + input.id.replace(prefixes[i], '').slice(1) : input.id
									target = target.replace(postfix, '')
									if(res.data[val].hasOwnProperty(target)) {
										var txt = document.createElement('textarea')
										txt.innerHTML = res.data[val][target]
										var el = lw8form.getParentForm(this).querySelector('#' + input.id)
										el.setAttribute('data-old-value', txt.value)
										el.value = txt.value
									}
								}
								this.parentNode.parentNode.remove()
							})
							li.appendChild(label)
							if(options.multifill) {
								var icon = document.createElement('div')
								icon.setAttribute('data-val', key)
								icon.setAttribute('data-prefixes', options.prefixes ? options.prefixes.join() : '')
								icon.classList.add('icon-paste')
								icon.addEventListener('click', function() {
									var form = lw8form.getParentForm(this)
									var val = this.getAttribute('data-val')
									var prefixes = this.getAttribute('data-prefixes')
									if(prefixes) { prefixes = prefixes.split(',') }
									for(var key in res.data[val]) {
										if(res.data[val].hasOwnProperty(key)) {
											for(var i = 0; i <= (prefixes || []).length; i++) {
												var target = i < (prefixes || []).length ? lw8.getPrefixedName(prefixes[i], key) : key
												if(window.lw8formOptions) {
													var references = target
													var id = res.data[val][key]
													for(var j = window.lw8formOptions.length - 1; j >= 0; j--) {
														if(window.lw8formOptions[j].references === references) {
															var options = window.lw8formOptions[j].options.find(function(i) {
																for(var j = 0; j < i.options.length; j++) {
																	if(i.options[j].id === id) { return true }
																}
																return false
															})
															if(options) {
																references = window.lw8formOptions[j].id
																var select = document.querySelector('#'+references)
																lw8form.setValIfInOptions(select, options.id, true)
																select = document.querySelector('#'+window.lw8formOptions[j].references)
																lw8form.setValIfInOptions(select, id, true)
																id = options.id
															}
														}
													}
												}
												var input = form.querySelector('#'+target+(postfix ? postfix : ''))
												input && input.setAttribute('data-old-value', res.data[val][key])
												input && lw8form.setValIfInOptions(input, res.data[val][key], true)
											}
										}
									}
									this.parentNode.parentNode.remove()
								})
								li.appendChild(icon)
							}
							ul.appendChild(li)
						}
					}
				}
				var oldUl = e.parentNode.querySelector('ul')
				oldUl && oldUl.remove()
				ul && e.parentNode.appendChild(ul)
			}, undefined, undefined, true)
			this.setAttribute('data-old-value', this.value)
		})
		return input
	}

	_lw8form.prototype.setupDatepickers = function(e) {
		var datepickers = e.querySelectorAll('.datepicker')
		for(var i = 0; i < datepickers.length; i++) {
			datepickers[i].setAttribute('autocomplete', 'new-password')
			datepickers[i].setAttribute('readonly', 'true')
			var showTime = datepickers[i].classList.contains('timepicker')
			if(showTime && datepickers[i].value) { datepickers[i].value = this.toLocal(datepickers[i].value) }
			window[datepickers[i].getAttribute('id')] = new Pikaday({
				enableSelectionDaysInNextAndPreviousMonths: true,
				field: datepickers[i],
				format: showTime,
				onSelect: function(date) {
					var e = this._o.field
					if(e.hasAttribute('data-end') && document.querySelector('#'+e.getAttribute('data-end')).value <= this.toString()) {
						date.setDate(date.getDate() + 1)
						window[e.getAttribute('data-end')].setDate(date)
					} else if(e.hasAttribute('data-start') && document.querySelector('#'+e.getAttribute('data-start')).value >= this.toString()) {
						date.setDate(date.getDate() - 1)
						window[e.getAttribute('data-start')].setDate(date)
					}
				},
				showDaysInNextAndPreviousMonths: true,
				showTime: showTime,
				toString: (date, showTime)=>(lw8form.formatDateTime(date, showTime)),
				yearRange: [1950, 2025],
			})
			if(!datepickers[i].hasAttribute('required') || datepickers[i].getAttribute('required') === false) {
				var remove = document.createElement('div')
				remove.classList.add('icon-remove')
				remove.setAttribute('data-id', datepickers[i].getAttribute('id'))
				remove.addEventListener('click', function() {
					!document.querySelector('#'+this.getAttribute('data-id')).getAttribute('disabled') && window[this.getAttribute('data-id')].setDate(null)
				})
				datepickers[i].parentNode.append(remove)
			}
		}
	}

	_lw8form.prototype.setupForms = function(e, fillParams, success) {
		fillParams = fillParams !== false
		var forms = e.querySelectorAll('form')
		if(forms.length === 0 && e !== document) { forms = [e] }
		for(var i = 0; i < forms.length; i++) {
			!(forms[i].hasAttribute('data-ajax') && forms[i].getAttribute('data-ajax') === 'false') ? forms[i].addEventListener('submit', function(ev) {
				ev.preventDefault()
				var el = this
				var input = el.querySelector('input[name=g-recaptcha-response]')
				input && input.hasAttribute('g-recaptcha-key') && grecaptcha && grecaptcha.ready(function() {
					grecaptcha.execute(input.getAttribute('g-recaptcha-key'), {action: el.querySelector('input[name=g-recaptcha-action]').value}).then(function(token) {
						input.value = token
						lw8form.getParentForm(input).querySelector('input[type="submit"]').click()
					})
				})
				var buttons = el.querySelectorAll('input[type=submit],input[type=button]')
				for(var j = 0; j < buttons.length; j++) {
					buttons[j].setAttribute('disabled', 'true')
				}
				lw8form.addLoadingIndicator(el)
				lw8form.handleAjaxForm(el,
					function(res) {
						if(!el.hasAttribute('data-reset') || el.getAttribute('data-reset') !== 'false') {
							el.reset()
							//v2
							try {
								grecaptcha.reset()
							} catch(e) {}
							var inputs = el.querySelectorAll('input,textarea')
							for(var j = 0; j < inputs.length; j++) {
								inputs[j].removeAttribute('data-blurred')
							}
							var selects = el.querySelectorAll('select,div.radios')
							for(j = 0; j < selects.length; j++) {
								selects[j].hasAttribute('data-default') && lw8form.setValIfInOptions(selects[j], selects[j].getAttribute('data-default'))
							}
						}
						el.hasAttribute('data-gtm-event') && typeof dataLayer !== 'undefined' && dataLayer.push({'event': '8nEvent', '8nEventName': el.getAttribute('data-gtm-event')});
						(typeof success === 'function' ? success(res) : true) && typeof lw8table === 'object' && res.data && lw8table.updateRow(res.data)
						lw8.hideDialog(el)
					},
					undefined,
					function(res) {
						for(var j = 0; j < buttons.length; j++) {
							buttons[j].removeAttribute('disabled')
						}
						lw8form.removeLoadingIndicator(el)
					}
				)
			}) : forms[i].addEventListener('submit', function(ev) {
				ev.preventDefault()
				var input = this.querySelector('input[name=g-recaptcha-response]')
				input && input.hasAttribute('g-recaptcha-key') && grecaptcha && grecaptcha.ready(function() {
					grecaptcha.execute(input.getAttribute('g-recaptcha-key'), {action: input.getAttribute('g-recaptcha-action')}).then(function(token) {
						input.value = token
					})
				})
				var timepickers = this.querySelectorAll('.timepicker')
				for(var i = 0; i < timepickers.length; i++) {
					timepickers[i].value = timepickers[i].value ? lw8form.toUTC(timepickers[i].value) : timepickers[i].value
				}
				this.submit()
				this.hasAttribute('data-gtm-event') && typeof dataLayer !== 'undefined' && dataLayer.push({'event': '8nEvent', '8nEventName': this.getAttribute('data-gtm-event')})
			})
		}
		this.setupFormOptions(e)
		var params = lw8.getURLParams()
		var inputs = e.querySelectorAll('input,textarea')
		for(i = 0; i < inputs.length; i++) {
			var input = inputs[i]
			if(input.type !== 'checkbox' && input.type !== 'radio') {
				input.addEventListener('input', function() {
					var equals = true
					var inDiv = false
					var next = this.nextElementSibling
					if(next && next.tagName === 'LABEL' && next.parentNode.childElementCount === 2) {
						next = this.parentNode.nextElementSibling
						inDiv = true
					}
					if(!next || next.tagName !== 'P' || !next.classList.contains('invalid')) {
						next = undefined
					}
					this.checkValidity()
					if(this.hasAttribute('data-equal')) {
						var f = lw8form.getParentForm(this)
						var e = f.querySelector('[name="'+this.getAttribute('data-equal')+'"]')
						equals = e.value === this.value
					}
					this.setCustomValidity('')
					this.setAttribute('title', '')
					if(this.validity.valid && equals) {
						this.classList.remove('invalid')
						next && next.remove()
					} else {
						if(this.hasAttribute('data-blurred')) {
							this.classList.add('invalid')
							if(next) {
								next.innerHTML = this.hasAttribute('data-validation-message') ? this.getAttribute('data-validation-message') : this.validationMessage
							} else {
								var p = document.createElement('p')
								p.classList.add('invalid')
								p.innerHTML = this.hasAttribute('data-validation-message') ? this.getAttribute('data-validation-message') : this.validationMessage
								inDiv ? this.parentNode.parentNode.insertBefore(p, this.parentNode.nextElementSibling) : this.parentNode.insertBefore(p, this.nextElementSibling)
							}
						}
						if(this.hasAttribute('data-validation-message')) {
							this.setCustomValidity(this.getAttribute('data-validation-message'))
							this.setAttribute('title', this.getAttribute('data-validation-message'))
						}
					}
				})
				input.addEventListener('blur', function() {
					this.value.length > 0 && this.setAttribute('data-blurred', true)
					this.dispatchEvent(new Event('input'))
				})
			}
			if(fillParams && params && params.has(input.getAttribute('name')) && input.type !== 'radio') {
				input.value = params.get(input.getAttribute('name'))
				input.dispatchEvent(new Event('blur'))
			}
			if(input.hasAttribute('data-equal')) {
				var f = this.getParentForm(input)
				var ee = f.querySelector('[name="'+input.getAttribute('data-equal')+'"]')
				ee.addEventListener('input', function() {
					var f = lw8form.getParentForm(this)
					var ee = f.querySelector('[data-equal="'+this.getAttribute('name')+'"]')
					ee.dispatchEvent(new Event('input'))
				})
			}
		}
		inputs = e.querySelectorAll('select,div.radios')
		for(i = 0; i < inputs.length; i++) {
			inputs = e.querySelectorAll('select,div.radios') //update the nodelist
			if(i >= inputs.length) { continue } //this should never happen but it could prevent an error
			if(fillParams && params && params.has(inputs[i].getAttribute('id'))) {
				this.setValIfInOptions(inputs[i], params.get(inputs[i].getAttribute('id')), true)
			} else if(inputs[i].hasAttribute('data-default')) {
				this.setValIfInOptions(inputs[i], inputs[i].getAttribute('data-default'))
			}
		}
		this.setupDatepickers(e)
	}

	_lw8form.prototype.setupFormOptions = function(e) {
		for(var i = (window.lw8formOptions || []).length - 1; i >= 0 ; i--) {
			var select = e.querySelector('#'+window.lw8formOptions[i].id)
			if(select) {
				select.setAttribute('data-index', i)
				this.replaceSelectOptions(select, window.lw8formOptions[i].options)
			}
		}
	}

	_lw8form.prototype.setValIfInOptions = function(e, val, dispatch) {
		if(e.tagName === 'SELECT') {
			var options = e.querySelectorAll('option')
			for(var i = 0; i < options.length; i++) {
				if(val.toString() === options[i].value) {
					e.value = val
					dispatch && e.dispatchEvent(new Event('change'))
					return true
				}
			}
		} else if(e.tagName === 'DIV' && e.classList.contains('radios')) {
			var options = e.querySelectorAll('input')
			for(var i = 0; i < options.length; i++) {
				if(val.toString() === options[i].value) {
					options[i].setAttribute('checked', 'true')
					dispatch && options[i].dispatchEvent(new Event('change'))
					return true
				}
			}
		} else {
			e.value = val
			dispatch && e.dispatchEvent(new Event('input'))
			return true
		}
		return false
	}

	_lw8form.prototype.toLocal = function(timestamp) {
		return this.formatDateTime(lw8.simpleUTCDateTimeParse(timestamp))
	}

	_lw8form.prototype.toUTC = function(timestamp) {
		let date = lw8.simpleUTCDateTimeParse(timestamp, false)
		return date.getUTCFullYear()+'-'+('0'+(date.getUTCMonth()+1)).slice(-2)+'-'+('0'+date.getUTCDate()).slice(-2)+' '+('0'+date.getUTCHours()).slice(-2)+':'+('0'+date.getUTCMinutes()).slice(-2)+':'+('0'+date.getUTCSeconds()).slice(-2)
	}

	global.lw8form = new _lw8form()
	try {
		lw8form.setupForms(document)
	} catch(e) {
		lw8.logEvent(e)
	}
})(typeof self !== 'undefined' && self || typeof window !== 'undefined' && window || this)