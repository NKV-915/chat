/**
 * DaF-Klassenchat - Ein einfacher Echtzeit-Chat (WhatsApp-Klon) für den Unterricht
 * Technologien: Node.js, Express, Socket.io
 * Hosting: Optimiert für GitHub + Render.com
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Speicher für aktive Nutzer pro Raum (im Arbeitsspeicher, keine Datenbank nötig)
const rooms = {};

// HTML, CSS und Client-JavaScript werden direkt ausgeliefert
const htmlContent = `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>DaF Klassen-Chat</title>
    <style>
        :root {
            --wa-green-dark: #075e54;
            --wa-green-light: #128c7e;
            --wa-teal: #25d366;
            --wa-bg: #efeae2;
            --wa-msg-out: #d9fdd3;
            --wa-msg-in: #ffffff;
            --wa-text: #111b21;
            --wa-meta: #667781;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }

        body {
            background-color: #d1d7db;
            height: 100dvh;
            display: flex;
            justify-content: center;
            align-items: center;
            color: var(--wa-text);
        }

        /* Hauptcontainer */
        .app-container {
            width: 100%;
            max-width: 500px;
            height: 100%;
            background-color: var(--wa-bg);
            display: flex;
            flex-direction: column;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            position: relative;
            overflow: hidden;
        }

        @media (min-width: 520px) {
            .app-container {
                height: 92dvh;
                border-radius: 12px;
            }
        }

        /* Login-Bildschirm */
        #login-screen {
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, var(--wa-green-dark), var(--wa-green-light));
            z-index: 100;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 24px;
            color: white;
            transition: opacity 0.3s ease;
        }

        .login-card {
            background: white;
            color: var(--wa-text);
            padding: 28px 24px;
            border-radius: 16px;
            width: 100%;
            max-width: 360px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            text-align: center;
        }

        .login-card h1 {
            color: var(--wa-green-dark);
            font-size: 1.5rem;
            margin-bottom: 8px;
        }

        .login-card p {
            color: var(--wa-meta);
            font-size: 0.9rem;
            margin-bottom: 24px;
        }

        .input-group {
            margin-bottom: 16px;
            text-align: left;
        }

        .input-group label {
            display: block;
            font-size: 0.85rem;
            font-weight: 600;
            margin-bottom: 6px;
            color: var(--wa-green-dark);
        }

        .input-group input {
            width: 100%;
            padding: 12px 14px;
            border: 1.5px solid #d1d7db;
            border-radius: 8px;
            font-size: 1rem;
            outline: none;
            transition: border-color 0.2s;
        }

        .input-group input:focus {
            border-color: var(--wa-green-light);
        }

        .btn-primary {
            width: 100%;
            padding: 13px;
            background-color: var(--wa-green-light);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s;
            margin-top: 8px;
        }

        .btn-primary:hover {
            background-color: var(--wa-green-dark);
        }

        .error-msg {
            color: #d32f2f;
            font-size: 0.85rem;
            margin-top: 10px;
            min-height: 20px;
        }

        /* Chat-Header */
        .chat-header {
            background-color: var(--wa-green-dark);
            color: white;
            padding: 12px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            z-index: 10;
        }

        .header-info {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .avatar-circle {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background-color: var(--wa-green-light);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 1.1rem;
            border: 1.5px solid rgba(255,255,255,0.3);
        }

        .room-details h2 {
            font-size: 1.05rem;
            font-weight: 600;
        }

        .room-details span {
            font-size: 0.8rem;
            opacity: 0.85;
            display: block;
        }

        .btn-leave {
            background: rgba(255,255,255,0.15);
            border: none;
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 0.8rem;
            cursor: pointer;
        }

        .btn-leave:hover {
            background: rgba(255,255,255,0.25);
        }

        /* Chat-Verlauf */
        #messages {
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 8px;
            background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
            background-size: 20px 20px;
        }

        .message {
            max-width: 80%;
            padding: 8px 12px;
            border-radius: 10px;
            position: relative;
            font-size: 0.95rem;
            line-height: 1.4;
            word-wrap: break-word;
            box-shadow: 0 1px 1px rgba(0,0,0,0.1);
            animation: popIn 0.2s ease-out;
        }

        @keyframes popIn {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .message.incoming {
            background-color: var(--wa-msg-in);
            align-self: flex-start;
            border-top-left-radius: 2px;
        }

        .message.outgoing {
            background-color: var(--wa-msg-out);
            align-self: flex-end;
            border-top-right-radius: 2px;
        }

        .message.system {
            align-self: center;
            background-color: #e1f3fb;
            color: #4a5568;
            font-size: 0.8rem;
            padding: 5px 12px;
            border-radius: 12px;
            max-width: 90%;
            text-align: center;
        }

        .msg-sender {
            font-size: 0.78rem;
            font-weight: 700;
            margin-bottom: 3px;
            display: block;
        }

        .msg-time {
            font-size: 0.68rem;
            color: var(--wa-meta);
            float: right;
            margin-left: 8px;
            margin-top: 4px;
        }

        /* Tipp-Anzeige */
        #typing-indicator {
            padding: 4px 16px;
            font-size: 0.8rem;
            color: var(--wa-green-dark);
            font-style: italic;
            min-height: 24px;
            background-color: var(--wa-bg);
        }

        /* Eingabebereich */
        .chat-input-area {
            background-color: #f0f2f5;
            padding: 10px 12px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        #message-input {
            flex: 1;
            padding: 11px 16px;
            border: none;
            border-radius: 24px;
            font-size: 0.95rem;
            outline: none;
            background: white;
        }

        .btn-send {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background-color: var(--wa-green-light);
            color: white;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: transform 0.1s, background-color 0.2s;
            flex-shrink: 0;
        }

        .btn-send:hover {
            background-color: var(--wa-green-dark);
        }

        .btn-send:active {
            transform: scale(0.94);
        }

        .btn-send svg {
            width: 20px;
            height: 20px;
            fill: currentColor;
            margin-left: 2px;
        }
    </style>
</head>
<body>

<div class="app-container">
    <!-- Login Overlay -->
    <div id="login-screen">
        <div class="login-card">
            <h1>💬 DaF Klassen-Chat</h1>
            <p>Gib deinen Namen und den Raumcode deiner Lehrkraft ein.</p>
            
            <form id="join-form">
                <div class="input-group">
                    <label for="nickname">Dein Nickname</label>
                    <input type="text" id="nickname" placeholder="z.B. Anna" maxlength="20" required autocomplete="off">
                </div>
                <div class="input-group">
                    <label for="roomcode">Raumcode</label>
                    <input type="text" id="roomcode" placeholder="z.B. DEUTSCH-A1" maxlength="15" required autocomplete="off" style="text-transform: uppercase;">
                </div>
                <button type="submit" class="btn-primary">Chat betreten</button>
                <div id="login-error" class="error-msg"></div>
            </form>
        </div>
    </div>

    <!-- Chat Header -->
    <header class="chat-header">
        <div class="header-info">
            <div class="avatar-circle" id="room-avatar">DE</div>
            <div class="room-details">
                <h2 id="display-room">Raum</h2>
                <span id="online-users">0 Personen online</span>
            </div>
        </div>
        <button class="btn-leave" id="leave-btn">Verlassen</button>
    </header>

    <!-- Nachrichtenliste -->
    <main id="messages"></main>

    <!-- Tipp-Anzeige -->
    <div id="typing-indicator"></div>

    <!-- Eingabeformular -->
    <form class="chat-input-area" id="chat-form">
        <input type="text" id="message-input" placeholder="Nachricht schreiben..." autocomplete="off" maxlength="500">
        <button type="submit" class="btn-send" aria-label="Senden">
            <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
    </form>
</div>

<script src="/socket.io/socket.io.js"></script>
<script>
    const socket = io();

    // DOM Elemente
    const loginScreen = document.getElementById('login-screen');
    const joinForm = document.getElementById('join-form');
    const nicknameInput = document.getElementById('nickname');
    const roomcodeInput = document.getElementById('roomcode');
    const loginError = document.getElementById('login-error');

    const displayRoom = document.getElementById('display-room');
    const roomAvatar = document.getElementById('room-avatar');
    const onlineUsers = document.getElementById('online-users');
    const leaveBtn = document.getElementById('leave-btn');

    const messagesContainer = document.getElementById('messages');
    const typingIndicator = document.getElementById('typing-indicator');
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');

    let currentUser = '';
    let currentRoom = '';
    let typingTimeout = null;

    // Farben für verschiedene Nutzer-Nicknamen generieren
    const userColors = ['#e53935', '#8e24aa', '#3949ab', '#00897b', '#f4511e', '#6d4c41', '#1e88e5', '#43a047'];
    function getUserColor(name) {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return userColors[Math.abs(hash) % userColors.length];
    }

    // Raum betreten
    joinForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nick = nicknameInput.value.trim();
        const room = roomcodeInput.value.trim().toUpperCase();

        if (!nick || !room) {
            loginError.textContent = 'Bitte fülle beide Felder aus.';
            return;
        }

        currentUser = nick;
        currentRoom = room;

        socket.emit('joinRoom', { nickname: currentUser, room: currentRoom });
    });

    // Server bestätigt Beitritt
    socket.on('joinedSuccess', ({ room }) => {
        loginError.textContent = '';
        loginScreen.style.display = 'none';
        displayRoom.textContent = 'Raum: ' + room;
        roomAvatar.textContent = room.substring(0, 2);
        messagesContainer.innerHTML = '';
        messageInput.focus();
    });

    // Fehler beim Beitritt (z.B. Name schon vergeben)
    socket.on('joinError', (msg) => {
        loginError.textContent = msg;
    });

    // Raum verlassen
    leaveBtn.addEventListener('click', () => {
        window.location.reload();
    });

    // Nachricht absenden
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = messageInput.value.trim();
        if (!text) return;

        socket.emit('chatMessage', text);
        socket.emit('stopTyping');
        messageInput.value = '';
        messageInput.focus();
    });

    // "Schreibt gerade..." Event senden
    messageInput.addEventListener('input', () => {
        socket.emit('typing');
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            socket.emit('stopTyping');
        }, 1500);
    });

    // Nachricht im Chat anzeigen
    socket.on('message', (data) => {
        const div = document.createElement('div');
        
        if (data.type === 'system') {
            div.className = 'message system';
            div.textContent = data.text;
        } else {
            const isMe = data.sender === currentUser;
            div.className = 'message ' + (isMe ? 'outgoing' : 'incoming');
            
            let senderHtml = '';
            if (!isMe) {
                const color = getUserColor(data.sender);
                senderHtml = '<span class="msg-sender" style="color:' + color + '">' + escapeHtml(data.sender) + '</span>';
            }
            
            div.innerHTML = senderHtml + 
                            '<span>' + escapeHtml(data.text) + '</span>' +
                            '<span class="msg-time">' + data.time + '</span>';
        }

        messagesContainer.appendChild(div);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });

    // Online-Liste aktualisieren
    socket.on('roomUsers', ({ users }) => {
        const count = users.length;
        const label = count === 1 ? 'Person' : 'Personen';
        onlineUsers.textContent = count + ' ' + label + ' online (' + users.join(', ') + ')';
    });

    // Tipp-Anzeige empfangen
    socket.on('userTyping', (usersTyping) => {
        const others = usersTyping.filter(u => u !== currentUser);
        if (others.length === 0) {
            typingIndicator.textContent = '';
        } else if (others.length === 1) {
            typingIndicator.textContent = others[0] + ' schreibt gerade...';
        } else {
            typingIndicator.textContent = 'Mehrere Personen schreiben gerade...';
        }
    });

    // XSS-Schutz
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
</script>
</body>
</html>
`;

// Hauptroute liefert die Web-App aus
app.get('/', (req, res) => {
    res.send(htmlContent);
});

// Hilfsfunktion für aktuelle Uhrzeit (HH:MM)
function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' });
}

// Socket.io Echtzeit-Logik
io.on('connection', (socket) => {
    let currentUser = null;
    let currentRoom = null;

    socket.on('joinRoom', ({ nickname, room }) => {
        // Bereinigen der Eingaben
        const cleanNick = nickname.trim().substring(0, 20);
        const cleanRoom = room.trim().toUpperCase().substring(0, 15);

        if (!rooms[cleanRoom]) {
            rooms[cleanRoom] = { users: {}, typing: new Set() };
        }

        // Prüfen, ob der Nickname im Raum bereits existiert
        const existingNames = Object.values(rooms[cleanRoom].users).map(n => n.toLowerCase());
        if (existingNames.includes(cleanNick.toLowerCase())) {
            socket.emit('joinError', 'Dieser Nickname ist in diesem Raum schon vergeben.');
            return;
        }

        currentUser = cleanNick;
        currentRoom = cleanRoom;

        socket.join(currentRoom);
        rooms[currentRoom].users[socket.id] = currentUser;

        socket.emit('joinedSuccess', { room: currentRoom });

        // Systemnachricht an alle im Raum
        io.to(currentRoom).emit('message', {
            type: 'system',
            text: `${currentUser} ist dem Chat beigetreten.`
        });

        // Nutzerliste an alle senden
        io.to(currentRoom).emit('roomUsers', {
            users: Object.values(rooms[currentRoom].users)
        });
    });

    // Neue Chatnachricht empfangen und verteilen
    socket.on('chatMessage', (msg) => {
        if (!currentRoom || !currentUser) return;
        const cleanMsg = msg.trim().substring(0, 500);
        if (!cleanMsg) return;

        io.to(currentRoom).emit('message', {
            type: 'chat',
            sender: currentUser,
            text: cleanMsg,
            time: getCurrentTime()
        });
    });

    // Tipp-Status verwalten
    socket.on('typing', () => {
        if (!currentRoom || !currentUser || !rooms[currentRoom]) return;
        rooms[currentRoom].typing.add(currentUser);
        io.to(currentRoom).emit('userTyping', Array.from(rooms[currentRoom].typing));
    });

    socket.on('stopTyping', () => {
        if (!currentRoom || !currentUser || !rooms[currentRoom]) return;
        rooms[currentRoom].typing.delete(currentUser);
        io.to(currentRoom).emit('userTyping', Array.from(rooms[currentRoom].typing));
    });

    // Verbindung getrennt
    socket.on('disconnect', () => {
        if (currentRoom && rooms[currentRoom]) {
            delete rooms[currentRoom].users[socket.id];
            rooms[currentRoom].typing.delete(currentUser);

            io.to(currentRoom).emit('message', {
                type: 'system',
                text: `${currentUser} hat den Chat verlassen.`
            });

            io.to(currentRoom).emit('userTyping', Array.from(rooms[currentRoom].typing));
            io.to(currentRoom).emit('roomUsers', {
                users: Object.values(rooms[currentRoom].users)
            });

            // Leeren Raum aufräumen
            if (Object.keys(rooms[currentRoom].users).length === 0) {
                delete rooms[currentRoom];
            }
        }
    });
});

// Port von Render.com verwenden oder lokal 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`DaF-Chat Server läuft auf Port ${PORT}`);
});