const { io } = require('../server');
const { Usuarios } = require('../classes/Usuarios');
const { crearMensaje } = require('../utilidades/utilidades')

const usuarios = new Usuarios();

io.on('connection', (client) => {

    console.log('Usuario conectado');

    client.on('entrarChat', (data, callback) => {
        // console.log(data);
        if (!data.nombre || !data.sala) {
            return callback({
                error: true,
                mensaje: 'El nombre/sala es necesario'
            })
        }
        client.join(data.sala);

        usuarios.agregarPersona(client.id, data.nombre, data.sala);
        client.broadcast.to(data.sala).emit('listaPersonas', usuarios.getPersonaPorSala(data.sala));
        client.broadcast.to(data.sala).emit('crearMensaje',
            crearMensaje('Admin', `${ data.nombre } ha se unió`)
        );
        callback(usuarios.getPersonaPorSala(data.sala));
    });

    client.on('crearMensaje', (data, callback) => {
        let persona = usuarios.getPersona(client.id);
        let mensaje = crearMensaje(persona.nombre, data.mensaje);
        client.broadcast.to(persona.sala).emit('crearMensaje', mensaje);
        callback(mensaje);
    });


    client.on('disconnect', () => {
        let personaEliminada = usuarios.borrarPersona(client.id);
        console.log('Usuario desconectado', personaEliminada);

        client.broadcast.to(personaEliminada.sala).emit('crearMensaje',
            crearMensaje('Admin', `${ personaEliminada.nombre } ha dejado el chat`)
        );
        /* client.broadcast.emit('crearMensaje', {
            usuario: 'Administrador',
            mensaje: `${ personaEliminada.nombre } ha dejado el chat`
        }); */
        client.broadcast.to(personaEliminada.sala).emit('listaPersonas', usuarios.getPersonaPorSala(personaEliminada.sala));

    });
    client.on('mensajePrivado', data => {
        let persona = usuarios.getPersona(client.id);
        client.broadcast.to(data.para).emit('mensajePrivado', crearMensaje(persona.nombre, data.mesaje));
    });


});