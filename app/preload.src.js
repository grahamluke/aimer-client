const Store = require('electron-store')
const { ipcRenderer } = require('electron')
const config = new Store()
const tmi = require('tmi.js')

document.addEventListener('DOMContentLoaded', (event) => {
  window.OffCliV = true
  let waitForWindows = setInterval((_) => {
    if (window.windows) {
      init()
      clearInterval(waitForWindows)
    }
  }, 100)
  function injectCSS() {
    if (config.get('customCSS') !== '') {
      for (const link of document.querySelectorAll('link')) {
        if (link.href.startsWith('https://krunker.io/css/main_custom.css')) {
          link.href = config.get('customCSS')
        }
      }
    }
  }
  function altManager() {
    if (document.getElementById('windowHeader').innerText == 'Game Settings') {
      const settingsHeaderEl = document.getElementsByClassName('settingsHeader')
      const lastChildEl = settingsHeaderEl[0].firstElementChild.firstElementChild
      lastChildEl.insertAdjacentHTML(
        'beforebegin',
        `
			<div class='settingsBtn' style='background-color:#ff4747;' onclick='window.logoutAcc()'>Logout</div>
			<div class='settingsBtn' style='margin-left:10px;width:150px;background-color:#fa50ae;' onclick='window.openAltManager()'>Alt Manager</div>`
      )
    }
    window.openAltManager = (openNew) => {
      if (openNew) {
        showWindow(5)
      }
      let menuWindow = document.getElementById('menuWindow')
      menuWindow.innerHTML = ''
      var accounts = config.get('account')
      accounts.forEach(function (acc, i) {
        let html = `<div class="settName zenoSetting"><span>${acc.name}</span><a class="+" style="background-color: #ec644b; color: white; margin-left: 10px;" onclick="window.removeAlt(${i})">Delete</a><a class="+" onclick="window.selectAlt(${i})">Login</a></div>`
        menuWindow.insertAdjacentHTML('beforeend', html)
      })
      menuWindow.insertAdjacentHTML(
        'beforeend',
        `<center class="settName zenoSetting"><a class="+" onclick="window.addAlt()" style="float: none; padding-left: 30px; padding-right: 30px;">Add New Account</a></center>`
      )
    }
    window.selectAlt = (i) => {
      var account = config.get('account')
      showWindow(5)
      showWindow(5)
      document.getElementById('accName').value = account[i].name
      document.getElementById('accPass').value = account[i].pass
      loginAcc()
    }
    window.removeAlt = (i) => {
      var account = config.get('account')
      account.splice(i, 1)
      config.set('account', account)
      openAltManager()
    }
    window.addAlt = () => {
      var tempHTML = `<div class="setHed">Add Alt</div>
			<div class="settName" id="importSettings_div" style="display:block">Account Name <input type="url" placeholder="Account Name" name="url" class="inputGrey2" id="usernameAlt"></div>
			<div class="settName" id="importSettings_div" style="display:block">Account Password <input type="password" placeholder="Account Password" name="url" class="inputGrey2" id="passwordAlt"></div>
			<a class="+" id="addAltB">Add</a>
			</div>`
      document.getElementById('menuWindow').innerHTML = tempHTML
      document.getElementById('addAltB').addEventListener('click', function () {
        var account = config.get('account')
        var newAlt = {
          name: document.getElementById('usernameAlt').value,
          pass: document.getElementById('passwordAlt').value,
        }
        account.push(newAlt)
        config.set('account', account)
        window.openAltManager(false)
      })
    }
  }
  const runRpc = () => {
    const activity = (() => {
      try {
        return window.getGameActivity()
      } catch (err) {
        console.error(err)
      }
    })()
    if (config.get('rpc') == true) {
      ipcRenderer.invoke('game-activity', activity)
    }
  }
  runRpc()
  function badges() {
    ipcRenderer.on('badge', (event, arg) => {
      window.badge = arg
    })
  /*  setInterval(function () {
      setBadges(badge)
    }, 100) */
  } 
  const checkElement = async selector => {
    while ( document.querySelector(selector) === null) {
      await new Promise( resolve =>  window.requestAnimFrame(resolve) )
    }
    return document.querySelector(selector); 
  };
  function genCustomUsername() {
    new MutationObserver(() => {
      for (const i of document.querySelectorAll('.leaderNameM')) {
        if(i.textContent == window.getGameActivity().user){
          i.textContent = config.get('customUsername')
        }}
    }).observe(document.querySelector('#leaderContainer'), { childList: true })
    new MutationObserver(() => {
      for (const i of document.querySelectorAll('.menuClassPlayerName')) {
        if(i.textContent == window.getGameActivity().user){
          i.textContent = config.get('customUsername')
        }}
    }).observe(document.querySelector('#menuClassNameTag'), { childList: true })
    checkElement('#menuAccountUsername').then((selector) => {
      new MutationObserver(() => {
        for (const i of document.querySelectorAll('#menuAccountUsername')) {
          if(i.textContent == window.getGameActivity().user){
            if(i.style.display == '') {
            i.textContent = config.get('customUsername')
            }
          }}
      }).observe(selector, { childList: true })
      selector.textContent = config.get('customUsername')
    })
    new MutationObserver(() => {
      for (const i of document.querySelectorAll('.chatItem')) {
        if(i.textContent.includes(window.getGameActivity().user)){
          i.childNodes[0].nodeValue = `${config.get('customUsername')}: `
        }}
    }).observe(document.querySelector('#chatList'), { childList: true })
    checkElement('#endTable').then((selector) => {
      new MutationObserver(() => {
        for (const i of document.querySelectorAll('.endTableN')) {
          if(i.textContent == window.getGameActivity().user){
            i.textContent = config.get('customUsername')
          }}
      }).observe(selector, { childList: true })
    });
  }
function initLoadingScreenImage() {
  document.getElementById('initLoader').style.backgroundImage = `url(${config.get('loadingScreenImage')})`
  initLoader.style.backgroundSize = 'cover'
}

function initTwitch() {
    const client = new tmi.Client({
        connection: {
            secure: true,
            reconnect: true
        },
        channels: [config.get('twitch')]
    });

    client.connect();

    client.on('message', (channel, tags, message, self) => {
        document.getElementById('chatList').insertAdjacentHTML('beforeend', `<div id="chatMsg_0"><div class="chatItem chatTextOutline twitch" style="background-color: rgba(0, 0, 0, 1)">&lrm;${tags['display-name']}&lrm;: <span class="chatMsg">&lrm;${message}&lrm;</span></div><br></div>`)
    });

}
  
  setInterval(() => {
    runRpc()
  }, 15e3)
  const injectSettings = () => {
    windows[0].getSettings = (function () {
      let cached_function = windows[0].getSettings
      return function () {
        let result
        if (windows[0].tabIndex == 6) {
          result = windows[0].getCSettings()
        } else {
          result = cached_function.call(this, arguments)
        }
        return result
      }
    })()
    new MutationObserver(() => {
      altManager()
    }).observe(menuWindow, { childList: true })
    window.setClientSetting = function (setting) {
      if (setting == 'customCSS' || setting == 'customUsername' || setting == 'twitch' || setting == 'customBackground') {
        config.set(setting, document.getElementById(setting).value)
      }
      config.set(
        `${setting}`,
        document.getElementById(`${setting}Toggle`).checked
      )
      console.log(setting, setting + 'Toggle')
      console.log(setting)
      ipcRenderer.send('relaunch')
    }
    function getClientSetting(setting) {
      if (setting === 'customCSS') {
        window[`${setting}`] = config.get('customCSS')
      } else if(setting === 'customUsername') {
        window[`${setting}`] = config.get('customUsername')
      } else if(setting === 'twitch') {
        window[`${setting}`] = config.get('twitch')
      } else if(setting === 'customBackground') {
        window[`${setting}`] = config.get('customBackground')
      }
      else if (config.get(`${setting}`, true)) {
        window[`${setting}`] = 'checked'
      } else {
        window[`${setting}`] = ''
      }
    }
    Object.keys(config.store).forEach((v) => getClientSetting(v))
    windows[0].getCSettings = () => {
      let tempHTML = `<div class="setHed" id="setHed_client" onclick="windows[0].collapseFolder(this)"><span class="material-icons plusOrMinus">keyboard_arrow_down</span>Client</div>`
      tempHTML += `<div class="setBodH" id="setBod_client" style="">`
      tempHTML += `<div class="settName" id="vsync_div" style="display:block">VSYNC<label class="switch"><input type="checkbox" id="vsyncToggle" onclick='setClientSetting("vsync")'${vsync}><span class="slider"></span></label></div>`
      tempHTML += `<div class="settName" id="gameCapture_div" style="display:block">Game Capture<label class="switch"><input type="checkbox" id="gameCaptureToggle" onclick='setClientSetting("gameCapture")'${gameCapture}><span class="slider"></span></label></div>`
      tempHTML += `<div class="settName" id="rpc_div" style="display:block">Discord RPC<label class="switch"><input type="checkbox" id="rpcToggle" onclick='setClientSetting("rpc")'${rpc}><span class="slider"></span></label></div>`
      tempHTML += `<div class="settName" id="customCSS_div" style="display:block">Custom CSS<input type="url" placeholder="Enter Custom CSS Link Here" name="url" class="inputGrey2" id="customCSS" oninput=setClientSetting("customCSS") value="${customCSS}"></div>`
      tempHTML += `<div class="settName" id="customUsername_div" style="display:block">Custom Username<input type="text" placeholder="Enter Custom Username Here" name="text" class="inputGrey2" id="customUsername" oninput=setClientSetting("customUsername") value="${customUsername}"></div>`
      tempHTML += `<div class="settName" id="twitch_div" style="display:block">Twitch<input type="text" placeholder="Enter Twitch Channel Link Here" name="text" class="inputGrey2" id="twitch" oninput=setClientSetting("twitch") value="${twitch}"></div>`
      tempHTML += `<div class="settName" id="customBackground_div" style="display:block">Loading Screen Image<input type="text" placeholder="Enter Loading Screen Image Link Here" name="text" class="inputGrey2" id="loadingScreenImage" oninput=setClientSetting("loadingScreenImage") value="${loadingScreenImage}"></div>`
      return tempHTML
    }
  }
  function init() {
    injectCSS()
    genCustomUsername()
    badges()
    injectSettings()
    if(config.get('twitch') !== '') initTwitch()
    if(config.get('loadingScreenImage') !== '') initLoadingScreenImage()
  }
})
