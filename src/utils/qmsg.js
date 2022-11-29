import './message.min.js'
import sty from './message.min.css'

;(function () {
  let style = document.createElement('style')
  style.textContent = sty
  document.head.appendChild(style)

  Qmsg.config({
    timeout: 800,
  })
})()
