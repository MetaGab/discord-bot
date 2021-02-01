var Discord = require('discord.js');
var fetch = require('cross-fetch');
var auth = require('./auth.json');
var say = require('say');
const path = require('path');
const ytdl = require('ytdl-core');
const fs = require('fs');
var duels = [];

var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});

var voice = "";

bot.on('ready', function (evt) {	
    console.log("Ya cargo el bot")
});

bot.login(auth.token);

let i = 0;

bot.on('message', function (msg, evt) {
    if (msg.content.substring(0, 1) == '%') {
        var args = msg.content.substring(1).split(/ (.*)/);
        switch(args[0]) {
			case 'ruleta':
				var opciones = args[1].split("|");
				msg.channel.send(opciones[Math.floor(Math.random() * opciones.length)]);
				break;
            case 'roll':
            	msg.channel.send(rollDie(args[1]));
            	break;
            case 'flip':
            	var result = flipCoin();
            	msg.channel.send("The result is "+result+"!",{files:[{attachment:"./"+result+".png"}]});
            	break;
            case 'rps':
            	var serverID = msg.guild;
            	createDuel(serverID, msg.channel, msg.author, args[1]);
            	break;
            case 'rock':
            	updateDuel(msg.author,"rock");
            	break;
            case 'paper':
           	 	updateDuel(msg.author,"paper");
            	break;
            case 'scissors':
            	updateDuel(msg.author,"scissors");
            	break;
			case 'banda':
				randomTrope(msg.channel);
				break;
			case 'oliver':
				if (msg.author.username == "MetaGab"){
					var voice = msg.member.voice;
					if (voice && voice.channel){
						//voice.setChannel(msg.guild.afkChannel);
						voice.channel.members.forEach(function(member){
							member.voice.setChannel(msg.guild.afkChannel);
						});
					} 
				}
				break;
            case 'jutsu':
            	msg.channel.send("Shinra tensei",{files:[{attachment:"./shinratensei.gif"}]});
				break;
			case 'config':
				msg.channel.send("http://leoni.herokuapp.com/bot/" + msg.guild.id)
				break;
			case 'join':
				if (msg.member.voice.channel) {
					voice = msg.member.voice.channel;
					voice.join();
					setVoice(voice);
				}
				break;
			case 'di':
				var opciones = args[1].split("|");
				if(opciones.length == 1){
					
				say.export(args[1], "Microsoft Sabina Desktop", 1, path.join(__dirname, 'thing.wav'), (err) => {
					hablar();
				});
				}
				else{
					say.export(opciones[0], "Microsoft Sabina Desktop", opciones[1], path.join(__dirname, 'thing.wav'), (err) => {
					hablar();
				});
				}
				break;
			case 'adios':
				salir();
				break;
			case 'aldeano':
				aldeano();
				break;
			case 'play':
					play(args[1]);
				break;
			default:
				if(msg.guild){
					webCommand(args[0], msg.channel);
				}
				break;
         }
     }
});

function salir(){
	voice.leave();
}

function setVoice(voice_channel){
	voice = voice_channel;
}

function play(song){
	voice.join().then(connection => connection.play(ytdl(song)));
}
function hablar(){
	voice.join().then(connection => connection.play('thing.wav'));
}
function aldeano(){
	voice.join().then(connection => connection.play('aldeano.mp3'));
}


function rollDie(typeOfDie="aaaa"){
	if (typeOfDie.substring(0,1)=='d') {
		 var numOfSides = parseInt(typeOfDie.substring(1));
		 if (numOfSides == NaN) {
		 	return "Write a valid number after d"
		 }
		 return "Result of your "+typeOfDie+": "+Math.ceil(Math.random()*numOfSides).toString();
	}
	return "Type d<number> to roll a die with that number of sides"
}

function flipCoin(){
	var coin = Math.random();
	 if (coin < .5) {
	 	return "aguila";
	 }
	 return "sello";
}

function createDuel(server, channel, dueler1, dueler2name){
	var dueler2;
	if (dueler2name == "MetaBot") {
		dueler1.send("Rock-Paper-Scissors! What are you going to use against me?");
		var choice = ["rock","paper","scissors"]
		dueler2 = server.members.get(bot.user.id);
		duels.push([channel, dueler1, dueler2,"null",choice[Math.floor(Math.random()*3)],server]);
		return;
	}
	server.members.cache.forEach(function(member){
		if (member.nickname == dueler2name || member.user.username == dueler2name) {
	 		dueler2 = member;
	 	}
	})
	dueler1.send("Rock-Paper-Scissors! What are you going to use against " +dueler2.user.username+"? (%rock, %paper, %scissors)"); 
	dueler2.send("Rock-Paper-Scissors! What are you going to use against " +dueler1.username+"? (%rock, %paper, %scissors)"); 
	duels.push([channel, dueler1, dueler2,"null","null",server]);
}

function updateDuel(user, choice){
	for (var i = 0; i< duels.length; i++){
		if(duels[i][1].id==user.id && duels[i][3] == "null"){
			duels[i][3] = choice;
			if (duels[i][3]!="null"&&duels[i][4]!="null") {
				endDuel(duels[i]);
			}
			return;
		}
		else if (duels[i][2].id==user.id && duels[i][4] == "null") {
			duels[i][4] = choice;
			if (duels[i][3]!="null"&&duels[i][4]!="null") {
				endDuel(duels[i]);
			}
			return;
		}
	}
	user.send("You are not on a duel!");
}

function endDuel(duel){
	var message;
	if (duel[3] == duel[4]) {
		message = "It's a tie!"
	}
	else if(duel[3]=="rock"&&duel[4]=="paper"){
		message = duel[2].user.username +" won!";
	}
	else if(duel[3]=="rock"&&duel[4]=="scissors"){
		message = duel[1].username +" won!";
	}
	else if(duel[3]=="paper"&&duel[4]=="rock"){
		message = duel[1].username +" won!";
	}
	else if(duel[3]=="paper"&&duel[4]=="scissors"){
		message = duel[2].user.username +" won!";
	}
	else if(duel[3]=="scissors"&&duel[4]=="paper"){
		message = duel[1].username +" won!";
	}
	else if(duel[3]=="scissors"&&duel[4]=="rock"){
		message = duel[2].user.username +" won!";
	}
	duel[0].send("The result of the duel between "+
        	duel[1].username+ " and "+
        	duel[2].user.username + " is: "+message
    );
	duels.splice(duels.indexOf(duel),1);
}

function randomTrope(channel){
	fetch('//tvtropes.org/pmwiki/randomitem.php?p=1')
	.then(res => {
		channel.send(res.url)
  })
}

function webCommand(arg, channel){
	fetch('//leoni.herokuapp.com/api/command?command='+arg+'&server='+channel.guild.id)
	.then(res => {
		return res.json();
  }).then(com => {
	  if(com[0]){
		channel.send(com[0].say);
	  }
  })
}