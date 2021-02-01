const Discord = require("discord.js")
const auth = require('./auth.json');

const bot = new Discord.Client({
    token: auth.token,
    autorun: true
});
bot.login(auth.token);

const startEmbed = {
    color: 0x0099ff,
    title: "Asesino",
	description: 'Selecciona ✅ para unirte al juego',
}

const descriptionRol = {
    'Aldeano': 'Tu rol es votar en cada día para matar a los asesinos',
    'Médico': 'Tu rol es prevenir que alguien muera durante la noche',
    'Investigador': 'Tu rol es preguntar cada noche si alguien es asesino',
    'Drogadicto': 'Tu rol es drogar a alguien cada noche y prevenir que use sus poderes',
    'Asesino': 'Tu rol es matar al resto de la aldea'
}

const emojiChoices = ['🇦','🇧','🇨','🇩','🇪','🇫','🇬','🇭','🇮','🇯','🇰','🇱'];

var game = {
    roles: [],
    players: [],
    round: 1,
    time: "noche",
    active: true
}

function getRole(){
    console.log(game.roles);
    const role = game.roles[Math.floor(Math.random() * game.roles.length)];
    game.roles = game.roles.filter(v => v !== role);
    console.log(game.roles);
    return role;
}

bot.on('message', function (msg, evt) {
    if (!msg.content.startsWith('%') || msg.author.bot) return;
    var args = msg.content.substring(1).split(/ (.*)/);
    switch(args[0]) {
        case 'iniciar':
            game = {
                roles: [],
                players: [],
                round: 1,
                time: "noche",
                active: true
            }
            const filter = (reaction, user) => reaction.emoji.name === '✅';
            msg.channel.send({embed:startEmbed}).then(msg => {
                msg.react('✅');
                msg.awaitReactions(filter, {time: 35000, maxUsers: parseInt(args[1])+1}).then(collected => {
                    const players = collected.first().users.cache
                    players.sweep(user => user.bot);
                    game.roles = game.roles.concat(Array(1).fill("Asesino"));
                    game.roles = game.roles.concat(Array(1).fill("Médico"));
                    game.roles.push("Investigador", "Drogadicto");
                    if(players.length > 4){
                        game.roles = game.roles.concat(Array(players.size-4).fill("Aldeano"))
                    }
                    
                    var initialMsg = "Van a jugar ";
                    players.each(client => {
                        const p = {
                            client: client,
                            role: getRole(),
                            alive: true,
                            drugged: false
                        }
                        game.players.push(p);
                        initialMsg += client.username + ", "
                        client.send({embed : {
                            color: 0x0099ff,
                            title: `Eres un ${p.role}`,
                            description: descriptionRol[p.role],}})
                    })
                    msg.channel.send(initialMsg.slice(0,-1));
                    const channel = msg.channel;
                    msg.delete();
                    gameRound(channel);
                })
            });
            break;
        }
});

async function gameRound(channel){
    var killed = false;
    var saved = undefined;
    channel.send({embed : {
        color: 0x0099ff,
        title: `Es la ${game.time} de la ronda ${game.round}`,
        description: "Todos duermen..." 
    }})
    const drog = game.players.find(p => p.role === "Drogadicto" && p.alive == true);
    if (drog !== undefined){
        var drugEmbed = {
            color: 0x0099ff,
            title: `Drogadicto asqueroso, ¿A quien vas a drogar hoy?`,
            fields: []
        }
        game.players.filter(p => p.alive && p != drog).forEach((p, i) => {
            drugEmbed.fields.push({
                name: emojiChoices[i],
                value: p.client.username,
                inline: true
            })
        });
        var msg = await drog.client.send({embed : drugEmbed});
        drugEmbed.fields.forEach(d => msg.react(d.name));
        const filter = (reaction, user) => true;
        var collected = await msg.awaitReactions(filter, {time: 600000, maxUsers:2});
        const twoReact = collected.find(r => r.count == 2);
        game.players.find(p => p.client.username == drugEmbed.fields.find(f => f.name == twoReact.emoji.name).value).drugged = true;
        await drog.client.send("Haz drogado, ahora a dormir...");
    }
    const inv = game.players.find(p => p.role === "Investigador" && p.alive == true);
    if (inv !== undefined){
        if(inv.drugged){
            inv.drugged = false;
            await inv.client.send("Parece que te han drogado...")
        }
        else{
            var invEmbed = {
                color: 0x0099ff,
                title: `Investigador curioso, ¿A quien vas a investigar hoy?`,
                fields: []
            }
            game.players.filter(p => p.alive && p!=inv).forEach((p, i) => {
                invEmbed.fields.push({
                    name: emojiChoices[i],
                    value: p.client.username,
                    inline: true
                })
            })
    
            var msg = await inv.client.send({embed : invEmbed});
            invEmbed.fields.forEach(d => msg.react(d.name));
            const filter = (reaction, user) => true;
            var collected = await msg.awaitReactions(filter, {time: 600000, maxUsers:2})
            const twoReact = collected.find(r => r.count == 2);
            const investigated = game.players.find(p => p.client.username == invEmbed.fields.find(f => f.name == twoReact.emoji.name).value);
            if (investigated.role == "Asesino"){
                await inv.client.send("Haz encontrado a un asesino, ahora a dormir...")
            }
            else{
                await inv.client.send("Parece que no es sospechoso, ahora a dormir...")
            }

        }
    }
    const medics = game.players.filter(p => p.role === "Médico" && p.alive == true);
    if (medics.length == 1){
        const medic = medics[0];
        if(medic.drugged){
            medic.drugged = false;
            await medic.client.send("Parece que te han drogado...")
        }
        else{
            var medicEmbed = {
                color: 0x0099ff,
                title: `Médico honorable, ¿A quien vas a curar hoy?`,
                fields: []
            }
            game.players.filter(p => p.alive).forEach((p, i) => {
                medicEmbed.fields.push({
                    name: emojiChoices[i],
                    value: p.client.username,
                    inline: true
                })
            })
    
            var msg = await medic.client.send({embed : medicEmbed});
            medicEmbed.fields.forEach(d => msg.react(d.name));
            const filter = (reaction, user) => true;
            var collected = await msg.awaitReactions(filter, {time: 600000, maxUsers:2})
            const twoReact = collected.find(r => r.count == 2);
            saved = game.players.find(p => p.client.username == medicEmbed.fields.find(f => f.name == twoReact.emoji.name).value);
            if (saved == medic){
                await medic.client.send("Te curaste a ti mismo, ahora a dormir...")
            }
            else{
                await medic.client.send("Haz curado, ahora a dormir...")
            }

        }
    }
    const assassins = game.players.filter(p => p.role === "Asesino" && p.alive == true);
    if (assassins.length == 1){
        const assassin = assassins[0];
        if(assassin.drugged){
            assassin.drugged = false;
            await assassin.client.send("Parece que te han drogado...")
        }
        else{
            var assEmbed = {
                color: 0x0099ff,
                title: `Asesino maldito, ¿A quien vas a matar hoy?`,
                fields: []
            }
            game.players.filter(p => p.alive).forEach((p, i) => {
                assEmbed.fields.push({
                    name: emojiChoices[i],
                    value: p.client.username,
                    inline: true
                })
            })
    
            var msg = await assassin.client.send({embed : assEmbed});
            assEmbed.fields.forEach(d => msg.react(d.name));
            const filter = (reaction, user) => true;
            var collected = await msg.awaitReactions(filter, {time: 600000, maxUsers:2})
            const twoReact = collected.find(r => r.count == 2);
            killed = game.players.find(p => p.client.username == assEmbed.fields.find(f => f.name == twoReact.emoji.name).value);
            if (saved == killed){
                killed = false;
            }
            else{
                killed.alive = false;
            }
            await assassin.client.send("Haz matado, ahora a dormir...")

        }
    }

    
    game.time = "día";
    channel.send({embed : {
        color: 0x0099ff,
        title: `Es el ${game.time} de la ronda ${game.round}`,
        description: "Todos despiertan..." 
    }})
    if(killed !== false){
        channel.send(`Excepto por ${killed.client.username}, estas muerto`)
    }
    
    if(game.players.every(p => p.role != "Asesino" || p.alive == false)){
        channel.send("¡Gana el pueblo bueno!");
        game.active = false;
        return;
    }
    if(game.players.filter(p => p.role == "Asesino" && p.alive == true).length >= game.players.filter(p=> p.role != "Asesino" && p.alive == true).length){
        channel.send("¡Ganan los asesinos!");
        game.active = false;
        return;
    } 

    var votEmbed = {
        color: 0x0099ff,
        title: `¿El pueblo demanda sangre, quien debe de morir?`,
        fields: []
    }
    game.players.filter(p => p.alive).forEach((p, i) => {
        votEmbed.fields.push({
            name: emojiChoices[i],
            value: p.client.username,
            inline: true
        })
    })
    
    var msg = await channel.send({embed : votEmbed});
    for(const f of votEmbed.fields){
        await msg.react(f.name);
    }
    const filter = (reaction, user) => true;
    const collector = msg.createReactionCollector(filter, {time:3600000, dispose: true});
    var voted = [];
    collector.on('collect', (r,u)=>{
        if(u.bot) return;
        if(game.players.find(p => p.client == u && p.alive == true) === undefined){
            r.users.remove(u);
            return;
        }
        if (voted.includes(u)){
            r.users.remove(u);
            return;
        }
        else{
            voted.push(u);
        }
        if (voted.length == game.players.filter(p => p.alive).length){
            var max_vote = 1;
            var rep = 0;
            collector.collected.each(r => {
                if (r.count > max_vote){
                    max_vote = r.count;
                    rep = 0;
                    killed = game.players.find(p => p.client.username == votEmbed.fields.find(f => f.name == r.emoji.name).value)
                }
                else if (r.count == max_vote){
                    rep++;
                }
            })
            if(rep==0){
                collector.stop()
            }
        }
    })
    collector.on('remove', (r,u)=>{
        if (voted.includes(u)){
            voted = voted.filter(item => item !== u);
        }
        var has_voted = false;
        collector.collected.each(r=>{
            if(r.users.cache.some(user => user == u)){
                has_voted = true;
            }
        })
        if (has_voted){
            voted.push(u);
        }
    })
    collector.on('end', collected=>{
        killed.alive = false;
        killed = killed.client.username;
        channel.send(`El pueblo ha votado y ahora ${killed} esta muerto`);
        if(game.players.every(p => p.role != "Asesino" || p.alive == false)){
            channel.send("¡Gana el pueblo bueno!");
            game.active = false;
            return;
        }
        if(game.players.filter(p => p.role == "Asesino" && p.alive == true).length >= game.players.filter(p=> p.role != "Asesino" && p.alive == true).length){
            channel.send("¡Ganan los asesinos!");
            game.active = false;
            return;
        }
        game.round++;
        game.time = "noche";
        gameRound(channel);
    })
}