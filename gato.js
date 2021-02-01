const Discord = require("discord.js")
const auth = require('./auth.json');

const bot = new Discord.Client({
    token: auth.token,
    autorun: true
});
bot.login(auth.token);

var board = [   ['↖️','⬆️','↗️'], 
                ['⬅️','⏺️','➡️'], 
                ['↙️','⬇️','↘️']];


var ficha = 'nada';

function changeBoard(emoji){
    for(var row of board){
        for(var cell of row){
            if (cell === emoji){
                board[board.indexOf(row)][row.indexOf(cell)] = ficha;
            }
        }
    }
}

function getGameEmbed(){
    var gameEmbed = {
        color: 0x0099ff,
        title: "GATO MIAU",
        description: ``,
    }
    for(const row of board){
        for(const cell of row){
            gameEmbed.description += cell;
        }
        gameEmbed.description +=  `\n`;
    }
    return gameEmbed;
}

function checkGame(channel){
    if ((board[0][0] === board[1][1] && board[1][1] === board[2][2]) || (board[0][2] === board[1][1] && board[1][1] === board[2][0])){
        channel.send("Ganan "+board[1][1]);
        return true;
    }
    for(const row of board){
        if(row[0] === row[1] && row[1] === row[2]){
            channel.send("Ganan "+row[0]);
            return true;
        }
    }
    for(var i=0; i<3; i++){
        if(board[0][i] === board[1][i] &&  board[1][i] === board[2][i]){
            channel.send("Ganan "+board[0][i]);
            return true;
        }
    }
    if (board.every(row => row.every(cell => ['⭕','❌'].includes(cell)))){
        channel.send('Empate');
        return true;
    }
    return false;
}

bot.on('message', function (msg, evt) {
    
    if (!msg.content.startsWith('%') || msg.author.bot) return;
    var args = msg.content.substring(1).split(/ (.*)/);
    switch(args[0]) {
        case 'gato':
            board = [ ['↖️','⬆️','↗️'], 
                    ['⬅️','⏺️','➡️'], 
                    ['↙️','⬇️','↘️']];
            ficha = 'nada';
            msg.channel.send({embed:getGameEmbed()}).then(msg => {
                for(const row of board){
                    for(const cell of row){
                        msg.react(cell);
                    }
                }
                const filter = (reaction, user) => board.some(row => row.includes(reaction.emoji.name)) && !['⭕','❌'].includes(reaction.emoji.name);
                const collector = msg.createReactionCollector(filter, {time:3600000});
                collector.on('collect', (r,u)=>{
                    if(u.bot) return;
                    if (ficha === '⭕'){
                        ficha = '❌';
                    }
                    else{
                        ficha = '⭕';
                    }
                    changeBoard(r.emoji.name);
                    msg.edit({embed: getGameEmbed()});
                    r.remove();
                    if(checkGame(msg.channel)){
                        collector.stop();
                    }
                })
            });
            break;
    }
});