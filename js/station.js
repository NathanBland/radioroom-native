console.log('running.')
var current = 0
var currentStart = 0
var player = {init: false, volume: 0.5, paused: false, muted: false}
var queryDict = {}
location.search.substr(1).split('&').forEach(function (item) {
  queryDict[item.split('=')[0]] = item.split('=')[1]
})
var socket = io.connect('https://radioroom-nathanbland.c9.io')
  .on('connect', function () {
    console.log('(conncet) Trying to join: /station/' + queryDict.join)
    socket.emit('join', '/station/' + queryDict.join)
  })
  .on('end', function (data) {
    var history = document.querySelector('.history')
    console.log(data.m)
    var ele = document.querySelector('.play audio')
    var cards = document.querySelectorAll('.play .mdl-card')
    var row = document.querySelectorAll('.queue ul li.queue__item')
    row[0].remove()
    ele.currentSrc = ''
    ele.remove()
    var copy = cards[0].cloneNode(true)
    cards[0].classList.add('animated')
    cards[0].classList.add('bounceOut')
    copy.classList.add('animated')
    copy.classList.add('bounceIn')
    copy.classList.add('history__item')
    history.insertBefore(copy, history.firstChild)
    cards[0].addEventListener('animationend', function (e) {
      cards[0].remove()
      // cards[1].classList.add('animated')
      // cards[1].classList.add('bounceIn')
    })
  })
  .on('announce', function (data) {
    log(data)
    if (data.count) {
      var count = document.querySelector('span.user__count')
      count.textContent = data.count
    }
  })
  .on('welcome', function (data) {
    log(data)
    console.log('welcome', data)
    if (data.q) {
      console.log('got passed a queue:', data.q)
      printQueue(data.q)
    }
    if (data.c) {
      console.log('got current')
      pre(data.c.track)
      queue(data.c.track)
      var options = {
        body: data.c.track.j.title
      }
      var notification = new Notification("Now Playing: ", options);
      notification.onshow = function () {
        setTimeout(function () {
          notification.close();
        }, 2000);
      }
      window.setTimeout(function () {
        var playing = document.querySelectorAll('.player audio')
        var thumb = document.querySelector('.play .mdl-card')
        thumb.classList.add('first')
        var now = Date.now()
        currentStart = data.c.start
        current = (now - data.c.start) / 1000
        console.log('setting time to:', current)
        playing[0].addEventListener('canplay', function (e) {
          // playing[0].currentTime = current
          e.target.removeEventListener(e.type, arguments.callee)
        })
        var playButton = document.querySelector('.isPaused')
        playButton.textContent = 'stop'
      }, 500)
    }
    if (data.h) {
      buildHistory(data.h)
    }
  })
  .on('added', function (data) {
    console.log('song added to queue!')
    log(data)
    addToQueue(data)
  })
  .on('bad', function (data) {
    console.log('bad link?')
    log({ m: 'failure: that link isn\'t supported'})
  })
  .on('pre', function (data) {
    console.log('pre:', data)
    pre(data)
  })
  .on('link', function (data) {
    console.log(data)
    queue(data)
    var options = {
      body: data.j.j.title //test
    }
    var notification = new Notification("Now Playing: ", options);
    notification.onshow = function () {
      setTimeout(function () {
        notification.close();
      }, 2000);
    }
  })

var input = document.getElementsByTagName('input')[0]
var playlist = document.querySelector('.playlist')
var stream = document.querySelector('.stream ul')
var form = document.getElementById('add')
var timeDisplay = document.querySelector('.currentTime')
var timeProgress = document.querySelector('.progress')

form.addEventListener('submit', function (e) {
  e.preventDefault()
  socket.emit('link', {
    link: input.value
  })
  form.reset()
  console.log('song submitted')
})
function formatTime (seconds) {
  var minutes = Math.floor(seconds / 60)
  minutes = (minutes >= 10) ? minutes : '0' + minutes
  seconds = Math.floor(seconds % 60)
  seconds = (seconds >= 10) ? seconds : '0' + seconds
  return minutes + ':' + seconds
}
function log (data) {
  console.log('data:', data)
  var li = document.createElement('li')
  li.classList.add('message__item')
  li.classList.add('message--' + data.type)
  li.appendChild(document.createTextNode(data.m || data))
  stream.appendChild(li)
  li.scrollIntoView()
}
function buildHistory (history) {
  var container = document.querySelector('.history')
  // console.log('(buildHistory) history:', history)
  for (var i = history.length - 1; i > -1; i--) {
    var card = document.createElement('div')
    card.classList.add('mdl-card')
    card.classList.add('mdl-shadow--4dp')

    var cardTitle = document.createElement('div')
    cardTitle.classList.add('mdl-card__title')
    var titleLink = document.createElement('a')
    titleLink.setAttribute('href', history[i].track.j.webpage_url)
    var titleText = document.createElement('h2')
    titleText.classList.add('mdl-card__title-text')
    titleText.textContent = history[i].track.j.title
    titleLink.appendChild(titleText)
    cardTitle.appendChild(titleLink)
    card.appendChild(cardTitle)
    card.setAttribute('style', 'background-image: url(\'' + history[i].track.j.thumbnail + '\')')
    container.appendChild(card)
  }
}
function pre (data) {
  var card = document.createElement('div')
  card.classList.add('mdl-card')
  card.classList.add('mdl-shadow--4dp')

  var cardTitle = document.createElement('div')
  cardTitle.classList.add('mdl-card__title')
  var titleLink = document.createElement('a')
  titleLink.setAttribute('href', data.j.web_url)
  var titleText = document.createElement('h2')
  titleLink.appendChild(titleText)
  titleText.classList.add('mdl-card__title-text')
  titleText.textContent = data.j.title
  cardTitle.appendChild(titleLink)
  card.appendChild(cardTitle)

  card.setAttribute('style', 'background-image: url(\'' + data.j.thumbnail + '\')')

  var buffer = document.querySelector('.player .buffer')
  var audio = document.createElement('audio')
  for (var i = 0; i < data.j.formats.length; i++) {
    if (data.j.formats[i].acodec !== 'none' && data.j.formats[i].vcodec === 'none') {
      var s = document.createElement('source')
      s.setAttribute('src', data.j.formats[i].url)
      s.setAttribute('type', 'audio/' + data.j.formats[i].ext)
      audio.appendChild(s)
    }
  }
  console.log('(pre):', audio)
  audio.setAttribute('preload', 'auto')
  buffer.appendChild(audio)

  playlist.appendChild(card)
}

function initPlayer () {
  var audio = document.querySelector('.player .play audio')
  var controls = document.querySelector('.controls')
  var play = controls.querySelector('.isPaused')
  var mute = controls.querySelector('.mute')
  var volControl = controls.querySelector('.volControl')
  audio.addEventListener('play', function (e) {
    var checkPlay = setInterval(function () {
      if (audio.currentTime > 1) {
        audio.currentTime = (Date.now() - currentStart) / 1000
        play.innerHTML = 'stop'
        clearInterval(checkPlay)
      } else {
        console.log('(initPlayer) can\'t play yet')
      }
    }, 500)
  })
  audio.volume = player.volume
  audio.addEventListener('volumechange', function () {

  })
  audio.addEventListener('ended', function (e) {
    console.log('(init) clear source')
    audio.innerHTML = ''
    audio.src = ''
  })
  audio.addEventListener('timeupdate', function (e) {
    if (audio.currentTime > 1 && !player.paused) {
      timeProgress.style.width = ((audio.currentTime / audio.duration) * 100) + '%'
      timeDisplay.textContent = formatTime(audio.currentTime) +
       '/' +
       formatTime(audio.duration)
    }
  })

  if (!player.init) {
    player.init = true
    play.addEventListener('click', function (e) {
      var audio = document.querySelector('.player .play audio')
      if (!player.paused) {
        play.textContent = 'play_arrow'
        audio.muted = true
        player.paused = true
      } else {
        play.textContent = 'stop'
        audio.muted = false
        player.paused = false
      }
    })
    mute.addEventListener('click', function (e) {
      var audio = document.querySelector('.player .play audio')
      mute.classList.add('animated')
      mute.classList.add('pulse')
      mute.classList.toggle('muted')
      if (!player.muted) {
        audio.muted = true
        player.muted = true
      } else {
        audio.muted = false
        player.muted = false
      }
    })
    mute.addEventListener('animationend', function (e) {
      mute.classList.remove('animated')
      mute.classList.remove('pulse')
    })
    volControl.addEventListener('input', function (e) {
      var audio = document.querySelector('.player .play audio')
      var volTip = document.querySelector('#volTip span')
      player.volume = (volControl.value / 100)
      audio.volume = player.volume
      volTip.textContent = volControl.value + '%'
      // console.log('(volumeChange)')
    })
  }
}

function queue (data) {
  var ele = document.querySelector('.player .play')
  var container = document.querySelector('.player .play')
  var card = document.querySelector('.playlist .mdl-card')
  container.insertBefore(card, container.firstChild)
  var buffer = document.querySelector('.buffer audio')
  // console.log(buffer)
  var copy = buffer.cloneNode(true)
  // console.log(copy)
  // copy.setAttribute('autoplay', 'true')
  // copy.setAttribute('controls', 'controls')
  ele.insertBefore(copy, ele.firstChild)
  // copy.volume = player.volume
  // copy.play()
  initPlayer()
  currentStart = Date.now()
  buffer.remove()
  if (player.muted) {
    copy.muted = true
  }
  // console.log('(queue) is paused?', copy.paused)
  if (!player.paused) {
    // console.log('(queue) play')
    copy.play()
  }
  window.setTimeout(function () {
    // console.log('the end is ni!')
  }, data.d * 1000)
  copy.scrollIntoView()
}

function voteUp (data) {
  socket.emit('vote', {
    m: data,
    type: 'up'
  })
}

function voteDown (data) {
  socket.emit('vote', {
    m: data,
    type: 'down'
  })
}

function addToQueue (item) {
  var queue = document.querySelector('.queue ul')

  var li = document.createElement('li')
  li.classList.add('queue__item')
  var vote_up = document.createElement('i')
  vote_up.textContent = 'thumb_up'
  vote_up.classList.add('material-icons')
  vote_up.classList.add('mdl-badge')
  vote_up.setAttribute('data-badge', '0')

  var vote_down = document.createElement('i')
  vote_down.textContent = 'thumb_down'
  vote_down.classList.add('material-icons')
  vote_down.classList.add('mdl-badge')
  vote_down.setAttribute('data-badge', '0')

  vote_up.addEventListener('click', function (e) {
    e.preventDefault()
    // console.log('voted up:', item.j)
    voteUp(item.j.id)
    e.target.removeEventListener(e.type, arguments.callee)
  })
  vote_down.addEventListener('click', function (e) {
    e.preventDefault()
    // console.log('voted down:', item.j)
    voteDown(item.j.id)
    e.target.removeEventListener(e.type, arguments.callee)
  })
  var controls = document.createElement('span')
  var content = document.createElement('span')
  controls.appendChild(vote_up)
  controls.appendChild(vote_down)
  li.appendChild(controls)
  content.appendChild(document.createTextNode(item.j.title))
  li.appendChild(content)
  queue.appendChild(li)
}
function printQueue (queueArray) {
  if (queueArray.length < 1) {
    return false
  }

  for (var i = 0; i < queueArray.length; i++) {
    addToQueue(queueArray[i])
    // console.log('queue item:', queueArray[i])
  }
}

// initPlayer()
