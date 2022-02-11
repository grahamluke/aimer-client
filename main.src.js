const path = require('path');
const fetch = require('cross-fetch')
const DiscordRPC = require('discord-rpc')
const Store = require('electron-store')
const { autoUpdater } = require('electron-updater')
const localShortcut = require('electron-localshortcut')
const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const appId = '938571073610465290'
const config = new Store()
const rpc = new DiscordRPC.Client({ transport: 'ipc'})
let mainWindow
if(config.get('vsync') == null) {
	config.set('vsync', false)
}
if(config.get('gameCapture') == null) {
	config.set('gameCapture', false)
}
if(config.get('rpc') == null) {
	config.set('rpc', true)
}
if(config.get('customCSS') == null) {
	config.set('customCSS', '')
}
if(config.get('customUsername') == null) {
	config.set('customUsername', '')
}
if(config.get('twitch') == null) {
	config.set('twitch', '')
}
if(config.get('loadingScreenImage') == null) {
	config.set('loadingScreenImage', '')
}
if (config.get('account') == null) {
	config.set('account', [])
  }
app.commandLine.appendSwitch('ignore-gpu-blocklist')
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')
app.commandLine.appendSwitch('enable-quic')
if(config.get('gameCapture') == true) {
	app.commandLine.appendSwitch('in-process-gpu')
	app.commandLine.appendSwitch('disable-direct-composition')
}
if(config.get('vsync') == false) {
	app.commandLine.appendSwitch('disable-frame-rate-limit')
	app.commandLine.appendSwitch('disable-gpu-vsync')
}



const createMainWindow = async () => {
	try {
		const win = new BrowserWindow({
			title: app.name,
			show: false,
			width: 1600,
			height: 900,
			fullscreen: true,
			webPreferences: {
				nativeWindowOpen: true,
				devTools: true,
				nodeIntegration: false,
				contextIsolation: false,
				webSecurity: false,
				preload: path.join(__dirname, 'preload.src.js'),
			},
		})
	/*	win.webContents.on('did-frame-finish-load', () => {
			let url = 'https://raw.githubusercontent.com/grahamluke/aimer-client/main/badges.json?token=GHSAT0AAAAAABRCDPFZ6CYU2PKJ42VNYDX2YQEI7UQ'
			let settings = { Method: 'Get' }
			fetch(url, settings)
				.then((res) => res.json())
				.then((json) => {
					console.log(json)
					win.webContents.send('badge', json)
				})
		}) */
		ipcMain.handle('game-activity', async (event, arg) => {
			await updateActivity(arg)
		})
		const updateActivity = async (gameInfo) => {
			console.log(gameInfo)
			try {
				if(!rpc) {
					return
				}
				rpc.setActivity({
					details: gameInfo.mode,
					state: gameInfo.map,
					largeImageKey: 'main',
					largeImageText: gameInfo.user,
					endTimestamp: Date.now() + gameInfo.time * 1000,
					instance: true,
				})
			} catch (err) {
				console.error(err)
			}
		}
		win.on('ready-to-show', () => {
			win.show()
			win.maximize()
			autoUpdater.checkForUpdatesAndNotify();
		});
		autoUpdater.on('update-available', () => {
			win.webContents.executeJavaScript(`alert('Client update available. Downloading the update now.')`);
		});
		autoUpdater.on('update-downloaded', () => {
			win.webContents.executeJavaScript(`alert('Client update downloaded. Installing the update now.')`);
			autoUpdater.quitAndInstall();
		});
		win.on('closed', () => {
			mainWindow = undefined
		})
		await win.loadURL('https://krunker.io/')

		rpc.login({ clientId: appId })
			.catch(console.error)

		async function wipeCache() {
			const session = win.webContents.session
			await session.clearCache()
			await session.clearStorageData()
			app.relaunch()
			app.quit()
		}
		ipcMain.on('relaunch', () => {
			app.relaunch()
			app.quit()
		})
		localShortcut.register('Esc', () => {
			win.webContents.executeJavaScript(`
            document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
            document.exitPointerLock();
        `)
		})
		localShortcut.register('F4', () => {
			win.webContents.executeJavaScript(`window.location.href = "https://krunker.io/"`)
		})
		if(process.platform == 'darwin') {
			localShortcut.register('Cmd+R', () => {
				win.reload()
			})
		} else {
			localShortcut.register('F5', () => {
				win.reload()
			})
		}
		localShortcut.register('F11', () => {
			win.setFullScreen(!win.isFullScreen())
		})
		localShortcut.register('Alt+F4', () => {
			app.quit()
		})
		localShortcut.register('Ctrl+Alt+F1', () => {
			wipeCache()
		})
		if(process.platform == 'darwin') {
		localShortcut.register('Cmd+Shift+I', () => {
			win.webContents.openDevTools()
		}) } else {
			localShortcut.register('Ctrl+Shift+I', () => {
				win.webContents.openDevTools()
			})
		}
		return win
	} catch (err) {
		console.log(err)
	}
}
if(!app.requestSingleInstanceLock()) {
	app.quit()
}
app.on('second-instance', () => {
	if(mainWindow) {
		if(mainWindow.isMinimized()) {
			mainWindow.restore()
		}
		mainWindow.show()
	}
})
app.on('window-all-closed', () => {
	app.quit()
})
app.on('activate', () => {
	if(!mainWindow) {
		mainWindow = createMainWindow()
	}
});
(async () => {
	await app.whenReady()
	Menu.setApplicationMenu(null)
	mainWindow = await createMainWindow()
})()