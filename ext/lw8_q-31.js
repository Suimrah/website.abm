//Copyright (c) 2018, 8-nines Consulting, LLC. All rights reserved. 8-nines.com

(function(global) {
	'use strict'
	function _lw8() {
		try {
			if(sessionStorage.getItem('8n-refresh-page') == 1) {
				sessionStorage.removeItem('8n-refresh-page')
				window.location.reload()
				//somehow we were executing code after this
			} else {
				this.lastScroll = 0
				this.navElem = document.getElementById('nav')
				this.notificationsElem = document.getElementById('notifications')
				this.scrollToTopElem = document.getElementById('scroll-to-top')
				this.subscribeElems = document.getElementsByClassName('subscribe')
				this.refreshTimeout = false

				this.scrollPeek()
				this.setupPopups(document)
				this.setupAjaxHTMLs(document)
				this.setupLinks(document)
				this.setupScrollTo()
				this.setupSlideovers(document)
				this.setupSubscribes()
				this.setupLocalData()
				this.setupNotifications()
				this.addInfoEmail()
				this.setupSession()
				this.removeExpiredElements(document)
				document.addEventListener('DOMContentLoaded', function() {
					try {
						lw8.adjustHeaderHeight()
					} catch(e) {
						lw8.logEvent(e)
					}
				})

				var year = parseInt(new Date().getFullYear())
				if(year > 2018 && document.getElementById('copyright-year')) { document.getElementById('copyright-year').innerHTML = year }
				window && window.lw8Options && window.lw8Options.applicationServerKey && 'PushManager' in window && this.setupPushNotifications(window.lw8Options.pushRequestElement || document)
			}
		} catch(e) {
			this.logEvent(e)
		}
	}

	_lw8.prototype.addInfoEmail = function() {
		var user = 'info'
		var address = user + '@' + window.location.hostname
		var infos = document.getElementsByClassName('info-email')
		for(var i = 0; i < infos.length; i++) {
			infos[i].setAttribute('href', 'mailto:' + address)
			if(infos[i].hasAttribute('data-div') && infos[i].getAttribute('data-div') === 'false') {
				infos[i].innerHTML = address
			} else {
				infos[i].innerHTML = '<div>' + address + '</div>'
			}
		}
	}

	_lw8.prototype.addNotification = function(type, innerHTML, persistent) {
		persistent = persistent === true
		var notification = document.createElement('div')
		notification.classList.add(type, 'hide', 'slideover', 'remove')
		var close = document.createElement('div')
		close.classList.add('close')
		close.addEventListener('click', function() {
			lw8.hideDialog(this)
		})
		notification.appendChild(close)
		var div = document.createElement('div')
		div.innerHTML = innerHTML
		notification.appendChild(div)
		console.log(type + ' - ' + innerHTML)
		this.notificationsElem.appendChild(notification)
		setTimeout(function() {
			notification.classList.remove('hide')
			!persistent && setTimeout(function() {lw8.hideDialog(notification)}, type === 'success' ? 3000 : 8000)
		}, 50)
	}

	_lw8.prototype.adjustHeaderHeight = function() {
		var nav = document.querySelector('#nav')
		var header = document.querySelector('header')
		if(nav && header && nav.offsetHeight > header.offsetHeight + 5) {
			header.style.height = nav.offsetHeight + 'px'
		} else if(header.style.height) {
			header.style.height = 0
		}
	}

	_lw8.prototype.ajaxJSON = function(method, url, obj, success, error, complete, quiet) {
		obj = obj || {}
		var xHTTP = new XMLHttpRequest()
		xHTTP.onreadystatechange = function() {
			if(this.readyState === 4) {
				try {
					var response = JSON.parse(this.responseText)
					if(response.status === 'ok') {
						typeof success === 'function' && success(response)
					} else {
						typeof error === 'function' && error(response)
					}
					typeof complete === 'function' && complete(response)
					if(response.redirect && response.redirect !== '') {
						if(response.redirect === '__BACK__') {
							sessionStorage.setItem('8n-refresh-page', 1)
							window.history.go(-1)
						} else if(response.redirect === '__REFRESH__') {
							window.location.reload()
						} else {
							window.location.href = response.redirect
						}
					}
					var i = 0
					if(response.notifications) {
						for(; i < response.notifications.length; i++) {
							lw8.addNotification(response.notifications[i].type, response.notifications[i].message, response.notifications[i].persistent)
						}
					}
					i === 0 && !quiet && lw8.addNotification(response.status === 'ok' ? 'success' : 'error', response.status)
					lw8.setupSession()
				} catch(e) {
					lw8.addNotification('error', 'There was an error processing your request. Please try again later.')
					typeof error === 'function' && error(response)
					typeof complete === 'function' && complete(response)
					lw8.logEvent(e)
				}
			}
		}
		if(method.toLowerCase() === 'get') {
			var query = Object.keys(obj).map(function(key){return key+'='+obj[key]}).join('&')
			if(query) { url += '?' + query }
		}
		xHTTP.open(method, url, true)
		xHTTP.setRequestHeader('Accept', 'application/json')
		!(obj instanceof FormData) && method.toLowerCase() !== 'get' && xHTTP.setRequestHeader('Content-Type', 'application/json')
		xHTTP.send(method.toLowerCase() === 'get' ? '' : (obj instanceof FormData ? obj : JSON.stringify(obj)))
	}

	_lw8.prototype.closeMenu = function() {
		var e = document.querySelector('#menu input')
		if(e && e.checked) { e.checked = false }
	}

	_lw8.prototype.confirmPopup = function(method, url, obj, message, buttonText) {
		obj = obj || {}
		var div = document.createElement('div')
		var p = document.createElement('p')
		p.innerHTML = message || 'Are you sure?'
		div.appendChild(p)
		var input = lw8form.createInput('', buttonText || 'Remove', {type: 'button'})
		input.addEventListener('click', function(ev) {
			var e = this
			var token = localStorage.getItem('8n-session-csrf')
			if(token) { obj.token = token }
			lw8.ajaxJSON(method, url, obj, function(res) {
				lw8.hideDialog(e)
				typeof lw8table === 'object' && res.data && lw8table.updateRow(res.data)
			})
		})
		div.appendChild(input)
		var middle = document.createElement('div')
		middle.classList.add('popup-center')
		middle.appendChild(div)
		div = document.createElement('div')
		div.classList.add('popup', 'remove')
		div.appendChild(middle)
		this.setupPopups(div)
		document.body.appendChild(div)
	}

	_lw8.prototype.empty = (i)=>(typeof i === 'undefined' || i === null || i === false || i === '' || i === 0 || i === '0' || i.length === 0 || (typeof i === 'object' && Object.keys(i).length === 0))

	_lw8.prototype.getCookie = function(name) {
		var cookies = document.cookie.split(';')
		for(var i = 0; i < cookies.length; i++) {
			var cookie = cookies[i].trim()
			if (cookie.indexOf(name+'=') === 0) {
				return cookie.substring(cookie.indexOf('=')+1)
			}
		}
		return false
	}

	_lw8.prototype.getElementColor = (e, prop)=>{
		let color = getComputedStyle(e)[prop || 'color']
		color = color.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i)
		return '#'+('0'+parseInt(color[1]).toString(16)).slice(-2)+('0'+parseInt(color[2]).toString(16)).slice(-2)+('0'+parseInt(color[3]).toString(16)).slice(-2)
	}

	_lw8.prototype.getName = function(name) {
		var title = name.charAt(0).toUpperCase() + name.slice(1).split(/(?=[A-Z\/])/).join(' ').replace(/_/g, ' ')
		if(title.indexOf('Status ') === 0) {
			title = title.slice(7)
		} else if(title.indexOf('Status') === 0 && title.length > 6) {
			title = title.slice(6)
		} else if(title.indexOf('Type ') === 0) {
			title = title.slice(5)
		} else if(title.indexOf('Type') === 0 && title.length > 4) {
			title = title.slice(4)
		}
		return title
	}

	_lw8.prototype.getPrefixedName = function(prefix, name) { return prefix + name.charAt(0).toUpperCase() + name.slice(1) }

	_lw8.prototype.getURLParams = function() { return typeof URLSearchParams !== 'undefined' ? new URLSearchParams(window.location.search) : undefined }

	_lw8.prototype.hideDialog = function(e, show) {
		show = show === true
		while(!e.classList.contains('popup') && !e.classList.contains('slideover') && !e.classList.contains('subscribe') && e !== document.body) {
			e = e.parentNode
		}
		if(e !== document.body) {
			show ? e.classList.remove('hide') : e.classList.add('hide')
			if(!show) {
				e.classList.contains('remove') && setTimeout(function() { e.remove() }, 500)
				var iframe = e.querySelector('iframe')
				iframe && iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*')
				var video = e.querySelector('video')
				video && video.pause()
			}
		}
	}

	_lw8.prototype.isNumeric = function(i) { return !isNaN(i - parseFloat(i)) }

	_lw8.prototype.logEvent = function(event, eventType, eventStatus) {
		console.log(event)
		if(event instanceof Error) { event = event.stack }
		eventType = eventType || 4
		eventStatus = eventStatus || 0
		var xHTTP = new XMLHttpRequest()
		xHTTP.open('POST', '/log-event', true)
		xHTTP.setRequestHeader('Content-Type', 'application/json')
		xHTTP.send(JSON.stringify({event: window.location.pathname + ' - ' + event, eventType: eventType, eventStatus: eventStatus}))
	}

	_lw8.prototype.prependAjaxHTML = function(url, target) {
		var xHTTP = new XMLHttpRequest()
		xHTTP.onreadystatechange = function() {
			if(this.readyState === 4) {
				var html = document.createElement('html')
				html.innerHTML = this.responseText
				for(let child of html.children[1].children) {
					lw8.setupSlideovers(child)
					typeof lw8date === 'object' && lw8date.setupCountdowns(child)
					target.parentNode.insertBefore(child, target)
					lw8.removeExpiredElements(child)
				}
			}
		}
		xHTTP.open('get', url, true)
		xHTTP.send()
	}

	_lw8.prototype.removeExpiredElements = function(e) {
		var expiringElements = e.querySelectorAll('.remove-after')
		if(expiringElements.length === 0 && e !== document && e.classList.contains('remove-after')) { expiringElements = [e] }
		for(var i = 0; i < expiringElements.length; i++) {
			this.simpleUTCDateTimeParse(expiringElements[i].getAttribute('data-after-value')) < Date.now() && expiringElements[i].remove()
		}
		expiringElements = e.querySelectorAll('.remove-before')
		if(expiringElements.length === 0 && e !== document && e.classList.contains('remove-before')) { expiringElements = [e] }
		for(i = 0; i < expiringElements.length; i++) {
			this.simpleUTCDateTimeParse(expiringElements[i].getAttribute('data-before-value')) > Date.now() && expiringElements[i].remove()
		}
	}

	_lw8.prototype.scrollPeek = function() {
		var scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop
		if(scrollTop > document.body.scrollHeight - document.body.offsetHeight - 100) {
			this.scrollToTopElem && this.scrollToTopElem.classList.add('hide')
		} else if(scrollTop > 500) {
			this.scrollToTopElem && this.scrollToTopElem.classList.remove('hide')
			if(scrollTop > this.lastScroll) {
				this.navElem && (this.navElem.classList.add('nav-hide'), this.notificationsElem.classList.add('nav-hide'))
			} else {
				this.navElem && (this.navElem.classList.remove('nav-hide'), this.notificationsElem.classList.remove('nav-hide'))
			}
		} else {
			this.scrollToTopElem && this.scrollToTopElem.classList.add('hide')
			this.navElem && (this.navElem.classList.remove('nav-hide'), this.notificationsElem.classList.remove('nav-hide'))
		}
		if(window && window.lw8Options && window.lw8Options.hideNavBackground && this.navElem) {
			if(scrollTop > 50) {
				this.navElem.classList.add('nav-background')
			} else {
				this.navElem.classList.remove('nav-background')
			}
		}
		if(scrollTop > 600) {
			for(var i = 0; i < this.subscribeElems.length; i++) {
				var subscribedStatus = this.getCookie('subscribed'+this.subscribeElems[i].getAttribute('data-campaign-name'))
				if(!(subscribedStatus == 1 || subscribedStatus == 2) && this.subscribeElems[i].getAttribute('data-shown') !== 'true') {
					this.subscribeElems[i].classList.remove('hide')
					this.subscribeElems[i].setAttribute('data-shown', true)
				}
			}
		}
		this.lastScroll = scrollTop
	}

	_lw8.prototype.scrollTo = function (y) {
		var initial = (window.scrollY + y) / 2,
			cosParameter = (window.scrollY - y) / 2,
			scrollCount = 0,
			oldTimestamp = performance.now()
		function step (newTimestamp) {
			scrollCount += Math.PI / (800 / (newTimestamp - oldTimestamp))
			scrollCount >= Math.PI && window.scrollTo(0, y)
			if(Math.abs(window.scrollY - y) < 1) { return }
			window.scrollTo(0, Math.round(initial + cosParameter * Math.cos(scrollCount)))
			oldTimestamp = newTimestamp
			window.requestAnimationFrame(step)
		}
		window.requestAnimationFrame(step)
	}

	_lw8.prototype.setCookie = function(name, value, hours, path) {
		path = path || '/'
		var d = new Date()
		d.setTime(d.getTime() + (hours * 60 * 60 * 1000))
		document.cookie = name + '=' + value + ';expires=' + d.toUTCString() + ';path=' + path
		return true
	}

	_lw8.prototype.setupAjaxHTMLs = function(e) {
		var htmls = e.querySelectorAll('.ajax-html')
		if(htmls.length === 0 && e !== document && e.classList.contains('ajax-html')) { htmls = [e] }
		htmls.forEach(html => {
			this.prependAjaxHTML(html.getAttribute('data-url'), html)
		})
	}

	_lw8.prototype.setupLinks = function(e) {
		var links = e.getElementsByClassName('ajax-href')
		if(links.length === 0 && e !== document && e.classList.contains('ajax-href')) { links = [e] }
		for(var i = 0; i < links.length; i++) {
			links[i].addEventListener('click', function() {
				lw8.ajaxJSON(this.getAttribute('data-method'), this.getAttribute('data-href'), {token: localStorage.getItem('8n-session-csrf')})
			})
		}
	}

	_lw8.prototype.setupLocalData = function() {
		//this is necessary for 301/302 redirects
		var cookie = this.getCookie('8n-localData')
		if(cookie) {
			let localData = JSON.parse(decodeURIComponent(cookie))
			Object.keys(localData).forEach((key)=>{
				if(localData[key]) {
					localStorage.setItem(key, Object.prototype.toString.call(localData[key]) === '[object Object]' ? JSON.stringify(localData[key]) : localData[key])
				} else {
					localStorage.removeItem(key)
				}
			})
			document.cookie = '8n-localData=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
		}
		window && window.lw8Options && window.lw8Options.localData && Object.keys(window.lw8Options.localData).forEach((key)=>{
			if(window.lw8Options.localData[key]) {
				localStorage.setItem(key, Object.prototype.toString.call(window.lw8Options.localData[key]) === '[object Object]' ? JSON.stringify(window.lw8Options.localData[key]) : window.lw8Options.localData[key])
			} else {
				localStorage.removeItem(key)
			}
		})
	}

	_lw8.prototype.setupNotifications = function() {
		if(!navigator.cookieEnabled){this.addNotification('error','Our site works better with Cookies. Please enable them in your browser.')}
		//this is necessary for 301/302 redirects
		var cookie = this.getCookie('8n-notifications')
		if(cookie) {
			var notifications = JSON.parse(decodeURIComponent(cookie))
			for(var i =0; i < notifications.length; i++) {
				this.addNotification(notifications[i].type, notifications[i].message, notifications[i].persistent)
			}
			document.cookie = '8n-notifications=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
		}
		if(window && window.lw8Options && window.lw8Options.notifications) {
			window.lw8Options.notifications.forEach((notification)=>{
				this.addNotification(notification.type, notification.message, notification.persistent)
			})
		}
	}

	_lw8.prototype.setupPopups = function(e) {
		var popups = e.getElementsByClassName('popup')
		if(popups.length === 0 && e !== document && e.classList.contains('popup')) { popups = [e] }
		for(var i = 0; i < popups.length; i++) {
			popups[i].addEventListener('dblclick', function(ev) {
				ev.target.classList.contains('popup') && lw8.hideDialog(this)
			})
			!popups[i].querySelector('form') && popups[i].addEventListener('click', function(ev) {
				ev.target.classList.contains('popup') && lw8.hideDialog(this)
			})
			var close = document.createElement('div')
			close.classList.add('close')
			close.addEventListener('click', function() {
				lw8.hideDialog(this)
			})
			popups[i].firstElementChild.firstElementChild.insertBefore(close, popups[i].firstElementChild.firstElementChild.firstElementChild)
		}

		var showPopupElems = e.getElementsByClassName('show-popup')
		if(showPopupElems.length === 0 && e !== document && e.classList.contains('show-popup')) { showPopupElems = [e] }
		for(i = 0; i < showPopupElems.length; i++) {
			showPopupElems[i].addEventListener('click', function() {
				lw8.closeMenu()
				var popups = e.getElementsByClassName('popup')
				for(var i = 0; i < popups.length; i++) {
					popups[i].classList.add('hide')
				}
				document.getElementById(this.getAttribute('data-target')).classList.remove('hide')
				var iframe = document.getElementById(this.getAttribute('data-target')).querySelector('iframe.play-video')
				if(iframe) {
					var requests = ['requestFullscreen', 'webkitRequestFullscreen', 'webkitRequestFullScreen']
					for(i = 0; i < requests.length; i++) {
						if(iframe[requests[i]]) {
							iframe[requests[i]]()
							break
						}
					}
					'onfullscreenchange' in iframe && iframe.addEventListener('fullscreenchange', function() { !document.fullscreenElement && lw8.hideDialog(this) })
					'onwebkitfullscreenchange' in iframe && iframe.addEventListener('webkitfullscreenchange', function() { !document.webkitFullscreenElement && lw8.hideDialog(this) })
					iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*')
				}
				var video = document.getElementById(this.getAttribute('data-target')).querySelector('video.play-video')
				video && video.play()
			})
		}

		var confirmPopups = e.getElementsByClassName('confirm-popup')
		for(i = 0; i < confirmPopups.length; i++) {
			confirmPopups[i].addEventListener('click', function() {
				lw8.confirmPopup(this.getAttribute('data-method') || 'post', this.getAttribute('data-href') || '', {}, this.getAttribute('data-message'), this.getAttribute('data-button-text'))
			})
		}
	}

	_lw8.prototype.setupPushNotifications = (e)=>{
		e.addEventListener('click', ()=>{
			Notification.requestPermission((result)=>{
				result === 'granted' && window.serviceWorkerRegistration && window.serviceWorkerRegistration.pushManager.getSubscription().then((subscription)=>{
					!subscription && window.serviceWorkerRegistration.pushManager.subscribe({applicationServerKey: lw8.base64ToArray(window.lw8Options.applicationServerKey), userVisibleOnly: true}).then((subscription)=>{
						localStorage.setItem('subscription', JSON.stringify(subscription))
					})
				})
			})

		})
	}

	_lw8.prototype.setupScrollTo = function() {
		var scrolls = document.getElementsByClassName('scroll-to')
		for(var i = 0; i < scrolls.length; i++) {
			scrolls[i].addEventListener('click', function() {
				lw8.closeMenu()
				var target = document.getElementById(this.getAttribute('data-target'))
				lw8.scrollTo(target ? target.offsetTop : 0)
			})
		}
	}

	_lw8.prototype.setupSession = function() {
		let data = localStorage.getItem('8n-session-data')
		let profile = document.querySelector('#profile')
		let blogCommentPost = document.querySelector('#blog-comment-post')
		let loggedIn = false
		if(data) {
			data = JSON.parse(data)
			if(!this.refreshTimeout) {
				!data.persistent && data.expires && 1000 * data.expires > Date.now() && setTimeout(function() {
					lw8.ajaxJSON('get', '/account', {}, undefined, function() {
						window.location.href = '/'
					})
				}, 1000 * data.expires - Date.now())
				this.refreshTimeout = true
			}
			loggedIn = data.isLoggedIn
		}
		if(loggedIn) {
			if(profile) {
				let profileMenu = profile.querySelector('ul')
				if(data.photo) {
					let source = document.createElement('source')
					source.setAttribute('srcset', data.photo)
					let profileImage = profile.querySelector('picture')
					profileImage.insertBefore(source, profileImage.firstElementChild)
				}
				let params = this.getURLParams()
				if(params && params.has('asUserId')) {
					profileImage && profileImage.classList.add('as-user')
					profileMenu.innerHTML = '<li><a href="/account?asUserId='+params.get('asUserId')+'">As User</a></li>' +
						'<li><a href="/account">Back to ' + data.name + '</a></li>'
				} else {
					profileMenu.innerHTML = '<li><a href="/account">' + data.name + '</a></li>'
				}
				profileMenu.innerHTML += '<li><a href="/account/logout">Logout</a></li>'
			}
			if(blogCommentPost) {
				blogCommentPost.innerHTML = '<textarea name="comment" placeholder="Enter your comment"></textarea>' +
					'<input type="submit" value="Post Comment"/>'
			}
		} else {
			if(profile) {
				let profileMenu = profile.querySelector('ul')
				let source = profile.querySelector('source')
				source && source.remove()
				profileMenu.innerHTML = '<li><a class="show-popup" data-target="login">Login</a></li>' +
					'<li><a class="show-popup" data-target="signup">Sign Up</a></li>'
				this.setupPopups(profileMenu)
			}
			if(blogCommentPost) {
				blogCommentPost.innerHTML = '<p>Add you voice to this conversation.</p>' +
					'<div><a class="show-popup" data-target="login"><div>Login</div></a>' +
					'<a class="show-popup" data-target="signup"><div>Sign Up</div></a></div>'
				this.setupPopups(blogCommentPost)
			}
		}
	}

	_lw8.prototype.setupSlideovers = function(e) {
		var slideovers = e.querySelectorAll('.slideover')
		if(slideovers.length === 0 && e !== document && e.classList.contains('slideover')) {
			slideovers = [e]
		}
		for(var i = 0; i < slideovers.length; i++) {
			if(slideovers[i].classList.contains('minimizable')) {
				var minimize = document.createElement('div')
				minimize.classList.add('minimize')
				minimize.addEventListener('click', function() { this.parentNode.parentNode.classList.toggle('minimized') })
				slideovers[i].firstElementChild.insertBefore(minimize, slideovers[i].firstElementChild.firstElementChild)
			}
			var close = document.createElement('div')
			close.classList.add('close')
			close.addEventListener('click', function() { lw8.hideDialog(this) })
			slideovers[i].firstElementChild.insertBefore(close, slideovers[i].firstElementChild.firstElementChild)
		}
	}

	_lw8.prototype.setupSubscribes = function() {
		for(var i = 0; i < this.subscribeElems.length; i++) {
			var subscribedStatus = this.getCookie('subscribed'+this.subscribeElems[i].getAttribute('data-campaign-name'))
			if((subscribedStatus == 1 || subscribedStatus == 2) && this.subscribeElems[i].classList.contains('remove')) {
				this.subscribeElems[i].remove()
				i--
			} else {
				var close = this.subscribeElems[i].querySelector('.close')
				if(!close) {
					close = document.createElement('div')
					close.classList.add('close')
					this.subscribeElems[i].insertBefore(close, this.subscribeElems[i].firstElementChild)
				}
				close.addEventListener('click', function() {
					var e = this
					while(!e.classList.contains('subscribe')) { e = e.parentNode }
					lw8.setCookie('subscribed'+e.getAttribute('data-campaign-name'), 1, 72)
					for(var i = 0; i < lw8.subscribeElems.length; i++) {
						lw8.subscribeElems[i].getAttribute('data-campaign-name') === e.getAttribute('data-campaign-name') && lw8.hideDialog(lw8.subscribeElems[i])
					}
					lw8.adjustHeaderHeight()
				})
			}
		}
	}

	_lw8.prototype.simpleUTCDateTimeParse = (dateString, includeTime)=>{
		includeTime = includeTime !== false
		let date = new Date(dateString+(includeTime ? '+00:00' : ''))
		if(date instanceof Date && !isNaN(date)) { return date }
		//safari needs YYYY/MM/DD HH:MM:SS format
		return new Date(dateString.replace(/-/g, '/')+(includeTime ? '+00:00' : ''))
	}

	_lw8.prototype.base64ToArray = (base64String)=>{
		let padding = '='.repeat((4 - base64String.length % 4) % 4)
		let base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
		let rawData = window.atob(base64)
		let outputArray = new Uint8Array(rawData.length)
		for (let i = 0; i < rawData.length; i++) {
			outputArray[i] = rawData.charCodeAt(i)
		}
		return outputArray
	}

	global.lw8 = new _lw8()

	document.addEventListener('scroll', function() {lw8.scrollPeek()})
})(typeof self !== 'undefined' && self || typeof window !== 'undefined' && window || this)

//v2
function removeInvalidRecaptchas() {
	var recaptchas = document.querySelectorAll('.g-recaptcha.invalid')
	for(var i =0; i < recaptchas.length; i++) {
		recaptchas[i].classList.remove('invalid')
	}
}